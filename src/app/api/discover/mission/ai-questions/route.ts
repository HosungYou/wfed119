import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/discover/mission/ai-questions
 * Generate AI-powered reflection questions for wellbeing dimensions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let session = null;

    if (!userError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await request.json();
    const { type, dimension } = body;

    if (type !== 'wellbeing_questions') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (!dimension) {
      return NextResponse.json({ error: 'Dimension is required' }, { status: 400 });
    }

    // Fetch user's previous module data for context
    const [valuesResult, strengthsResult, visionResult] = await Promise.all([
      supabase.from('values_sessions').select('*').eq('user_id', userId).single(),
      supabase.from('strengths_sessions').select('*').eq('user_id', userId).single(),
      supabase.from('vision_sessions').select('*').eq('user_id', userId).single(),
    ]);

    const context = {
      values: valuesResult.data,
      strengths: strengthsResult.data,
      vision: visionResult.data,
    };

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        questions: generateFallbackQuestions(dimension),
        source: 'fallback',
        message: 'AI service not configured. Using template-based questions.',
      });
    }

    // Generate AI questions
    const anthropic = new Anthropic({ apiKey });
    const questions = await generateAIQuestions(anthropic, dimension, context);

    return NextResponse.json({
      questions,
      source: 'ai',
    });
  } catch (error) {
    console.error('[Mission AI Questions] Error:', error);
    const dimension = (await request.clone().json()).dimension || 'physical';
    return NextResponse.json({
      questions: generateFallbackQuestions(dimension),
      source: 'fallback',
      error: 'AI service temporarily unavailable. Using template-based questions.',
    });
  }
}

const DIMENSION_INFO: Record<string, { name: string; nameKo: string; description: string }> = {
  physical: {
    name: 'Physical',
    nameKo: '신체적',
    description: 'Physical health, exercise, nutrition, sleep, and bodily wellbeing',
  },
  emotional: {
    name: 'Emotional/Social',
    nameKo: '정서적/사회적',
    description: 'Emotional health, relationships, social connections, and interpersonal wellbeing',
  },
  mental: {
    name: 'Mental',
    nameKo: '정신적',
    description: 'Intellectual growth, learning, mental stimulation, and cognitive development',
  },
  spiritual: {
    name: 'Spiritual',
    nameKo: '영적',
    description: 'Purpose, meaning, values, meditation, and spiritual practices',
  },
  financial: {
    name: 'Financial',
    nameKo: '재정적',
    description: 'Financial health, security, planning, and resource management',
  },
};

async function generateAIQuestions(
  anthropic: Anthropic,
  dimension: string,
  context: {
    values: any;
    strengths: any;
    vision: any;
  }
) {
  const { values, strengths, vision } = context;
  const dimInfo = DIMENSION_INFO[dimension] || { name: dimension, nameKo: dimension, description: '' };

  const prompt = `You are a career and life coach helping someone reflect on their ${dimInfo.name} wellbeing.

## Dimension: ${dimInfo.name} (${dimInfo.nameKo})
${dimInfo.description}

## User Context:
${values ? `### Values:
- Core Values: ${values.terminal_values?.slice(0, 3).map((v: any) => v.name || v).join(', ') || 'Not provided'}` : ''}

${strengths ? `### Top Strengths:
${strengths.top_strengths?.slice(0, 3).map((s: any) => `- ${s.name || s}`).join('\n') || 'Not provided'}` : ''}

${vision ? `### Vision:
"${vision.final_statement?.substring(0, 100) || 'Not provided'}..."` : ''}

## Task:
Generate 3 thoughtful reflection questions specifically about ${dimInfo.name} wellbeing.
The questions should:
1. Be personal and introspective
2. Connect to their values/strengths when relevant
3. Encourage deep self-reflection
4. Be actionable (lead to insights they can act on)

Respond with ONLY valid JSON array, no markdown formatting:
[
  {"question": "English question here?", "questionKo": "한국어 질문?"},
  {"question": "English question here?", "questionKo": "한국어 질문?"},
  {"question": "English question here?", "questionKo": "한국어 질문?"}
]`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let cleanedText = content.text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('[Mission AI Questions] AI error:', error);
    throw error;
  }
}

function generateFallbackQuestions(dimension: string): Array<{ question: string; questionKo: string }> {
  const fallbacks: Record<string, Array<{ question: string; questionKo: string }>> = {
    physical: [
      { question: 'How do you currently maintain your physical health?', questionKo: '현재 신체 건강을 어떻게 유지하고 있나요?' },
      { question: 'What physical activities bring you energy and joy?', questionKo: '어떤 신체 활동이 에너지와 기쁨을 주나요?' },
      { question: 'What would improved physical wellbeing look like for you?', questionKo: '향상된 신체적 웰빙은 당신에게 어떤 모습일까요?' },
    ],
    emotional: [
      { question: 'Who are the people that support your emotional wellbeing?', questionKo: '누가 당신의 정서적 웰빙을 지지해주나요?' },
      { question: 'How do you process and express your emotions?', questionKo: '감정을 어떻게 처리하고 표현하나요?' },
      { question: 'What relationships would you like to strengthen?', questionKo: '어떤 관계를 강화하고 싶으신가요?' },
    ],
    mental: [
      { question: 'What topics or skills are you curious to learn more about?', questionKo: '어떤 주제나 기술에 대해 더 배우고 싶으신가요?' },
      { question: 'How do you challenge and stimulate your mind?', questionKo: '어떻게 정신을 자극하고 도전하나요?' },
      { question: 'What mental habits would you like to develop?', questionKo: '어떤 정신적 습관을 기르고 싶으신가요?' },
    ],
    spiritual: [
      { question: 'What gives your life meaning and purpose?', questionKo: '삶에 의미와 목적을 주는 것은 무엇인가요?' },
      { question: 'How do you connect with something greater than yourself?', questionKo: '자신보다 큰 것과 어떻게 연결되나요?' },
      { question: 'What practices help you feel centered and grounded?', questionKo: '어떤 활동이 중심을 잡고 안정감을 주나요?' },
    ],
    financial: [
      { question: 'What does financial security mean to you?', questionKo: '재정적 안정이란 무엇을 의미하나요?' },
      { question: 'How do your spending habits align with your values?', questionKo: '지출 습관이 가치관과 어떻게 일치하나요?' },
      { question: 'What financial goals would support your life vision?', questionKo: '어떤 재정 목표가 삶의 비전을 지지할까요?' },
    ],
  };

  return fallbacks[dimension] || fallbacks.physical;
}
