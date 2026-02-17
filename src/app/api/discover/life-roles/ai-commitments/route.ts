import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Groq from 'groq-sdk';

/**
 * POST /api/discover/life-roles/ai-commitments
 * Generate AI commitment draft suggestions (Step 4)
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
    const { lifeRoles } = body;

    // Fetch cross-module context
    const [valuesResult, missionResult] = await Promise.all([
      supabase.from('value_results').select('value_set, top3').eq('user_id', userId),
      supabase.from('mission_sessions').select('final_statement').eq('user_id', userId).single(),
    ]);

    const context = {
      values: valuesResult.data,
      missionStatement: missionResult.data?.final_statement,
      lifeRoles: lifeRoles || [],
    };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        suggestions: generateFallbackCommitments(context.lifeRoles),
        source: 'fallback',
      });
    }

    const groq = new Groq({ apiKey });
    const suggestions = await generateAICommitments(groq, context);

    return NextResponse.json({ suggestions, source: 'ai' });
  } catch (error) {
    console.error('[Life Roles AI Commitments] Error:', error);
    return NextResponse.json({
      suggestions: generateFallbackCommitments([]),
      source: 'fallback',
    });
  }
}

async function generateAICommitments(groq: Groq, context: any) {
  const valuesText = context.values?.map((v: any) => `${v.value_set}: ${(v.top3 || []).join(', ')}`).join('\n') || '';
  const missionText = context.missionStatement || '';
  const rolesText = context.lifeRoles?.filter((r: any) => r?.entity).map((r: any) => `${r.role} (${r.entity})`).join(', ') || '';

  const prompt = `You are a life coach. Generate specific commitment statements for each life role.

## User Context:
Mission: "${missionText}"
Values: ${valuesText}
Life Roles: ${rolesText}

## Task:
For each life role, write a 1-2 sentence commitment that is specific, actionable, and aligned with the user's values.

Respond with ONLY valid JSON:
{
  "roleCommitments": {"RoleName": "commitment text...", ...}
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

function generateFallbackCommitments(lifeRoles: any[]) {
  const roleCommitments: Record<string, string> = {};
  (lifeRoles || []).forEach((r: any) => {
    if (r?.role) {
      roleCommitments[r.role] = `Dedicate quality time each week to fulfill my role as ${r.role} with intention and care.`;
    }
  });

  return { roleCommitments };
}
