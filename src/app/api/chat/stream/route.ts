import { NextRequest, NextResponse } from 'next/server';
import { AIService, SessionContext } from '@/lib/services/aiServiceClaude';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';

const aiService = new AIService();

export async function POST(req: NextRequest) {
  try {
    const { sessionId, messages, stage, context } = await req.json();

    // Validate required fields
    if (!sessionId || !messages || !Array.isArray(messages)) {
      console.error('[STREAM_API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, messages' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      console.error('[STREAM_API] Last message must be from user');
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    console.log('[STREAM_API] Processing request:', {
      sessionId,
      messageCount: messages.length,
      currentStage: stage,
      lastMessagePreview: lastMessage.content.substring(0, 50)
    });

    // Check if we should progress to next stage (wrapped in try-catch)
    let progressionCheck;
    try {
      progressionCheck = await aiService.shouldProgressStage(messages, (stage as SessionContext['stage']) || 'initial');
      console.log('[STREAM_API] Progression check result:', progressionCheck);
    } catch (error) {
      console.error('[STREAM_API] Error in shouldProgressStage:', error);
      // Continue with current stage if progression check fails
      progressionCheck = { shouldProgress: false };
    }

    let currentStage = (stage as SessionContext['stage']) || 'initial';

    if (progressionCheck.shouldProgress && progressionCheck.nextStage) {
      currentStage = progressionCheck.nextStage;
      console.log('[STREAM_API] ✅ Stage progressed:', stage, '->', currentStage);
    } else {
      console.log('[STREAM_API] Stage unchanged:', currentStage);
    }

    // Build session context
    const sessionContext: SessionContext = {
      stage: currentStage,
      messageCount: messages.length,
      extractedThemes: context?.themes || []
    };

    // Database operations (wrapped in try-catch for better error handling)
    let supabase, authUserId, authUserEmail;
    try {
      // Get verified user using the new helper
      const user = await getVerifiedUser();
      authUserId = user?.id || null;
      authUserEmail = user?.email || null;

      supabase = await createServerSupabaseClient();

      console.log('[STREAM_API] Auth status:', { authUserId: !!authUserId });

      if (authUserId) {
        const { data: existingSession, error: sessionFetchError } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (sessionFetchError) {
          console.error('[STREAM_API] Error fetching session:', sessionFetchError);
        }

        if (!existingSession) {
          const { error: insertError } = await supabase.from('user_sessions').insert({
            session_id: sessionId,
            user_id: authUserId,
            current_stage: currentStage,
            completed: false,
            session_type: 'chat'
          });
          if (insertError) {
            console.error('[STREAM_API] Error inserting session:', insertError);
          }
        } else if (progressionCheck.shouldProgress && progressionCheck.nextStage) {
          const { error: updateError } = await supabase
            .from('user_sessions')
            .update({
              current_stage: currentStage,
              updated_at: new Date().toISOString(),
              user_id: authUserId
            })
            .eq('session_id', sessionId);
          if (updateError) {
            console.error('[STREAM_API] Error updating session:', updateError);
          }
        }
      }
    } catch (dbError) {
      console.error('[STREAM_API] Database error (non-fatal):', dbError);
      // Don't fail the entire request on database errors
    }

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';
    let strengthsSnapshot: any = null;

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          const metadata = {
            type: 'metadata',
            stage: currentStage,
            sessionId: sessionId
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));

          // Stream AI response
          for await (const chunk of aiService.generateStreamingResponse(messages, sessionContext)) {
            fullResponse += chunk;
            const data = {
              type: 'content',
              content: chunk
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          }

          // Handle strength analysis for summary stage
          // CRITICAL: Check if this is the FIRST message in summary stage to generate strengths
          const isFirstSummaryMessage = currentStage === 'summary' && messages.length >= 4;

          if (isFirstSummaryMessage) {
            console.log('[STREAM_API] Generating strengths analysis for summary stage');
            try {
              const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
              const strengths = await aiService.analyzeStrengths(conversationHistory);

              console.log('[STREAM_API] Strengths analyzed:', {
                skills: strengths.skills?.length || 0,
                attitudes: strengths.attitudes?.length || 0,
                values: strengths.values?.length || 0
              });

              // Store for later database save
              strengthsSnapshot = strengths;

              // === SAVE TO DATABASE for cross-module access ===
              if (authUserId && strengths && !strengths.invalid) {
                // Prepare compact strength data
                const compactStrengths = [
                  ...(strengths.skills || []).slice(0, 5).map(skill => ({
                    name: skill,
                    category: 'skill',
                    description: `Identified from conversation analysis`,
                  })),
                  ...(strengths.attitudes || []).slice(0, 5).map(attitude => ({
                    name: attitude,
                    category: 'attitude',
                    description: `Behavioral strength`,
                  })),
                  ...(strengths.values || []).slice(0, 5).map(value => ({
                    name: value,
                    category: 'value',
                    description: `Core value identified`,
                  })),
                ];

                // Save to strength_discovery_results for cross-module use
                await supabase.from('strength_discovery_results').upsert({
                  user_id: authUserId,
                  final_strengths: compactStrengths,
                  summary: `Skills: ${(strengths.skills || []).slice(0, 3).join(', ')}\nAttitudes: ${(strengths.attitudes || []).slice(0, 3).join(', ')}\nValues: ${(strengths.values || []).slice(0, 3).join(', ')}`,
                  conversation_history: conversationHistory.substring(0, 5000),
                  insights: {
                    generated_at: new Date().toISOString(),
                    skills_count: strengths.skills?.length || 0,
                    attitudes_count: strengths.attitudes?.length || 0,
                    values_count: strengths.values?.length || 0,
                    session_id: sessionId,
                    insights: [
                      `Identified ${strengths.skills?.length || 0} key skills`,
                      `Identified ${strengths.attitudes?.length || 0} work attitudes`,
                      `Identified ${strengths.values?.length || 0} core values`,
                    ]
                  },
                  is_completed: true,
                  current_step: 5,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id',
                  ignoreDuplicates: false
                });

                console.log('[STREAM_API] ✅ Strengths saved for cross-module access');
              } else {
                console.log('[STREAM_API] ⚠️ Skipping database save:', {
                  hasAuth: !!authUserId,
                  hasStrengths: !!strengths,
                  isInvalid: strengths?.invalid
                });
              }

              // CRITICAL: ALWAYS send strengths to client, even if DB save fails
              const strengthsData = {
                type: 'strengths',
                strengths: strengths
              };
              console.log('[STREAM_API] Sending strengths to client');
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(strengthsData)}\n\n`));
            } catch (error) {
              console.error('[STREAM_API] ❌ Strength analysis error:', error);
              // Send fallback strengths
              const fallbackStrengths = {
                skills: ['Problem-solving', 'Communication', 'Leadership'],
                attitudes: ['Persistence', 'Curiosity', 'Collaboration'],
                values: ['Excellence', 'Impact', 'Growth']
              };
              const strengthsData = {
                type: 'strengths',
                strengths: fallbackStrengths
              };
              console.log('[STREAM_API] Sending fallback strengths to client');
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(strengthsData)}\n\n`));
            }
          } else {
            console.log('[STREAM_API] Skipping strengths analysis:', {
              currentStage,
              messageCount: messages.length,
              isFirstSummary: isFirstSummaryMessage
            });
          }

          // Send completion signal
          const completion = {
            type: 'complete',
            fullResponse: fullResponse,
            stage: currentStage
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`));

          if (authUserId) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.role === 'user') {
              const userMessageData = {
                session_id: sessionId,
                user_id: authUserId,
                role: 'user',
                content: lastMessage.content,
                metadata: {
                  stage: currentStage,
                  timestamp: new Date().toISOString()
                }
              };

              const assistantMessageData = {
                session_id: sessionId,
                user_id: authUserId,
                role: 'assistant',
                content: fullResponse,
                metadata: {
                  stage: currentStage,
                  timestamp: new Date().toISOString(),
                  messageCount: messages.length + 1
                }
              };

              const { error: messageError } = await supabase
                .from('conversation_messages')
                .insert([userMessageData, assistantMessageData]);

              if (messageError) {
                console.error('[CHAT_STREAM] Failed to save conversation:', messageError);
              }
            }

            if (strengthsSnapshot) {
              await supabase.from('strength_profiles').insert({
                session_id: sessionId,
                user_id: authUserId,
                user_email: authUserEmail,
                strengths: strengthsSnapshot,
                summary: 'Generated from streaming conversation analysis',
                insights: { generated_at: new Date().toISOString() }
              });
            }

            if (currentStage === 'summary') {
              await supabase
                .from('user_sessions')
                .update({ completed: true })
                .eq('session_id', sessionId);
            }
          }
          
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = {
            type: 'error',
            error: 'Failed to generate response'
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
