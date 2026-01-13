import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/discover/mission/ai-suggest
 * Generate AI-powered mission statement suggestions
 */
export async function POST(request: NextRequest) {
  let body: any = null;

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

    body = await request.json();
    const { values, purposeAnswers, context, type = 'draft' } = body;

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
      // Return fallback suggestion
      return NextResponse.json({
        suggestion: generateFallbackMission(values, purposeAnswers),
        source: 'fallback',
        message: 'AI service not configured. Using template-based suggestion.',
      });
    }

    // Generate AI suggestion
    const anthropic = new Anthropic({ apiKey });
    const suggestion = await generateAISuggestion(anthropic, {
      values,
      purposeAnswers,
      context,
      type,
    });

    return NextResponse.json({
      suggestion,
      source: 'ai',
    });
  } catch (error) {
    console.error('[Mission AI Suggest] Error:', error);

    // Return fallback instead of 500 error
    const fallbackMission = generateFallbackMission(body?.values, body?.purposeAnswers);
    return NextResponse.json({
      suggestion: fallbackMission,
      source: 'fallback',
      error: 'AI service temporarily unavailable. Using template-based suggestion.',
    });
  }
}

async function generateAISuggestion(
  anthropic: Anthropic,
  data: {
    values: any;
    purposeAnswers: any;
    context?: any;
    type: string;
  }
) {
  const { values, purposeAnswers, context, type } = data;

  let prompt = '';

  if (type === 'draft') {
    prompt = `You are a career coach helping someone craft their personal mission statement.

Based on the following information, generate a concise, powerful mission statement (2-3 sentences max).

## User's Core Values:
${formatValues(values)}

## Purpose Answers:
- What do you do? ${purposeAnswers.whatDoYouDo || 'Not provided'}
- For whom? ${purposeAnswers.forWhom || 'Not provided'}
- How do you do it? ${purposeAnswers.howDoYouDoIt || 'Not provided'}
- What impact do you make? ${purposeAnswers.whatImpact || 'Not provided'}
- Why does it matter? ${purposeAnswers.whyDoesItMatter || 'Not provided'}

${context?.vision ? `## Vision Statement:
"${context.vision.statement}"` : ''}

${context?.strengths ? `## Key Strengths:
${context.strengths.map((s: any) => `- ${s.name}`).join('\n')}` : ''}

## Mission Statement Guidelines:
1. Start with "My mission is..." or "I exist to..."
2. Be specific and personal (not generic)
3. Include WHO you serve, WHAT you do, and WHY it matters
4. Use action verbs
5. Keep it memorable (2-3 sentences max)
6. Align with the user's stated values

Generate ONLY the mission statement text, nothing else. No explanations, no formatting, just the mission statement.`;
  } else if (type === 'refine') {
    prompt = `You are a career coach helping refine a mission statement.

Current draft:
"${data.context?.currentDraft || ''}"

Feedback request: ${data.context?.feedbackRequest || 'Make it more impactful'}

Values to emphasize:
${formatValues(values)}

Provide an improved version that:
1. Addresses the feedback
2. Stays true to the user's values
3. Remains concise (2-3 sentences)
4. Uses powerful, active language

Generate ONLY the refined mission statement text, nothing else.`;
  } else if (type === 'feedback') {
    prompt = `Analyze this mission statement and provide brief, constructive feedback:

"${data.context?.currentDraft || ''}"

User's values: ${formatValues(values)}

Provide feedback in JSON format:
{
  "clarity": { "score": 0-10, "feedback": "..." },
  "values_alignment": { "score": 0-10, "feedback": "..." },
  "impact": { "score": 0-10, "feedback": "..." },
  "actionability": { "score": 0-10, "feedback": "..." },
  "overall": { "score": 0-10, "summary": "..." },
  "suggestions": ["suggestion1", "suggestion2"]
}`;
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    if (type === 'feedback') {
      // Parse JSON for feedback with robust error handling
      let cleanedText = content.text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }

      try {
        return JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('[Mission AI Suggest] JSON parse error:', parseError, 'Raw text:', cleanedText);
        // Return a fallback feedback structure
        return {
          clarity: { score: 7, feedback: 'Unable to analyze. Please try again.' },
          values_alignment: { score: 7, feedback: 'Unable to analyze.' },
          impact: { score: 7, feedback: 'Unable to analyze.' },
          actionability: { score: 7, feedback: 'Unable to analyze.' },
          overall: { score: 7, summary: 'AI analysis temporarily unavailable. Please try again.' },
          suggestions: ['Try refining your mission statement to be more specific.']
        };
      }
    }

    return content.text.trim();
  } catch (error) {
    console.error('[Mission AI Suggest] AI error:', error);
    throw error;
  }
}

function formatValues(values: any): string {
  if (!values) return 'No values provided';

  const parts: string[] = [];

  if (values.terminal?.length > 0) {
    parts.push(`Terminal Values: ${values.terminal.map((v: any) => v.name || v).join(', ')}`);
  }
  if (values.instrumental?.length > 0) {
    parts.push(`Instrumental Values: ${values.instrumental.map((v: any) => v.name || v).join(', ')}`);
  }
  if (values.work?.length > 0) {
    parts.push(`Work Values: ${values.work.map((v: any) => v.name || v).join(', ')}`);
  }

  return parts.join('\n') || 'No values provided';
}

function generateFallbackMission(values: any, purposeAnswers: any): string {
  // Generate a template-based mission when AI is unavailable
  const what = purposeAnswers?.whatDoYouDo || 'making a positive impact';
  const whom = purposeAnswers?.forWhom || 'those around me';
  const why = purposeAnswers?.whyDoesItMatter || 'creating meaningful change';

  const valuesList = [];
  if (values?.terminal?.[0]) valuesList.push(values.terminal[0].name || values.terminal[0]);
  if (values?.instrumental?.[0]) valuesList.push(values.instrumental[0].name || values.instrumental[0]);

  const valuesStr = valuesList.length > 0
    ? `guided by ${valuesList.join(' and ')}`
    : 'with integrity and purpose';

  return `My mission is to ${what} for ${whom}, ${valuesStr}. I am committed to ${why} through my work and daily actions.`;
}
