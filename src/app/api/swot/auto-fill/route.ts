import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/swot/auto-fill
 *
 * AI-powered SWOT auto-fill based on user's previous module data:
 * - Values (terminal, instrumental, work)
 * - Strengths (from AI conversation)
 * - Enneagram type
 * - Vision statement
 *
 * Returns suggested SWOT items for all 4 categories.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Authentication
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    // Fetch all previous module data in parallel
    const [valuesData, strengthsData, enneagramData, visionData] = await Promise.all([
      fetchValuesData(supabase, userId),
      fetchStrengthsData(supabase, userId),
      fetchEnneagramData(supabase, userId),
      fetchVisionData(supabase, userId),
    ]);

    // Check if we have enough data
    const hasData = valuesData || strengthsData || enneagramData || visionData;

    if (!hasData) {
      return NextResponse.json({
        suggestions: null,
        message: 'Please complete at least one previous module (Values, Strengths, Enneagram, or Vision) for personalized suggestions.',
        fallback: generateFallbackSwot(),
      });
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
      // Return fallback suggestions without AI
      return NextResponse.json({
        suggestions: generateFallbackSwotFromData({ valuesData, strengthsData, enneagramData, visionData }),
        source: 'fallback',
        message: 'AI service not configured. Using template-based suggestions.',
      });
    }

    // Generate AI suggestions
    const anthropic = new Anthropic({ apiKey });
    const suggestions = await generateAISwotSuggestions(anthropic, {
      values: valuesData,
      strengths: strengthsData,
      enneagram: enneagramData,
      vision: visionData,
    });

    return NextResponse.json({
      suggestions,
      source: 'ai',
      profileSummary: {
        hasValues: !!valuesData,
        hasStrengths: !!strengthsData,
        hasEnneagram: !!enneagramData,
        hasVision: !!visionData,
      },
    });
  } catch (error) {
    console.error('[SWOT Auto-fill] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SWOT suggestions' },
      { status: 500 }
    );
  }
}

// Fetch user's values
async function fetchValuesData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('value_results')
      .select('value_set, top3')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (!data || data.length === 0) return null;

    const terminalRecord = data.find((r: any) => r.value_set === 'terminal');
    const instrumentalRecord = data.find((r: any) => r.value_set === 'instrumental');
    const workRecord = data.find((r: any) => r.value_set === 'work');

    return {
      terminal: Array.isArray(terminalRecord?.top3) ? terminalRecord.top3.slice(0, 3) : [],
      instrumental: Array.isArray(instrumentalRecord?.top3) ? instrumentalRecord.top3.slice(0, 3) : [],
      work: Array.isArray(workRecord?.top3) ? workRecord.top3.slice(0, 3) : [],
    };
  } catch (error) {
    console.error('[SWOT Auto-fill] Error fetching values:', error);
    return null;
  }
}

// Fetch user's strengths
async function fetchStrengthsData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('strength_discovery_results')
      .select('final_strengths')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data || !data.final_strengths) return null;

    const strengths = JSON.parse(data.final_strengths);
    return strengths.slice(0, 5).map((s: any) => s.name || s);
  } catch (error) {
    return null;
  }
}

// Fetch user's enneagram type
async function fetchEnneagramData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('enneagram_results')
      .select('primary_type, wing, tritype')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      type: data.primary_type,
      wing: data.wing,
      tritype: data.tritype,
    };
  } catch (error) {
    return null;
  }
}

// Fetch user's vision statement
async function fetchVisionData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('vision_statements')
      .select('final_statement, core_aspirations')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      statement: data.final_statement,
      aspirations: data.core_aspirations ? JSON.parse(data.core_aspirations).map((a: any) => a.keyword) : [],
    };
  } catch (error) {
    return null;
  }
}

