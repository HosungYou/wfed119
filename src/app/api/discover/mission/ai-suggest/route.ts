import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Groq from 'groq-sdk';

/**
 * POST /api/discover/mission/ai-suggest
 * 7 AI roles for Mission v3.5:
 * 1. values_connector - Step 1: 가치 프로필 요약
 * 2. mission_composer - Step 3 R1: 두 템플릿 자동 완성
 * 3. sentence_refiner - Step 3 R2: 다듬어진 문장 제안
 * 4. mission_analyst  - Step 3 R3: 4기준 점수 + 개선 제안
 * 5. polish_suggest   - Step 3 R3: AI 다듬기 제안
 * 6. reflection_guide - Step 4: 개인화된 후속 인사이트
 * 7. feedback (legacy) - backward compat
 */
export async function POST(request: NextRequest) {
  let body: any = null;

  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    body = await request.json();
    const { type = 'values_connector' } = body;

    // Check for API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        suggestion: getFallback(type, body),
        source: 'fallback',
        message: 'AI service not configured. Using template-based suggestion.',
      });
    }

    const groq = new Groq({ apiKey });
    const result = await generateByRole(groq, type, body);

    return NextResponse.json({
      suggestion: result,
      source: 'ai',
    });
  } catch (error) {
    console.error('[Mission AI Suggest] Error:', error);
    return NextResponse.json({
      suggestion: getFallback(body?.type || 'values_connector', body),
      source: 'fallback',
      error: 'AI service temporarily unavailable.',
    });
  }
}

