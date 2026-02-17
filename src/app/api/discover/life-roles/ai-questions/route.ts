import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Groq from 'groq-sdk';

/**
 * POST /api/discover/life-roles/ai-questions
 * Generate personalized wellbeing reflection questions (Step 2)
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
    const { dimension } = body;

    if (!dimension) {
      return NextResponse.json({ error: 'Missing dimension' }, { status: 400 });
    }

    // Fetch user context
    const [valuesResult, enneagramResult, rolesResult] = await Promise.all([
      supabase.from('value_results').select('value_set, top3').eq('user_id', userId),
      supabase.from('enneagram_sessions').select('primary_type, wing_estimate').eq('user_id', userId).eq('stage', 'complete').limit(1).single(),
      supabase.from('life_roles_sessions').select('life_roles').eq('user_id', userId).single(),
    ]);

    const context = {
      values: valuesResult.data,
      enneagram: enneagramResult.data,
      roles: rolesResult.data?.life_roles || [],
    };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        questions: getFallbackQuestions(dimension),
        source: 'fallback',
      });
    }

    const groq = new Groq({ apiKey });
    const questions = await generateAIQuestions(groq, dimension, context);

    return NextResponse.json({ questions, source: 'ai' });
  } catch (error) {
    console.error('[Life Roles AI Questions] Error:', error);
    const body = await request.clone().json().catch(() => ({ dimension: 'physical' }));
    return NextResponse.json({
      questions: getFallbackQuestions(body.dimension || 'physical'),
      source: 'fallback',
    });
  }
}

async function generateAIQuestions(groq: Groq, dimension: string, context: any) {
  const valuesText = context.values?.map((v: any) => (v.top3 || []).join(', ')).join('; ') || 'Not available';
  const enneagramText = context.enneagram ? `Type ${context.enneagram.primary_type}w${context.enneagram.wing_estimate}` : '';
  const rolesText = context.roles?.map((r: any) => r.role || r.entity).join(', ') || '';

  const dimensionLabels: Record<string, string> = {
    physical: 'Physical Well-being (exercise, nutrition, rest, stress management)',
    intellectual: 'Intellectual Well-being (learning, reading, critical thinking)',
    social_emotional: 'Social/Emotional Well-being (relationships, empathy, emotional intelligence)',
    spiritual: 'Spiritual Well-being (meditation, purpose, meaning, inner peace)',
    financial: 'Financial Well-being (financial planning, savings, investment)',
  };

  const prompt = `Generate 3 personalized reflection questions for the "${dimensionLabels[dimension] || dimension}" dimension.

User context:
- Values: ${valuesText}
- Enneagram: ${enneagramText}
- Life Roles: ${rolesText}

Each question should be introspective and connect to the user's values/roles where possible.

Respond with ONLY valid JSON:
{"questions": [
  {"question": "English question?", "questionKo": "한국어 질문?"},
  ...
]}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  const parsed = JSON.parse(content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, ''));
  return parsed.questions || parsed;
}

function getFallbackQuestions(dimension: string) {
  const fallbacks: Record<string, any[]> = {
    physical: [
      { question: 'How does your current physical routine support your life roles?', questionKo: '현재의 신체 활동이 삶의 역할을 어떻게 지원하고 있나요?' },
      { question: 'What one physical habit would most improve your energy for the roles you play?', questionKo: '어떤 신체적 습관이 당신의 역할 수행을 위한 에너지를 가장 향상시킬까요?' },
      { question: 'How do you manage stress across your different life roles?', questionKo: '다양한 삶의 역할에서 스트레스를 어떻게 관리하고 있나요?' },
    ],
    intellectual: [
      { question: 'What are you currently learning that connects to your life purpose?', questionKo: '현재 삶의 목적과 연결되는 무엇을 배우고 있나요?' },
      { question: 'How does intellectual growth serve your most important roles?', questionKo: '지적 성장이 가장 중요한 역할을 어떻게 지원하나요?' },
      { question: 'What mental challenge would push you toward your vision?', questionKo: '어떤 지적 도전이 비전을 향해 나아가게 할까요?' },
    ],
    social_emotional: [
      { question: 'Which relationships in your life currently need more attention?', questionKo: '현재 삶에서 어떤 관계에 더 많은 관심이 필요한가요?' },
      { question: 'How do you express empathy and care in your daily roles?', questionKo: '일상적인 역할에서 공감과 돌봄을 어떻게 표현하나요?' },
      { question: 'What emotional skill would most improve your relationships?', questionKo: '어떤 감정적 기술이 관계를 가장 향상시킬까요?' },
    ],
    spiritual: [
      { question: 'What practices help you connect with your deeper sense of purpose?', questionKo: '어떤 실천이 더 깊은 목적 의식과 연결되도록 도와주나요?' },
      { question: 'How does your spiritual life influence how you show up in your roles?', questionKo: '영적 생활이 역할 수행에 어떤 영향을 미치나요?' },
      { question: 'What brings you inner peace amid competing life demands?', questionKo: '경쟁하는 삶의 요구 속에서 내면의 평화를 가져다주는 것은 무엇인가요?' },
    ],
    financial: [
      { question: 'How does your financial situation support or limit your life roles?', questionKo: '재정 상황이 삶의 역할을 어떻게 지원하거나 제한하나요?' },
      { question: 'What financial habits would best align with your values and vision?', questionKo: '어떤 재정 습관이 가치관과 비전에 가장 부합할까요?' },
      { question: 'How do you balance financial responsibility with meaningful life investment?', questionKo: '재정적 책임과 의미 있는 삶의 투자 사이에서 어떻게 균형을 잡나요?' },
    ],
  };

  return fallbacks[dimension] || fallbacks.physical;
}
