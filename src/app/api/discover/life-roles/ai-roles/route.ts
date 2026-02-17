import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Groq from 'groq-sdk';

/**
 * POST /api/discover/life-roles/ai-roles
 * AI role suggestions based on mission statement, values, and life themes (Step 1)
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

    // Fetch context from previous modules
    const [valuesResult, lifeThemesResult, missionResult, enneagramResult] = await Promise.all([
      supabase.from('value_results').select('value_set, top3').eq('user_id', userId),
      supabase.from('life_themes_results').select('themes').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('mission_sessions').select('final_statement').eq('user_id', userId).single(),
      supabase.from('enneagram_sessions').select('primary_type, wing_estimate').eq('user_id', userId).eq('stage', 'complete').limit(1).single(),
    ]);

    const context = {
      values: valuesResult.data,
      lifeThemes: lifeThemesResult.data?.themes,
      missionStatement: missionResult.data?.final_statement,
      enneagram: enneagramResult.data,
    };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        suggestions: generateFallbackSuggestions(),
        source: 'fallback',
        message: 'AI service not configured. Using template-based suggestions.',
      });
    }

    const groq = new Groq({ apiKey });
    const suggestions = await generateAISuggestions(groq, context);

    return NextResponse.json({ suggestions, source: 'ai' });
  } catch (error) {
    console.error('[Life Roles AI Roles] Error:', error);
    return NextResponse.json({
      suggestions: generateFallbackSuggestions(),
      source: 'fallback',
      error: 'AI service temporarily unavailable.',
    });
  }
}

async function generateAISuggestions(groq: Groq, context: any) {
  const valuesText = context.values?.map((v: any) => `${v.value_set}: ${(v.top3 || []).join(', ')}`).join('\n') || 'Not available';
  const themesText = context.lifeThemes?.slice(0, 3).map((t: any) => t.theme || t).join(', ') || 'Not available';
  const missionText = context.missionStatement || 'Not available';
  const enneagramText = context.enneagram ? `Type ${context.enneagram.primary_type}w${context.enneagram.wing_estimate}` : 'Not available';

  const prompt = `You are a career and life coach. Based on the user's profile, suggest 5-7 life role entities and roles the user likely plays.

## User Profile:
### Mission Statement: "${missionText}"
### Values: ${valuesText}
### Life Themes: ${themesText}
### Enneagram: ${enneagramText}

## Task:
Suggest relationship entities (people/groups) and the user's role with each. Include diverse categories: family, professional, community, personal growth.

Respond with ONLY a valid JSON object:
{"suggestions": [
  {"entity": "Family", "entityKo": "가족", "role": "Supportive Child", "roleKo": "든든한 자녀", "category": "personal", "source": "Based on your values of..."},
  ...
]}

Categories: personal, professional, community, health`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  let cleaned = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const parsed = JSON.parse(cleaned);
  return (parsed.suggestions || parsed).map((s: any, i: number) => ({
    id: `ai_${Date.now()}_${i}`,
    ...s,
  }));
}

function generateFallbackSuggestions() {
  return [
    { id: 'f1', entity: 'Family', entityKo: '가족', role: 'Caring Family Member', roleKo: '돌보는 가족 구성원', category: 'personal', source: 'template' },
    { id: 'f2', entity: 'Workplace', entityKo: '직장', role: 'Dedicated Professional', roleKo: '헌신적인 전문가', category: 'professional', source: 'template' },
    { id: 'f3', entity: 'Friends', entityKo: '친구', role: 'Supportive Friend', roleKo: '지지하는 친구', category: 'personal', source: 'template' },
    { id: 'f4', entity: 'Community', entityKo: '지역사회', role: 'Active Contributor', roleKo: '적극적인 기여자', category: 'community', source: 'template' },
    { id: 'f5', entity: 'Self', entityKo: '자신', role: 'Lifelong Learner', roleKo: '평생 학습자', category: 'health', source: 'template' },
    { id: 'f6', entity: 'Partner', entityKo: '파트너', role: 'Loving Partner', roleKo: '사랑하는 파트너', category: 'personal', source: 'template' },
    { id: 'f7', entity: 'School', entityKo: '학교', role: 'Engaged Student', roleKo: '열정적인 학생', category: 'professional', source: 'template' },
  ];
}