async function generateByRole(groq: Groq, type: string, body: any) {
  let prompt = '';

  switch (type) {
    case 'values_connector': {
      const { values, enneagram, lifeThemes } = body;
      prompt = `You are a career coach analyzing a student's value profile.

## Student's Selected Values:
${formatValuesDetailed(values)}

${enneagram ? `## Enneagram Type: ${enneagram.type}w${enneagram.wing}` : ''}
${lifeThemes ? `## Life Themes: ${lifeThemes.join(', ')}` : ''}

## Task:
Create a "Value Profile" summary in English that:
1. Shows connections between terminal, instrumental, and work values
2. Suggests how these values connect to life/career direction
3. Uses enneagram type and life themes as additional context
4. Keep it warm, encouraging, and personal (2-3 paragraphs)

Respond in English ONLY.`;
      break;
    }

    case 'mission_composer': {
      const { verbs, targets, values } = body;
      prompt = `You are a mission statement composer.

## Components selected by student:
- Action Verbs: ${(verbs || []).join(', ')}
- Contribution Targets: ${(targets || []).join(', ')}
- Core Values: ${(values || []).join(', ')}

## Task:
Generate TWO mission statement templates using these exact components.

Option 1 (structured):
"My mission is to [verb1], [verb2], and [verb3] for/in [target1], [target2], and [target3] guided by [value1], [value2], and [value3]."

Option 2 (integrated):
"My mission is to [verb1], [verb2], and [verb3] to/for [target/value combo1], [target/value combo2], and [target/value combo3] so that [impact expression]."

Arrange the components intelligently with appropriate prepositions and connectors.

Respond in JSON format:
{
  "option1": "full mission statement text",
  "option2": "full mission statement text"
}`;
      break;
    }

    case 'sentence_refiner': {
      const { currentDraft, round1Text } = body;
      prompt = `You are helping a student refine their mission statement into a natural, complete sentence.

## Round 1 template result:
"${round1Text || ''}"

## Student's current Round 2 draft:
"${currentDraft || ''}"

## Task:
1. Take the template/draft and create a polished, natural-sounding single sentence
2. Combine similar targets into broader concepts
3. Use stronger, more specific verbs where possible
4. Keep the student's original intent and chosen words
5. Make it memorable and concise

Provide the refined version AND 2-3 brief tips in English.

Respond in JSON:
{
  "refined": "the refined mission statement",
  "tips": ["tip1 in English", "tip2 in English"]
}`;
      break;
    }

    case 'mission_analyst': {
      const { missionText } = body;
      prompt = `Analyze this mission statement against 4 criteria. Score each 1-10.

Mission statement: "${missionText || ''}"

Criteria:
1. Clarity (명확성): Would a 10-year-old understand it?
2. Inspiration (영감): Does it give energy and motivation?
3. Altruism (이타성): Would others want to support this person?
4. Conciseness (간결성): Can it be memorized easily?

Respond in JSON:
{
  "clarity": { "score": 0, "feedback": "feedback in English" },
  "inspiration": { "score": 0, "feedback": "feedback in English" },
  "altruism": { "score": 0, "feedback": "feedback in English" },
  "conciseness": { "score": 0, "feedback": "feedback in English" },
  "overall": 0,
  "suggestions": ["suggestion1 in English", "suggestion2 in English"]
}`;
      break;
    }

    case 'polish_suggest': {
      const { missionText, analysis } = body;
      prompt = `You are helping polish a mission statement based on 4 criteria feedback.

Current mission: "${missionText || ''}"

${analysis ? `Current scores - Clarity: ${analysis.clarity?.score}/10, Inspiration: ${analysis.inspiration?.score}/10, Altruism: ${analysis.altruism?.score}/10, Conciseness: ${analysis.conciseness?.score}/10` : ''}

## Task:
Create an improved version that optimizes all 4 criteria (clarity, inspiration, altruism, conciseness).
Keep the student's core intent and key words.

Respond with ONLY the polished mission statement text, nothing else.`;
      break;
    }

    case 'guided_variants': {
      const { missionText, userThought, verbs, targets, values } = body;
      prompt = `You are helping a student refine their mission statement based on their own creative direction.

## Current mission statement:
"${missionText || ''}"

## Student's direction / thought:
"${userThought || ''}"

## Original components (for reference):
- Action Verbs: ${(verbs || []).join(', ')}
- Contribution Targets: ${(targets || []).join(', ')}
- Core Values: ${(values || []).join(', ')}

## Task:
Generate exactly 3 different mission statement variants that honour the student's direction.
Each variant should:
1. Directly reflect what the student asked (combine, focus, emphasise, etc.)
2. Keep the student's original components where possible
3. Be a single, complete, memorable sentence
4. Differ meaningfully from each other (try different structures or emphases)

Respond in JSON:
{
  "variants": [
    "variant 1 text",
    "variant 2 text",
    "variant 3 text"
  ]
}`;
      break;
    }

    case 'reflection_guide': {
      const { finalStatement, values, enneagram, lifeThemes, reflections } = body;
      prompt = `You are a reflection guide providing personalized follow-up insights.

## Student's Final Mission Statement:
"${finalStatement || ''}"

## Student's Values: ${(values || []).join(', ')}
${enneagram ? `## Enneagram: Type ${enneagram.type}w${enneagram.wing}` : ''}
${lifeThemes ? `## Life Themes: ${lifeThemes.join(', ')}` : ''}

## Student's Reflections:
- On inspiration: "${reflections?.inspiration || ''}"
- On alignment: "${reflections?.alignment || ''}"

## Task:
Generate 2-3 personalized follow-up insights in English:
1. Connect the mission to their values, enneagram type, and life themes
2. Highlight a pattern or strength they may not have noticed
3. Suggest ONE specific action they can take THIS WEEK to live their mission

Respond in JSON:
{
  "insights": ["insight1 in English", "insight2 in English", "insight3 in English"]
}`;
      break;
    }

    case 'feedback': {
      // Legacy feedback type for backward compatibility
      const { values, context } = body;
      prompt = `Analyze this mission statement and provide feedback:
"${context?.currentDraft || ''}"
User's values: ${formatValuesSimple(values)}

Respond in JSON:
{
  "clarity": { "score": 0, "feedback": "..." },
  "values_alignment": { "score": 0, "feedback": "..." },
  "impact": { "score": 0, "feedback": "..." },
  "actionability": { "score": 0, "feedback": "..." },
  "overall": { "score": 0, "summary": "..." },
  "suggestions": ["suggestion1", "suggestion2"]
}`;
      break;
    }

    default:
      return { error: `Unknown AI role type: ${type}` };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    // Parse JSON responses
    if (['mission_composer', 'sentence_refiner', 'mission_analyst', 'reflection_guide', 'feedback', 'guided_variants'].includes(type)) {
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '');
      }
      try {
        return JSON.parse(cleaned);
      } catch (parseError) {
        console.error('[Mission AI] JSON parse error:', parseError);
        return getFallback(type, body);
      }
    }

    return content.trim();
  } catch (error) {
    console.error('[Mission AI] Generation error:', error);
    throw error;
  }
}

function formatValuesDetailed(values: any): string {
  if (!values || !Array.isArray(values)) return 'No values provided';
  const grouped: Record<string, string[]> = { terminal: [], instrumental: [], work: [] };
  values.forEach((v: any) => {
    const type = v.type || 'terminal';
    if (grouped[type]) grouped[type].push(v.name || v);
  });
  const parts: string[] = [];
  if (grouped.terminal.length) parts.push(`Terminal Values (삶의 목표): ${grouped.terminal.join(', ')}`);
  if (grouped.instrumental.length) parts.push(`Instrumental Values (행동 원칙): ${grouped.instrumental.join(', ')}`);
  if (grouped.work.length) parts.push(`Work Values (직업 가치): ${grouped.work.join(', ')}`);
  return parts.join('\n') || 'No values provided';
}

function formatValuesSimple(values: any): string {
  if (!values) return 'No values provided';
  if (Array.isArray(values)) return values.map((v: any) => v.name || v).join(', ');
  const parts: string[] = [];
  if (values.terminal?.length) parts.push(`Terminal: ${values.terminal.map((v: any) => v.name || v).join(', ')}`);
  if (values.instrumental?.length) parts.push(`Instrumental: ${values.instrumental.map((v: any) => v.name || v).join(', ')}`);
  if (values.work?.length) parts.push(`Work: ${values.work.map((v: any) => v.name || v).join(', ')}`);
  return parts.join('\n') || 'No values provided';
}

function getFallback(type: string, body: any): any {
  switch (type) {
    case 'values_connector':
      return 'Your selected values contain important clues about your life direction. Terminal, instrumental, and work values connect together to form your unique value profile. Use these values as the foundation for crafting your mission statement.';

    case 'mission_composer': {
      const v = (body?.verbs || ['contribute', 'develop', 'inspire']).slice(0, 3);
      const t = (body?.targets || ['education', 'community', 'growth']).slice(0, 3);
      const val = (body?.values || ['integrity', 'growth', 'service']).slice(0, 3);
      return {
        option1: `My mission is to ${v[0]}, ${v[1]}, and ${v[2]} for ${t[0]}, ${t[1]}, and ${t[2]} guided by ${val[0]}, ${val[1]}, and ${val[2]}.`,
        option2: `My mission is to ${v[0]} and ${v[1]} in ${t[0]} and ${t[1]}, driven by ${val[0]} and ${val[1]}, so that I can ${v[2]} meaningful ${t[2]}.`,
      };
    }

    case 'sentence_refiner':
      return {
        refined: body?.currentDraft || 'My mission is to make a meaningful impact.',
        tips: ['Try combining similar targets', 'Start with a stronger verb', 'Keep it concise'],
      };

    case 'mission_analyst':
      return {
        clarity: { score: 7, feedback: 'AI analysis is not available. Please evaluate on your own.' },
        inspiration: { score: 7, feedback: 'AI analysis is not available. Please evaluate on your own.' },
        altruism: { score: 7, feedback: 'AI analysis is not available. Please evaluate on your own.' },
        conciseness: { score: 7, feedback: 'AI analysis is not available. Please evaluate on your own.' },
        overall: 7,
        suggestions: ['Try making your mission statement more specific.'],
      };

    case 'polish_suggest':
      return body?.missionText || 'My mission is to make a positive impact.';

    case 'guided_variants': {
      const base = body?.missionText || 'My mission is to make a positive impact.';
      return {
        variants: [
          base,
          base.replace('and', 'while focusing on'),
          base.replace('guided by', 'driven by a deep commitment to'),
        ],
      };
    }

    case 'reflection_guide':
      return {
        insights: [
          'Your mission statement connects well with your values.',
          'Try starting a small action this week to live your mission.',
        ],
      };

    case 'feedback':
      return {
        clarity: { score: 7, feedback: 'AI analysis unavailable.' },
        values_alignment: { score: 7, feedback: 'AI analysis unavailable.' },
        impact: { score: 7, feedback: 'AI analysis unavailable.' },
        actionability: { score: 7, feedback: 'AI analysis unavailable.' },
        overall: { score: 7, summary: 'AI analysis temporarily unavailable.' },
        suggestions: ['Try refining your mission statement.'],
      };

    default:
      return null;
  }
}
