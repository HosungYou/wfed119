import { NextRequest, NextResponse } from 'next/server';
import { AIService, SessionContext } from '@/lib/services/aiServiceClaude';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';

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

    // Get verified user using the new helper
    const user = await getVerifiedUser();
    const authUserId = user?.id || null;
    const authUserEmail = user?.email || null;

    // Get supabase client for database operations
    const supabase = await createServerSupabaseClient();

    // Ensure session exists in database
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!existingSession) {
      await supabase.from('user_sessions').insert({
        session_id: sessionId,
        user_id: authUserId,
        current_stage: stage || 'initial',
        completed: false,
        session_type: 'chat'
      });
    }

    // Check if we should progress to next stage BEFORE generating response
    const progressionCheck = await aiService.shouldProgressStage(messages, (stage as SessionContext['stage']) || 'initial');
    let currentStage = (stage as SessionContext['stage']) || 'initial';

    if (progressionCheck.shouldProgress && progressionCheck.nextStage) {
      currentStage = progressionCheck.nextStage;

      // Update session stage in database
      await supabase
        .from('user_sessions')
        .update({
          current_stage: currentStage,
          updated_at: new Date().toISOString(),
          ...(authUserId ? { user_id: authUserId } : {})
        })
        .eq('session_id', sessionId);
    }

    // Build session context with updated stage
    const sessionContext: SessionContext = {
      stage: currentStage,
      messageCount: messages.length,
      extractedThemes: context?.themes || []
    };

    // Generate AI response with correct stage
    const response = await aiService.generateResponse(messages, sessionContext);

    // Save conversation messages to database
    if (authUserId) {
      const userId = authUserId;

      // Save user message
      const userMessageData = {
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: lastMessage.content,
        metadata: {
          stage: currentStage,
          timestamp: new Date().toISOString()
        }
      };

      // Save assistant response
      const assistantMessageData = {
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: response,
        metadata: {
          stage: currentStage,
          timestamp: new Date().toISOString(),
          messageCount: messages.length + 1
        }
      };

      // Insert both messages in a single transaction
      const { error: messageError } = await supabase
        .from('conversation_messages')
        .insert([userMessageData, assistantMessageData]);

      if (messageError) {
        console.error('[CHAT_API] Failed to save conversation:', messageError);
        // Don't fail the request if conversation saving fails
      } else {
        console.log('[CHAT_API] Conversation messages saved successfully');
      }
    } else {
      console.warn('[CHAT_API] No authenticated user - conversation not saved');
    }

    let strengths = null;

    // If we've reached summary stage, analyze strengths
    if (currentStage === 'summary' && messages.length >= 8) {
      console.log('Summary stage reached, analyzing strengths...', {
        stage: currentStage,
        messageCount: messages.length
      });
      try {
        const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        strengths = await aiService.analyzeStrengths(conversationHistory);
        console.log('Strengths analysis completed:', strengths);

        if (strengths && authUserId) {
          const userId = authUserId;

          // === CRITICAL: Save to TWO tables for cross-module compatibility ===

          // 1. Save to strength_profiles (for current session)
          await supabase.from('strength_profiles').insert({
            session_id: sessionId,
            user_id: authUserId,
            user_email: authUserEmail,
            strengths: strengths,
            summary: 'Generated from conversation analysis',
            insights: { generated_at: new Date().toISOString() }
          });

          // 2. Save to strength_discovery_results (for cross-module context)
          //    This enables other modules (Vision, SWOT) to access strength data
          const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

          // Prepare compact strength data for cross-module use
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

          await supabase.from('strength_discovery_results').upsert({
            user_id: userId,
            final_strengths: compactStrengths,
            summary: `Skills: ${(strengths.skills || []).slice(0, 3).join(', ')}\nAttitudes: ${(strengths.attitudes || []).slice(0, 3).join(', ')}\nValues: ${(strengths.values || []).slice(0, 3).join(', ')}`,
            conversation_history: conversationHistory.substring(0, 5000), // Limit size
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

          console.log('[CHAT_API] Strengths saved to both tables for cross-module access');
        }
      } catch (error) {
        console.error('Error analyzing strengths:', error);
        // Provide fallback strengths if analysis fails
        strengths = {
          skills: ['Problem-solving', 'Communication', 'Leadership', 'Facilitation', 'Mentorship', 'Team-building'],
          attitudes: ['Persistence', 'Curiosity', 'Collaboration', 'Empathetic', 'Patient', 'Encouraging'],
          values: ['Excellence', 'Impact', 'Growth', 'Trust', 'Inclusivity', 'Empowerment']
        };
      }
    }

    // Mark session as completed if we've reached summary
    if (currentStage === 'summary') {
      await supabase
        .from('user_sessions')
        .update({ completed: true })
        .eq('session_id', sessionId);
    }

    return NextResponse.json({
      response,
      stage: currentStage,
      strengths,
      metadata: {
        progressionReason: progressionCheck.reason,
        messageCount: messages.length + 1,
        sessionStage: currentStage
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error. Please check API keys.' },
          { status: 500 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
