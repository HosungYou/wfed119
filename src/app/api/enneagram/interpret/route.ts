import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';
import {
  TYPE_PROFILES,
  getTypeProfile,
  getWingDescription,
  getSubtypeDescription,
  EnneagramTypeProfile,
} from '@/lib/enneagram/typeProfiles';

/**
 * POST /api/enneagram/interpret
 * Generate AI-powered Enneagram interpretation with Strengths synergy
 */

interface InterpretRequest {
  enneagram: {
    type: number;
    wing: number;
    instinct: 'sp' | 'so' | 'sx';
    confidence: string;
    probabilities?: Record<string, number>;
  };
  strengths?: {
    skills: string[];
    attitudes: string[];
    values: string[];
  };
  locale?: 'en' | 'ko';
}

interface InterpretResponse {
  interpretation: {
    typeOverview: string;
    wingInfluence: string;
    instinctFocus: string;
    strengthsSynergy?: string;
    growthPath: string;
    careerInsights: string;
    integratedInsight?: string;  // New: Comprehensive analysis
  };
  typeProfile: EnneagramTypeProfile;
  generatedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: InterpretRequest = await request.json();
    const { enneagram, strengths, locale = 'en' } = body;

    if (!enneagram || !enneagram.type) {
      return NextResponse.json(
        { error: 'Missing enneagram data' },
        { status: 400 }
      );
    }

