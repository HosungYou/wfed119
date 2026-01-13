import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/discover/mission/ai-roles
 * Generate AI-powered life role suggestions based on user's values and strengths
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await request.json();
    const { type } = body;

    if (type !== 'suggest_roles') {
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
    };

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        roles: generateFallbackRoles(),
        source: 'fallback',
        message: 'AI service not configured. Using template-based suggestions.',
      });
    }

    // Generate AI suggestions
    const anthropic = new Anthropic({ apiKey });
    const roles = await generateAIRoles(anthropic, context);

    return NextResponse.json({
      roles,
      source: 'ai',
    });
  } catch (error) {
    console.error('[Mission AI Roles] Error:', error);
    return NextResponse.json({
      roles: generateFallbackRoles(),
      source: 'fallback',
      error: 'AI service temporarily unavailable. Using template-based suggestions.',
    });
  }
}

async function generateAIRoles(
  anthropic: Anthropic,
  context: {
    values: any;
    strengths: any;
    vision: any;
  }
) {
  const { values, strengths, vision } = context;

  const prompt = `You are a career coach helping someone explore their life roles.

Based on their background, suggest 8-10 meaningful life roles they might identify with.

## User Context:
${values ? `### Values:
- Terminal Values: ${values.terminal_values?.map((v: any) => v.name || v).join(', ') || 'Not provided'}
- Instrumental Values: ${values.instrumental_values?.map((v: any) => v.name || v).join(', ') || 'Not provided'}
- Work Values: ${values.work_values?.map((v: any) => v.name || v).join(', ') || 'Not provided'}` : 'Values not available'}

${strengths ? `### Strengths:
${strengths.top_strengths?.map((s: any) => `- ${s.name || s}`).join('\n') || 'Not provided'}` : 'Strengths not available'}

${vision ? `### Vision Statement:
"${vision.final_statement || vision.vision_statement || 'Not provided'}"` : 'Vision not available'}

## Task:
Generate life roles in the following JSON format. Each role should have:
- entity: The person/group the user has a relationship with (e.g., "Family", "Team", "Community")
- entityKo: Korean translation of entity
- role: The role the user plays (e.g., "Supportive Parent", "Mentor", "Leader")
- roleKo: Korean translation of role
- source: Brief reason why this role fits them (based on their values/strengths)

Respond with ONLY valid JSON array, no markdown formatting:
[
  {"entity": "Family", "entityKo": "가족", "role": "Supportive Parent", "roleKo": "지지하는 부모", "source": "Based on your value of family and nurturing strength"},
  ...
]

Include diverse roles across:
- Family relationships
- Professional/work relationships
- Community/social relationships
- Personal growth roles
- Creative/hobby roles`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
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

    const roles = JSON.parse(cleanedText);
    return roles.map((r: any, index: number) => ({
      id: `ai_${Date.now()}_${index}`,
      ...r,
    }));
  } catch (error) {
    console.error('[Mission AI Roles] AI error:', error);
    throw error;
  }
}

function generateFallbackRoles() {
  return [
    { id: 'fallback_1', entity: 'Family', entityKo: '가족', role: 'Caring Family Member', roleKo: '돌보는 가족 구성원', source: 'Common role' },
    { id: 'fallback_2', entity: 'Workplace', entityKo: '직장', role: 'Dedicated Professional', roleKo: '헌신적인 전문가', source: 'Common role' },
    { id: 'fallback_3', entity: 'Friends', entityKo: '친구', role: 'Supportive Friend', roleKo: '지지하는 친구', source: 'Common role' },
    { id: 'fallback_4', entity: 'Community', entityKo: '지역사회', role: 'Active Contributor', roleKo: '적극적인 기여자', source: 'Common role' },
    { id: 'fallback_5', entity: 'Self', entityKo: '자신', role: 'Lifelong Learner', roleKo: '평생 학습자', source: 'Common role' },
    { id: 'fallback_6', entity: 'Team', entityKo: '팀', role: 'Collaborative Partner', roleKo: '협력적인 파트너', source: 'Common role' },
    { id: 'fallback_7', entity: 'Society', entityKo: '사회', role: 'Responsible Citizen', roleKo: '책임감 있는 시민', source: 'Common role' },
    { id: 'fallback_8', entity: 'Hobby Groups', entityKo: '취미 모임', role: 'Enthusiastic Participant', roleKo: '열정적인 참여자', source: 'Common role' },
  ];
}
