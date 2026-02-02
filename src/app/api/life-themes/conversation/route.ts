import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Groq from 'groq-sdk';
import {
  ConversationMessage,
  SuggestedThemeData,
  LifeThemesResponse,
  QuestionNumber,
} from '@/lib/types/lifeThemes';

const MAX_EXCHANGES = 5;
const MIN_EXCHANGES_FOR_THEMES = 3;

/**
 * GET /api/life-themes/conversation
 * Fetch the current conversation state for the user's Life Themes session
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    // Get session ID from query params or find active session
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    let session;
    if (sessionId) {
      const { data, error } = await supabase
        .from('life_themes_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      session = data;
    } else {
      // Find the most recent in-progress session
      const { data, error } = await supabase
        .from('life_themes_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'No active session found' }, { status: 404 });
      }
      session = data;
    }

    // Fetch conversation data
    const { data: conversation } = await supabase
      .from('life_themes_conversations')
      .select('*')
      .eq('session_id', session.id)
      .single();

    return NextResponse.json({
      sessionId: session.id,
      conversation: conversation ? {
        messages: conversation.messages || [],
        exchangeCount: conversation.exchange_count || 0,
        themesSuggested: conversation.themes_suggested || false,
        themesConfirmed: conversation.themes_confirmed || false,
        suggestedThemes: conversation.suggested_themes || null,
      } : null,
    });
  } catch (error) {
    console.error('[Life Themes Conversation] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/life-themes/conversation
 * Send a message and get AI response
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await request.json();
    const { sessionId, message, action } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('life_themes_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Handle action: confirm_themes
    if (action === 'confirm_themes') {
      const { error: updateError } = await supabase
        .from('life_themes_conversations')
        .update({
          themes_confirmed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('[Life Themes Conversation] Error confirming themes:', updateError);
        return NextResponse.json({ error: 'Failed to confirm themes' }, { status: 500 });
      }

      // Update session to move to findings step
      await supabase
        .from('life_themes_sessions')
        .update({
          current_step: 'findings',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      return NextResponse.json({ success: true, nextStep: 'findings' });
    }

    // Handle action: continue (continue chatting after themes suggested)
    if (action === 'continue') {
      // Just update state to allow more exchanges
      return NextResponse.json({ success: true, canContinue: true });
    }

    // Check if this is an initialization request (AI starts conversation)
    const isInitMessage = message === '__INIT__';

    // Normal message sending - require non-empty message unless it's init
    if (!isInitMessage && (!message || typeof message !== 'string' || message.trim().length === 0)) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch or create conversation
    let { data: conversation } = await supabase
      .from('life_themes_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!conversation) {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('life_themes_conversations')
        .insert({
          session_id: sessionId,
          messages: [],
          exchange_count: 0,
          themes_suggested: false,
          themes_confirmed: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Life Themes Conversation] Error creating conversation:', createError);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
      conversation = newConversation;
    }

    const messages: ConversationMessage[] = conversation.messages || [];
    const exchangeCount = conversation.exchange_count || 0;

    // For init messages, don't add user message or increment exchange count
    // Just generate the initial AI greeting
    if (!isInitMessage) {
      // Add user message only for real messages
      const userMessage: ConversationMessage = {
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };
      messages.push(userMessage);
    }

    // Fetch Q1-Q6 responses for context
    const { data: responses } = await supabase
      .from('life_themes_responses')
      .select('question_number, response_data')
      .eq('session_id', sessionId)
      .order('question_number');

    // Fetch Enneagram data if available
    const { data: enneagramData } = await supabase
      .from('enneagram_results')
      .select('primary_type, wing, instinct')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Generate AI response
    const apiKey = process.env.GROQ_API_KEY;
    let aiResponse: string;
    let suggestedThemes: SuggestedThemeData[] | null = null;

    // Only increment exchange count for real user messages, not init
    const newExchangeCount = isInitMessage ? exchangeCount : exchangeCount + 1;

    // Should suggest themes when: 3+ real exchanges AND themes not already suggested
    const shouldSuggestThemes = !isInitMessage &&
      newExchangeCount >= MIN_EXCHANGES_FOR_THEMES &&
      !conversation.themes_suggested;

    console.log('[Life Themes Conversation] Exchange info:', {
      isInitMessage,
      exchangeCount,
      newExchangeCount,
      shouldSuggestThemes,
      themes_suggested: conversation.themes_suggested,
    });

    if (!apiKey || apiKey.length < 10) {
      // Fallback response without AI
      aiResponse = generateFallbackResponse(messages, newExchangeCount, shouldSuggestThemes);
      if (shouldSuggestThemes) {
        suggestedThemes = generateFallbackThemes(responses || []);
      }
    } else {
      const groq = new Groq({ apiKey });
      const result = await generateAIResponse(
        groq,
        messages,
        responses || [],
        enneagramData,
        newExchangeCount,
        shouldSuggestThemes
      );
      aiResponse = result.response;
      suggestedThemes = result.themes;
    }

    // Add AI message
    const aiMessage: ConversationMessage = {
      role: 'ai',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };
    messages.push(aiMessage);

    // Update conversation in database
    const updateData: any = {
      messages,
      exchange_count: newExchangeCount,
      updated_at: new Date().toISOString(),
    };

    // Only mark themes_suggested = true if we actually have themes with content
    // This prevents the flag from being set on empty arrays
    const hasValidThemes = suggestedThemes && Array.isArray(suggestedThemes) && suggestedThemes.length > 0;

    if (shouldSuggestThemes && hasValidThemes) {
      updateData.themes_suggested = true;
      updateData.suggested_themes = suggestedThemes;
      console.log('[Life Themes Conversation] Themes generated:', suggestedThemes.length);
    } else if (shouldSuggestThemes && !hasValidThemes) {
      console.warn('[Life Themes Conversation] shouldSuggestThemes=true but no valid themes generated');
    }

    const { error: updateError } = await supabase
      .from('life_themes_conversations')
      .update(updateData)
      .eq('id', conversation.id);

    if (updateError) {
      console.error('[Life Themes Conversation] Error updating conversation:', updateError);
      return NextResponse.json({ error: 'Failed to save conversation' }, { status: 500 });
    }

    // Only indicate themes suggested if we actually have valid themes
    const actuallyHasThemes = shouldSuggestThemes && hasValidThemes;

    return NextResponse.json({
      message: aiMessage,
      exchangeCount: newExchangeCount,
      themesSuggested: actuallyHasThemes,
      suggestedThemes: actuallyHasThemes ? suggestedThemes : null,
      canContinue: newExchangeCount < MAX_EXCHANGES,
    });
  } catch (error) {
    console.error('[Life Themes Conversation] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

async function generateAIResponse(
  groq: Groq,
  messages: ConversationMessage[],
  responses: { question_number: number; response_data: any }[],
  enneagramData: { primary_type: number; wing: number; instinct: string } | null,
  exchangeCount: number,
  shouldSuggestThemes: boolean
): Promise<{ response: string; themes: SuggestedThemeData[] | null }> {
  // Build context from Q1-Q6 responses
  const responseSummary = responses.map(r => {
    const q = r.question_number as QuestionNumber;
    return `Q${q}: ${JSON.stringify(r.response_data)}`;
  }).join('\n');

  const conversationHistory = messages
    .map(m => `${m.role === 'ai' ? 'AI' : 'User'}: ${m.content}`)
    .join('\n\n');

  const enneagramContext = enneagramData
    ? `User's Enneagram Type: ${enneagramData.primary_type}w${enneagramData.wing} (${enneagramData.instinct} instinct)`
    : '';

  let prompt: string;

  if (shouldSuggestThemes) {
    prompt = `You are a career counselor conducting a Career Construction Interview (Mark Savickas methodology).

${enneagramContext}

## User's Previous Responses (Q1-Q6):
${responseSummary}

## Conversation So Far:
${conversationHistory}

## Task:
Based on the conversation and all previous responses, do the following:

1. Provide a warm, insightful response (2-3 sentences) that acknowledges what the user shared.

2. Then suggest 3-5 life themes you've identified from their responses and conversation. Each theme should:
   - Have a clear, descriptive name
   - Include a brief description
   - List specific evidence from their responses that supports this theme
   - Have a confidence score (0-100)

Return JSON with exactly this structure:
{
  "response": "Your conversational response here...",
  "themes": [
    {
      "name": "Theme Name",
      "description": "Brief description of this theme",
      "evidence": ["Evidence 1 from responses", "Evidence 2", "Evidence 3"],
      "confidence": 85
    }
  ]
}`;
  } else {
    prompt = `You are a career counselor conducting a Career Construction Interview (Mark Savickas methodology).

${enneagramContext}

## User's Previous Responses (Q1-Q6):
${responseSummary}

## Conversation So Far:
${conversationHistory}

## Task:
This is exchange ${exchangeCount} of 3-5.

Based on the user's responses to Q1-Q6 and the conversation so far, ask ONE clarifying question that:
1. Digs deeper into a pattern or theme you notice
2. Connects their different answers (e.g., linking role models to hobbies)
3. Is warm, conversational, and shows you're genuinely interested
4. Is personalized to their Enneagram type if available (use gentle, appropriate language)

Keep your response to 2-4 sentences: a brief acknowledgment + your question.

Return ONLY your response text, no JSON.`;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: shouldSuggestThemes ? 2000 : 500,
      messages: [{ role: 'user', content: prompt }],
      ...(shouldSuggestThemes ? { response_format: { type: 'json_object' } } : {}),
    });

    const content = completion.choices[0]?.message?.content || '';

    if (shouldSuggestThemes) {
      try {
        const parsed = JSON.parse(content);
        return {
          response: parsed.response || 'I\'ve analyzed your responses and identified some key themes. Let me share them with you.',
          themes: (parsed.themes || []).map((t: any) => ({
            name: t.name || 'Unnamed Theme',
            description: t.description || '',
            evidence: Array.isArray(t.evidence) ? t.evidence : [],
            confidence: typeof t.confidence === 'number' ? t.confidence : 75,
          })),
        };
      } catch {
        return {
          response: content,
          themes: generateFallbackThemes(responses),
        };
      }
    } else {
      return { response: content.trim(), themes: null };
    }
  } catch (error) {
    console.error('[Life Themes Conversation] AI error:', error);
    return {
      response: generateFallbackResponse(messages, exchangeCount, shouldSuggestThemes),
      themes: shouldSuggestThemes ? generateFallbackThemes(responses) : null,
    };
  }
}

function generateFallbackResponse(
  messages: ConversationMessage[],
  exchangeCount: number,
  shouldSuggestThemes: boolean
): string {
  if (shouldSuggestThemes) {
    return "Thank you for sharing so openly. Based on our conversation and your responses, I've identified some recurring themes that seem central to who you are. Let me share them with you, and we can discuss whether they resonate.";
  }

  const fallbackQuestions = [
    "That's really interesting. I notice some connections between what you've shared. Can you tell me more about what drives your passion for these things?",
    "I'm seeing some patterns emerge. When you think about your role models and your hobbies, what common thread do you see connecting them?",
    "Thank you for sharing. Looking at your early memories and your favorite subjects, what feelings or values seem to be consistently important to you?",
  ];

  return fallbackQuestions[Math.min(exchangeCount - 1, fallbackQuestions.length - 1)];
}

function generateFallbackThemes(
  responses: { question_number: number; response_data: any }[]
): SuggestedThemeData[] {
  // Generate basic themes based on response patterns
  const themes: SuggestedThemeData[] = [
    {
      name: 'Personal Growth',
      description: 'A drive toward continuous self-improvement and learning',
      evidence: ['From your role models', 'From your favorite subjects', 'From your hobbies'],
      confidence: 75,
    },
    {
      name: 'Connection & Relationships',
      description: 'Valuing meaningful relationships and human connection',
      evidence: ['From your early memories', 'From media you enjoy'],
      confidence: 70,
    },
    {
      name: 'Creative Expression',
      description: 'Finding meaning through creative and expressive activities',
      evidence: ['From your hobbies', 'From your mottos'],
      confidence: 65,
    },
  ];

  return themes;
}