    const typeProfile = getTypeProfile(enneagram.type);
    if (!typeProfile) {
      return NextResponse.json(
        { error: 'Invalid enneagram type' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
      // Return template-based interpretation
      const fallback = generateFallbackInterpretation(enneagram, strengths, typeProfile, locale);
      return NextResponse.json({
        ...fallback,
        typeProfile,
        generatedAt: new Date().toISOString(),
        source: 'fallback',
      });
    }

    // Generate AI interpretation
    const anthropic = new Anthropic({ apiKey });
    const interpretation = await generateAIInterpretation(
      anthropic,
      enneagram,
      strengths,
      typeProfile,
      locale
    );

    return NextResponse.json({
      interpretation,
      typeProfile,
      generatedAt: new Date().toISOString(),
      source: 'ai',
    } as InterpretResponse);

  } catch (error) {
    console.error('[Enneagram Interpret] Error:', error);

    // Return fallback on error
    try {
      const body: InterpretRequest = await request.clone().json();
      const typeProfile = getTypeProfile(body.enneagram?.type || 1);
      if (typeProfile) {
        const fallback = generateFallbackInterpretation(
          body.enneagram,
          body.strengths,
          typeProfile,
          body.locale || 'en'
        );
        return NextResponse.json({
          ...fallback,
          typeProfile,
          generatedAt: new Date().toISOString(),
          source: 'fallback',
          error: 'AI service temporarily unavailable.',
        });
      }
    } catch {
      // ignore parse error
    }

    return NextResponse.json(
      { error: 'Failed to generate interpretation' },
      { status: 500 }
    );
  }
}

async function generateAIInterpretation(
  anthropic: Anthropic,
  enneagram: InterpretRequest['enneagram'],
  strengths: InterpretRequest['strengths'] | undefined,
  typeProfile: EnneagramTypeProfile,
  locale: 'en' | 'ko'
): Promise<InterpretResponse['interpretation']> {
  const { type, wing, instinct, confidence } = enneagram;
  const langInstruction = locale === 'ko'
    ? 'Respond entirely in Korean (한국어로 응답하세요).'
    : 'Respond in English.';

  const instinctNames = {
    sp: locale === 'ko' ? '자기보존' : 'Self-Preservation',
    so: locale === 'ko' ? '사회적' : 'Social',
    sx: locale === 'ko' ? '성적/일대일' : 'Sexual/One-to-One',
  };

  const strengthsContext = strengths
    ? `
## User's Discovered Strengths:
- Skills: ${strengths.skills.join(', ') || 'None identified'}
- Attitudes: ${strengths.attitudes.join(', ') || 'None identified'}
- Values: ${strengths.values.join(', ') || 'None identified'}
`
    : '';

  const prompt = `You are an expert Enneagram coach and career advisor with deep knowledge of personality psychology.

${langInstruction}

## User's Enneagram Profile:
- Primary Type: Type ${type} - ${typeProfile.name[locale]} (${typeProfile.nickname[locale]})
- Wing: ${wing} (${type}w${wing})
- Dominant Instinct: ${instinctNames[instinct]}
- Confidence Level: ${confidence}

## Type Description:
${typeProfile.description[locale]}

## Core Motivation:
${typeProfile.coreMotivation[locale]}

## Core Fear:
${typeProfile.coreFear[locale]}

## Core Desire:
${typeProfile.coreDesire[locale]}
${strengthsContext}

Based on this profile, generate a personalized interpretation. Be warm, insightful, and actionable.

Return a JSON object with EXACTLY these keys:
{
  "typeOverview": "2-3 sentences about how this type's core motivation manifests in their life",
  "wingInfluence": "1-2 sentences about how the wing modifies or enhances the base type",
  "instinctFocus": "1-2 sentences about how their dominant instinct shapes their priorities",
  ${strengths ? '"strengthsSynergy": "2-3 sentences analyzing how their discovered strengths align with or complement their Enneagram type",' : ''}
  "growthPath": "2-3 sentences with specific, actionable growth recommendations for moving toward their growth direction (Type ${typeProfile.growthDirection})",
  "careerInsights": "2-3 sentences about career directions and work environments that leverage their type and strengths",
  ${strengths ? '"integratedInsight": "4-6 sentences providing a comprehensive synthesis of how their personality type, discovered strengths, and core values work together. Explain how these elements create a unique personal profile, and offer integrated guidance for leveraging this combination in their career and personal growth journey."' : ''}
}

Important: Return ONLY the JSON object, no markdown formatting or additional text.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1536,  // Increased for integratedInsight
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract text content
  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in response');
  }

  // Parse JSON response
  const jsonStr = textContent.text.trim();
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      typeOverview: parsed.typeOverview || '',
      wingInfluence: parsed.wingInfluence || '',
      instinctFocus: parsed.instinctFocus || '',
      strengthsSynergy: parsed.strengthsSynergy || undefined,
      growthPath: parsed.growthPath || '',
      careerInsights: parsed.careerInsights || '',
      integratedInsight: parsed.integratedInsight || undefined,
    };
  } catch {
    // If JSON parsing fails, try to extract from markdown code block
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1].trim());
      return {
        typeOverview: parsed.typeOverview || '',
        wingInfluence: parsed.wingInfluence || '',
        instinctFocus: parsed.instinctFocus || '',
        strengthsSynergy: parsed.strengthsSynergy || undefined,
        growthPath: parsed.growthPath || '',
        careerInsights: parsed.careerInsights || '',
        integratedInsight: parsed.integratedInsight || undefined,
      };
    }
    throw new Error('Failed to parse AI response');
  }
}

function generateFallbackInterpretation(
  enneagram: InterpretRequest['enneagram'],
  strengths: InterpretRequest['strengths'] | undefined,
  typeProfile: EnneagramTypeProfile,
  locale: 'en' | 'ko'
): { interpretation: InterpretResponse['interpretation'] } {
  const { type, wing, instinct } = enneagram;

  const instinctNames = {
    sp: locale === 'ko' ? '자기보존' : 'Self-Preservation',
    so: locale === 'ko' ? '사회적' : 'Social',
    sx: locale === 'ko' ? '성적/일대일' : 'Sexual/One-to-One',
  };

  const wingDesc = getWingDescription(type, wing, locale);
  const subtypeDesc = getSubtypeDescription(type, instinct, locale);

  const typeOverview = locale === 'ko'
    ? `당신은 ${typeProfile.name.ko}(${typeProfile.nickname.ko})입니다. ${typeProfile.coreMotivation.ko}`
    : `You are ${typeProfile.name.en} (${typeProfile.nickname.en}). ${typeProfile.coreMotivation.en}`;

  const wingInfluence = wingDesc || (locale === 'ko'
    ? `${type}w${wing} 조합은 기본 유형에 독특한 뉘앙스를 더합니다.`
    : `The ${type}w${wing} combination adds unique nuances to your base type.`);

  const instinctFocus = subtypeDesc || (locale === 'ko'
    ? `${instinctNames[instinct]} 본능이 당신의 주요 초점입니다.`
    : `Your ${instinctNames[instinct]} instinct is your primary focus.`);

  const growthPath = locale === 'ko'
    ? `성장을 위해 Type ${typeProfile.growthDirection}의 긍정적 특성을 개발하세요. ${TYPE_PROFILES[typeProfile.growthDirection]?.healthyTraits.ko.slice(0, 3).join(', ')} 같은 특성을 기르는 것이 도움이 됩니다.`
    : `For growth, develop the positive qualities of Type ${typeProfile.growthDirection}. Cultivating traits like ${TYPE_PROFILES[typeProfile.growthDirection]?.healthyTraits.en.slice(0, 3).join(', ')} will be beneficial.`;

  const careerInsights = locale === 'ko'
    ? `당신의 ${typeProfile.name.ko} 유형은 ${typeProfile.healthyTraits.ko.slice(0, 2).join(', ')} 특성을 활용할 수 있는 역할에서 빛납니다. 이러한 강점을 발휘할 수 있는 환경을 찾으세요.`
    : `Your ${typeProfile.name.en} type thrives in roles where you can leverage traits like ${typeProfile.healthyTraits.en.slice(0, 2).join(', ')}. Seek environments that allow you to express these strengths.`;

  let strengthsSynergy: string | undefined;
  if (strengths && (strengths.skills.length > 0 || strengths.attitudes.length > 0 || strengths.values.length > 0)) {
    const allStrengths = [...strengths.skills, ...strengths.attitudes, ...strengths.values].slice(0, 5);
    strengthsSynergy = locale === 'ko'
      ? `발견된 강점(${allStrengths.join(', ')})은 ${typeProfile.name.ko} 유형과 자연스럽게 연결됩니다. 이 강점들을 의식적으로 활용하면 유형의 긍정적 특성을 더욱 발휘할 수 있습니다.`
      : `Your discovered strengths (${allStrengths.join(', ')}) naturally complement your ${typeProfile.name.en} type. Consciously leveraging these strengths can enhance the positive aspects of your type.`;
  }

  return {
    interpretation: {
      typeOverview,
      wingInfluence,
      instinctFocus,
      strengthsSynergy,
      growthPath,
      careerInsights,
    },
  };
}
