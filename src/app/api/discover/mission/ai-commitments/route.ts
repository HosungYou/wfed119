import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';

interface LifeRole {
  id: string;
  entity: string;
  role: string;
}

/**
 * POST /api/discover/mission/ai-commitments
 * Generate AI-powered commitment suggestions based on life roles and wellbeing reflections
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
    const { type, lifeRoles, wellbeingReflections } = body;

    if (type !== 'suggest_commitments') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
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
      lifeRoles,
      wellbeingReflections,
    };

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        suggestions: generateFallbackCommitments(lifeRoles, wellbeingReflections),
        source: 'fallback',
        message: 'AI service not configured. Using template-based suggestions.',
      });
    }

    // Generate AI suggestions
    const anthropic = new Anthropic({ apiKey });
    const suggestions = await generateAICommitments(anthropic, context);

    return NextResponse.json({
      suggestions,
      source: 'ai',
    });
  } catch (error) {
    console.error('[Mission AI Commitments] Error:', error);
    let lifeRoles: LifeRole[] = [];
    let wellbeingReflections: Record<string, string> = {};
    try {
      const clonedBody = await request.clone().json();
      lifeRoles = clonedBody.lifeRoles || [];
      wellbeingReflections = clonedBody.wellbeingReflections || {};
    } catch {
      // ignore parse error
    }
    return NextResponse.json({
      suggestions: generateFallbackCommitments(lifeRoles, wellbeingReflections),
      source: 'fallback',
      error: 'AI service temporarily unavailable. Using template-based suggestions.',
    });
  }
}

const WELLBEING_DIMENSIONS = ['physical', 'emotional', 'mental', 'spiritual', 'financial'];

async function generateAICommitments(
  anthropic: Anthropic,
  context: {
    values: any;
    strengths: any;
    vision: any;
    lifeRoles: LifeRole[];
    wellbeingReflections: Record<string, string>;
  }
) {
  const { values, strengths, vision, lifeRoles, wellbeingReflections } = context;

  // Build life roles section
  const rolesSection = lifeRoles && lifeRoles.length > 0
    ? lifeRoles
        .filter((r: LifeRole) => r && r.entity && r.role)
        .map((r: LifeRole) => `- ${r.role} (for ${r.entity})`)
        .join('\n')
    : 'No roles defined yet';

  // Build reflections section
  const reflectionsSection = wellbeingReflections && Object.keys(wellbeingReflections).length > 0
    ? Object.entries(wellbeingReflections)
        .filter(([, v]) => v)
        .map(([k, v]) => `- ${k}: "${v}"`)
        .join('\n')
    : 'No reflections provided yet';

  const prompt = `You are a career and life coach helping someone create meaningful commitments for their life roles and wellbeing dimensions.

## User Context:
${values ? `### Core Values:
${values.terminal_values?.slice(0, 3).map((v: any) => `- ${v.name || v}`).join('\n') || 'Not provided'}` : ''}

${strengths ? `### Top Strengths:
${strengths.top_strengths?.slice(0, 3).map((s: any) => `- ${s.name || s}`).join('\n') || 'Not provided'}` : ''}

${vision ? `### Vision:
"${vision.final_statement?.substring(0, 150) || 'Not provided'}"` : ''}

### Life Roles:
${rolesSection}

### Wellbeing Reflections:
${reflectionsSection}

## Task:
Generate specific, actionable commitment suggestions for:
1. Each life role (if provided)
2. Each wellbeing dimension: physical, emotional, mental, spiritual, financial

Each commitment should:
- Be specific and actionable
- Align with their values and strengths
- Be achievable within a weekly/monthly timeframe
- Connect to their bigger vision

Respond with ONLY valid JSON object, no markdown formatting:
{
  "role_Entity": "Commitment for this role...",
  "physical": "Physical wellbeing commitment...",
  "emotional": "Emotional wellbeing commitment...",
  "mental": "Mental wellbeing commitment...",
  "spiritual": "Spiritual wellbeing commitment...",
  "financial": "Financial wellbeing commitment..."
}

For roles, use the format "role_Entity" as the key (e.g., "role_Family", "role_Team").
Keep each commitment to 1-2 sentences in English.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
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
    console.error('[Mission AI Commitments] AI error:', error);
    throw error;
  }
}

function generateFallbackCommitments(
  lifeRoles: LifeRole[],
  wellbeingReflections: Record<string, string>
): Record<string, string> {
  const suggestions: Record<string, string> = {};

  // Generate role commitments
  if (lifeRoles && Array.isArray(lifeRoles)) {
    lifeRoles.forEach((role: LifeRole) => {
      if (role && role.entity) {
        suggestions[`role_${role.entity}`] = `Dedicate quality time each week to fulfill my role as ${role.role || 'a supportive member'} for ${role.entity}.`;
      }
    });
  }

  // Generate wellbeing commitments
  const wellbeingFallbacks: Record<string, string> = {
    physical: 'Exercise at least 3 times per week and prioritize 7-8 hours of sleep nightly.',
    emotional: 'Connect meaningfully with loved ones weekly and practice gratitude daily.',
    mental: 'Read or learn something new for 30 minutes daily to stimulate intellectual growth.',
    spiritual: 'Set aside 15 minutes daily for meditation, reflection, or spiritual practice.',
    financial: 'Review budget monthly and save at least 10% of income toward future goals.',
  };

  WELLBEING_DIMENSIONS.forEach(dim => {
    suggestions[dim] = wellbeingFallbacks[dim];
  });

  return suggestions;
}
