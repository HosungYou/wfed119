import { NextRequest, NextResponse } from 'next/server';
import { AIService, SessionContext } from '@/lib/services/aiServiceClaude';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const aiService = new AIService();

export async function POST(req: NextRequest) {
  try {
    const { sessionId, messages, stage, context } = await req.json();
    
    // Validate required fields
    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, messages' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // Check if we should progress to next stage
    const progressionCheck = await aiService.shouldProgressStage(messages, (stage as SessionContext['stage']) || 'initial');
    let currentStage = (stage as SessionContext['stage']) || 'initial';
    
    if (progressionCheck.shouldProgress && progressionCheck.nextStage) {
      currentStage = progressionCheck.nextStage;
    }

    // Build session context
    const sessionContext: SessionContext = {
      stage: currentStage,
      messageCount: messages.length,
      extractedThemes: context?.themes || []
    };

    const supabase = await createServerSupabaseClient();
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const authUserId = authSession?.user?.id || null;
    const authUserEmail = authSession?.user?.email || null;

    if (authUserId) {
      const { data: existingSession } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!existingSession) {
        await supabase.from('user_sessions').insert({
          session_id: sessionId,
          user_id: authUserId,
          current_stage: currentStage,
          completed: false,
          session_type: 'chat'
        });
      } else if (progressionCheck.shouldProgress && progressionCheck.nextStage) {
        await supabase
          .from('user_sessions')
          .update({
            current_stage: currentStage,
            updated_at: new Date().toISOString(),
            user_id: authUserId
          })
          .eq('session_id', sessionId);
      }
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
          if (currentStage === 'summary' && messages.length >= 8) {
            try {
              const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
              const strengths = await aiService.analyzeStrengths(conversationHistory);
              strengthsSnapshot = strengths;
              
              const strengthsData = {
                type: 'strengths',
                strengths: strengths
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(strengthsData)}\n\n`));
            } catch (error) {
              console.error('Strength analysis error in streaming:', error);
              // Send fallback strengths
              const fallbackStrengths = {
                skills: ['Problem-solving', 'Communication', 'Leadership', 'Facilitation', 'Mentorship', 'Team-building'],
                attitudes: ['Persistence', 'Curiosity', 'Collaboration', 'Empathetic', 'Patient', 'Encouraging'],
                values: ['Excellence', 'Impact', 'Growth', 'Trust', 'Inclusivity', 'Empowerment']
              };
              const strengthsData = {
                type: 'strengths',
                strengths: fallbackStrengths
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(strengthsData)}\n\n`));
            }
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
