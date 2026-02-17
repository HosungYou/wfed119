import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Groq from 'groq-sdk';

/**
 * POST /api/discover/mission/ai-components
 * AI recommendations for contribution targets and action verbs
 * Based on student's values, enneagram type, and life themes
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
    const { values, enneagram, lifeThemes } = body;

    // Check for API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        targets: getDefaultTargetRecommendations(),
        verbs: getDefaultVerbRecommendations(),
        source: 'fallback',
      });
    }

    const groq = new Groq({ apiKey });

    const valuesStr = (values || []).map((v: any) => `${v.name} (${v.type})`).join(', ');
    const enneagramStr = enneagram ? `Type ${enneagram.type}w${enneagram.wing}` : 'Unknown';
    const themesStr = (lifeThemes || []).join(', ');

    const prompt = `You are a career coach helping a student select mission statement components.

## Student Profile:
- Values: ${valuesStr || 'Not provided'}
- Enneagram: ${enneagramStr}
- Life Themes: ${themesStr || 'Not provided'}

## Available Contribution Targets (choose 5-8 that best match):
Education, Diversity, Public Policy, Cybersecurity, Accessibility, Affordable Housing, Agriculture, AI Ethics, Animal Rights, Art, Children's Rights, Civil Liberties, Clean Energy, Climate Change, Community, Conservation, Corporate Responsibility, Criminal Justice Reform, Culture, Data Privacy, Democracy, Digital Literacy, Economy, Empowerment, Energy, Entrepreneurship, Environment, Equality, Family Support, Financial Literacy, Food Security, Freedom, Gender Equality, Global Health, Health, Homelessness, Human Rights, Immigration, Inclusion, Income Inequality, Innovation, Job Creation, Justice, Literacy, Mental Health, Mental Wellness, Nutrition, Peace, Public Education, Public Health, Racial Equality, Renewable Energy, Research, Safety, Science, Social Entrepreneurship, Sustainability, Technology, Urban Planning, Veterans, Water Conservation, Wildlife, Women's Rights, Workforce Development, Youth Empowerment

## Available Action Verbs (choose 5-8 that best match):
Achieve, Advocate, Build, Catalyze, Champion, Collaborate, Communicate, Connect, Create, Cultivate, Deliver, Design, Develop, Drive, Educate, Empower, Encourage, Enhance, Envision, Establish, Facilitate, Foster, Guide, Improve, Influence, Innovate, Inspire, Integrate, Lead, Leverage, Motivate, Nurture, Optimize, Organize, Promote, Provide, Pursue, Serve, Share, Simplify, Solve, Strengthen, Support, Sustain, Transform, Unify

## Task:
Select 5-8 contribution targets AND 5-8 action verbs that best match this student's values, enneagram type, and life themes. Provide brief explanation.

Respond in JSON:
{
  "targets": [
    { "word": "target word", "reason": "brief reason in Korean" }
  ],
  "verbs": [
    { "word": "verb word", "reason": "brief reason in Korean" }
  ],
  "targetExplanation": "1-2 sentence explanation in Korean of why these targets match",
  "verbExplanation": "1-2 sentence explanation in Korean of why these verbs match"
}`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response');

      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleaned);
      return NextResponse.json({ ...parsed, source: 'ai' });
    } catch (aiError) {
      console.error('[Mission AI Components] AI error:', aiError);
      return NextResponse.json({
        targets: getDefaultTargetRecommendations(),
        verbs: getDefaultVerbRecommendations(),
        source: 'fallback',
      });
    }
  } catch (error) {
    console.error('[Mission AI Components] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getDefaultTargetRecommendations() {
  return [
    { word: 'Education', reason: '기본 추천' },
    { word: 'Community', reason: '기본 추천' },
    { word: 'Innovation', reason: '기본 추천' },
    { word: 'Mental Health', reason: '기본 추천' },
    { word: 'Youth Empowerment', reason: '기본 추천' },
  ];
}

function getDefaultVerbRecommendations() {
  return [
    { word: 'Empower', reason: '기본 추천' },
    { word: 'Create', reason: '기본 추천' },
    { word: 'Inspire', reason: '기본 추천' },
    { word: 'Build', reason: '기본 추천' },
    { word: 'Lead', reason: '기본 추천' },
  ];
}