// Generate AI-powered SWOT suggestions
async function generateAISwotSuggestions(anthropic: Anthropic, context: any) {
  const { values, strengths, enneagram, vision } = context;

  let prompt = `You are a career counselor helping a user perform a personal SWOT analysis.

Based on the following user profile data, generate a personalized SWOT analysis with EXACTLY 4 items per category (16 total items).

## User Profile:`;

  if (values) {
    if (values.terminal?.length > 0) {
      prompt += `\n- Terminal Values (life goals): ${values.terminal.join(', ')}`;
    }
    if (values.instrumental?.length > 0) {
      prompt += `\n- Instrumental Values (behaviors): ${values.instrumental.join(', ')}`;
    }
    if (values.work?.length > 0) {
      prompt += `\n- Work Values: ${values.work.join(', ')}`;
    }
  }

  if (strengths && strengths.length > 0) {
    prompt += `\n- Key Strengths: ${strengths.join(', ')}`;
  }

  if (enneagram) {
    prompt += `\n- Enneagram Type: ${enneagram.type}${enneagram.wing ? `w${enneagram.wing}` : ''}`;
  }

  if (vision && vision.statement) {
    prompt += `\n- Vision Statement: "${vision.statement}"`;
    if (vision.aspirations?.length > 0) {
      prompt += `\n- Core Aspirations: ${vision.aspirations.join(', ')}`;
    }
  }

  prompt += `

## SWOT Categories:

**Strengths (S)**: Internal positive attributes that give advantage
- Use the user's discovered strengths from conversations
- Connect to their values and enneagram type
- Be specific and personal, not generic

**Weaknesses (W)**: Internal areas that need improvement
- Identify potential blind spots based on their enneagram type
- Areas that might conflict with their values
- Skills or traits they might need to develop

**Opportunities (O)**: External factors they can leverage
- How their strengths can be applied in the market/career
- Trends that align with their vision
- Growth areas based on their values

**Threats (T)**: External challenges they might face
- Market or industry challenges for their vision
- Potential obstacles to achieving their goals
- Areas where their weaknesses could be exploited

## Output Format:
Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):

{
  "strengths": [
    { "id": "S1", "text": "Specific strength 1" },
    { "id": "S2", "text": "Specific strength 2" },
    { "id": "S3", "text": "Specific strength 3" },
    { "id": "S4", "text": "Specific strength 4" }
  ],
  "weaknesses": [
    { "id": "W1", "text": "Specific weakness 1" },
    { "id": "W2", "text": "Specific weakness 2" },
    { "id": "W3", "text": "Specific weakness 3" },
    { "id": "W4", "text": "Specific weakness 4" }
  ],
  "opportunities": [
    { "id": "O1", "text": "Specific opportunity 1" },
    { "id": "O2", "text": "Specific opportunity 2" },
    { "id": "O3", "text": "Specific opportunity 3" },
    { "id": "O4", "text": "Specific opportunity 4" }
  ],
  "threats": [
    { "id": "T1", "text": "Specific threat 1" },
    { "id": "T2", "text": "Specific threat 2" },
    { "id": "T3", "text": "Specific threat 3" },
    { "id": "T4", "text": "Specific threat 4" }
  ]
}

Each item should be 1-2 sentences, specific to this user, and actionable.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON from response
    let cleanedText = content.text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('[SWOT Auto-fill] AI generation error:', error);
    // Return fallback on error
    return generateFallbackSwotFromData(context);
  }
}

// Generate fallback SWOT when AI is not available
function generateFallbackSwot() {
  return {
    strengths: [
      { id: 'S1', text: 'Ability to learn and adapt to new situations' },
      { id: 'S2', text: 'Strong communication skills' },
      { id: 'S3', text: 'Problem-solving mindset' },
      { id: 'S4', text: 'Reliable and committed to tasks' },
    ],
    weaknesses: [
      { id: 'W1', text: 'Limited experience in some areas' },
      { id: 'W2', text: 'May need to improve time management' },
      { id: 'W3', text: 'Sometimes hesitant to take risks' },
      { id: 'W4', text: 'Could benefit from broader networking' },
    ],
    opportunities: [
      { id: 'O1', text: 'Growing job market in emerging industries' },
      { id: 'O2', text: 'Online learning platforms for skill development' },
      { id: 'O3', text: 'Remote work opportunities expanding options' },
      { id: 'O4', text: 'Mentorship programs available in the field' },
    ],
    threats: [
      { id: 'T1', text: 'Competitive job market in desired field' },
      { id: 'T2', text: 'Rapidly changing technology requirements' },
      { id: 'T3', text: 'Economic uncertainty affecting opportunities' },
      { id: 'T4', text: 'Work-life balance challenges' },
    ],
  };
}

// Generate fallback SWOT from available user data
function generateFallbackSwotFromData(context: any) {
  const { valuesData, strengthsData, enneagramData, visionData } = context;

  const strengths = [];
  const weaknesses = [];
  const opportunities = [];
  const threats = [];

  // Build strengths from user data
  if (strengthsData && strengthsData.length > 0) {
    strengthsData.slice(0, 4).forEach((s: string, i: number) => {
      strengths.push({ id: `S${i + 1}`, text: `Strong in ${s}` });
    });
  }
  while (strengths.length < 4) {
    strengths.push({ id: `S${strengths.length + 1}`, text: 'Ability to learn and grow' });
  }

  // Build weaknesses based on enneagram
  const enneagramWeaknesses: Record<number, string[]> = {
    1: ['Tendency toward perfectionism', 'Can be overly critical'],
    2: ['May neglect own needs', 'Difficulty setting boundaries'],
    3: ['May focus too much on image', 'Workaholic tendencies'],
    4: ['Tendency toward moodiness', 'May dwell on negative feelings'],
    5: ['May withdraw from others', 'Can overthink decisions'],
    6: ['Tendency toward anxiety', 'May be overly cautious'],
    7: ['Difficulty with follow-through', 'May avoid difficult emotions'],
    8: ['Can be confrontational', 'Difficulty showing vulnerability'],
    9: ['Tendency to avoid conflict', 'May be indecisive'],
  };

  if (enneagramData?.type) {
    const typeWeaknesses = enneagramWeaknesses[enneagramData.type] || [];
    typeWeaknesses.slice(0, 2).forEach((w, i) => {
      weaknesses.push({ id: `W${i + 1}`, text: w });
    });
  }
  while (weaknesses.length < 4) {
    weaknesses.push({ id: `W${weaknesses.length + 1}`, text: 'Area for continued growth and development' });
  }

  // Build opportunities from values
  if (valuesData?.work && valuesData.work.length > 0) {
    valuesData.work.slice(0, 2).forEach((v: string, i: number) => {
      opportunities.push({ id: `O${i + 1}`, text: `Career paths aligned with ${v}` });
    });
  }
  while (opportunities.length < 4) {
    opportunities.push({ id: `O${opportunities.length + 1}`, text: 'Emerging opportunities in your field' });
  }

  // Build threats (general)
  threats.push({ id: 'T1', text: 'Competitive job market in desired field' });
  threats.push({ id: 'T2', text: 'Rapidly changing industry requirements' });
  threats.push({ id: 'T3', text: 'Economic factors affecting career options' });
  threats.push({ id: 'T4', text: 'Work-life balance challenges' });

  return { strengths, weaknesses, opportunities, threats };
}
