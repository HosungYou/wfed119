import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Groq from 'groq-sdk';

/**
 * POST /api/discover/life-roles/ai-reflection
 * Generate AI balance assessment and integrated summary (Step 5)
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
    const { lifeRoles, wellbeingReflections, roleCommitments, wellbeingCommitments, rainbowData } = body;

    // Fetch mission & values context
    const [missionResult, valuesResult] = await Promise.all([
      supabase.from('mission_sessions').select('final_statement').eq('user_id', userId).single(),
      supabase.from('value_results').select('value_set, top3').eq('user_id', userId),
    ]);

    const context = {
      missionStatement: missionResult.data?.final_statement || '',
      values: valuesResult.data,
      lifeRoles: lifeRoles || [],
      wellbeingReflections: wellbeingReflections || {},
      roleCommitments: roleCommitments || [],
      wellbeingCommitments: wellbeingCommitments || {},
      rainbowData: rainbowData || {},
    };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        assessment: generateFallbackAssessment(context),
        source: 'fallback',
      });
    }

    const groq = new Groq({ apiKey });
    const assessment = await generateAIAssessment(groq, context);

    return NextResponse.json({ assessment, source: 'ai' });
  } catch (error) {
    console.error('[Life Roles AI Reflection] Error:', error);
    return NextResponse.json({
      assessment: generateFallbackAssessment({}),
      source: 'fallback',
    });
  }
}

async function generateAIAssessment(groq: Groq, context: any) {
  const rolesText = context.lifeRoles?.map((r: any) => `${r.role} (${r.entity})`).join(', ') || 'None';
  const commitmentsText = context.roleCommitments?.map((c: any) => `${c.roleName}: ${c.commitment}`).join('\n') || 'None';
  const wellbeingText = Object.entries(context.wellbeingCommitments || {}).map(([k, v]) => `${k}: ${v}`).join('\n') || 'None';
  const valuesText = context.values?.map((v: any) => (v.top3 || []).join(', ')).join('; ') || '';

  const prompt = `You are a life balance coach. Analyze the user's life roles, commitments, and wellbeing, then generate a comprehensive assessment.

## User Data:
Mission: "${context.missionStatement}"
Values: ${valuesText}
Life Roles: ${rolesText}
Role Commitments:
${commitmentsText}
Wellbeing Commitments:
${wellbeingText}

## Task:
Provide a JSON response with:
1. balanceAssessment: "balanced", "moderately_imbalanced", or "severely_imbalanced"
2. suggestedAdjustments: 3-5 specific suggestions
3. summary: A 3-4 sentence integrative summary connecting roles to mission and values
4. strengthAreas: 2-3 areas where the user shows strong alignment
5. growthAreas: 2-3 areas for improvement

Respond with ONLY valid JSON:
{
  "balanceAssessment": "balanced|moderately_imbalanced|severely_imbalanced",
  "suggestedAdjustments": ["suggestion1", "suggestion2", ...],
  "summary": "Integrative summary...",
  "summaryKo": "통합 요약...",
  "strengthAreas": ["area1", "area2"],
  "growthAreas": ["area1", "area2"]
}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  return JSON.parse(content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, ''));
}

function generateFallbackAssessment(context: any) {
  const roleCount = context.lifeRoles?.length || 0;
  const commitmentCount = context.roleCommitments?.length || 0;

  return {
    balanceAssessment: roleCount > 3 && commitmentCount > 2 ? 'balanced' : 'moderately_imbalanced',
    suggestedAdjustments: [
      'Review your time allocation to ensure it matches your desired percentages.',
      'Consider which roles energize you most and prioritize them.',
      'Build small daily habits to support your wellbeing commitments.',
    ],
    summary: 'Your life roles reflect a thoughtful approach to balancing multiple responsibilities. Continue to align your daily actions with your stated commitments and values.',
    summaryKo: '당신의 삶의 역할은 여러 책임의 균형을 맞추는 사려 깊은 접근을 반영합니다. 일상적인 행동을 명시된 헌신과 가치관에 맞추어 계속 정렬하세요.',
    strengthAreas: ['Role awareness', 'Commitment clarity'],
    growthAreas: ['Time balance', 'Wellbeing integration'],
  };
}
