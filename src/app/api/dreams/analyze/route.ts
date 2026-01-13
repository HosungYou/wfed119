import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';

type LifeStage = '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';
type WellbeingArea = 'relationship' | 'spiritual' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure';

const LIFE_STAGES: LifeStage[] = ['20s', '30s', '40s', '50s', '60s', '70s+'];
const WELLBEING_AREAS: WellbeingArea[] = ['relationship', 'spiritual', 'intellectual', 'physical', 'environment', 'financial', 'career', 'leisure'];

interface TableEntry {
  id: string;
  title: string;
  life_stage: LifeStage;
  wellbeing_area: WellbeingArea;
  why?: string;
}

interface MatrixState {
  [key: string]: string[]; // e.g., "relationship-20s": ["dream_id_1", "dream_id_2"]
}

interface MissingAnalysis {
  area: WellbeingArea;
  stage: LifeStage;
  message: string;
}

interface Recommendation {
  title: string;
  description: string;
  wellbeing_area: WellbeingArea;
  life_stage: LifeStage;
  why: string;
  related_values?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await request.json();
    const { tableData, matrixState } = body as { tableData: TableEntry[]; matrixState: MatrixState };

    // Fetch user profile data from other modules
    const [valuesData, strengthsData, visionData, swotData] = await Promise.all([
      fetchValuesData(supabase, userId),
      fetchStrengthsData(supabase, userId),
      fetchVisionData(supabase, userId),
      fetchSwotData(supabase, userId)
    ]);

    // Analyze missing areas in the matrix
    const missingAnalysis = analyzeMissingAreas(matrixState, tableData);

    // Generate AI recommendations
    const recommendations = await generateAIRecommendations({
      tableData,
      matrixState,
      missingAnalysis,
      values: valuesData,
      strengths: strengthsData,
      vision: visionData,
      swot: swotData
    });

    // Generate summary
    const coveredAreas = new Set<WellbeingArea>();
    const coveredStages = new Set<LifeStage>();

    Object.keys(matrixState).forEach(key => {
      if (matrixState[key].length > 0) {
        const [area, stage] = key.split('-') as [WellbeingArea, LifeStage];
        coveredAreas.add(area);
        coveredStages.add(stage);
      }
    });

    tableData.forEach(entry => {
      if (entry.wellbeing_area && entry.life_stage) {
        coveredAreas.add(entry.wellbeing_area);
        coveredStages.add(entry.life_stage);
      }
    });

    const summary = `Your dreams cover ${coveredAreas.size}/8 wellbeing areas and ${coveredStages.size}/6 life stages. ${
      missingAnalysis.length > 0
        ? `Consider adding dreams in: ${missingAnalysis.slice(0, 3).map(m => `${m.area}-${m.stage}`).join(', ')}.`
        : 'Great coverage across all areas!'
    }`;

    return NextResponse.json({
      missingAnalysis,
      recommendations,
      summary
    });
  } catch (error) {
    console.error('Error analyzing dreams:', error);
    return NextResponse.json(
      { error: 'Failed to analyze dreams' },
      { status: 500 }
    );
  }
}

// Analyze which matrix cells are empty or underrepresented
function analyzeMissingAreas(matrixState: MatrixState, tableData: TableEntry[]): MissingAnalysis[] {
  const missing: MissingAnalysis[] = [];
  const cellCounts: Record<string, number> = {};

  // Count existing dreams in matrix
  Object.entries(matrixState).forEach(([key, dreamIds]) => {
    cellCounts[key] = dreamIds.length;
  });

  // Add table entries to counts
  tableData.forEach(entry => {
    if (entry.wellbeing_area && entry.life_stage) {
      const key = `${entry.wellbeing_area}-${entry.life_stage}`;
      cellCounts[key] = (cellCounts[key] || 0) + 1;
    }
  });

  // Find completely empty cells (prioritize important life stages)
  const priorityStages: LifeStage[] = ['30s', '40s', '50s', '20s', '60s', '70s+'];
  const priorityAreas: WellbeingArea[] = ['career', 'relationship', 'financial', 'physical', 'intellectual', 'spiritual', 'leisure', 'environment'];

  for (const stage of priorityStages) {
    for (const area of priorityAreas) {
      const key = `${area}-${stage}`;
      const count = cellCounts[key] || 0;

      if (count === 0) {
        missing.push({
          area,
          stage,
          message: getMissingMessage(area, stage)
        });
      }
    }
  }

  // Limit to top 5 most important missing areas
  return missing.slice(0, 5);
}

function getMissingMessage(area: WellbeingArea, stage: LifeStage): string {
  const messages: Record<WellbeingArea, Record<LifeStage, string>> = {
    relationship: {
      '20s': 'Building meaningful relationships in your 20s sets the foundation for lifelong connections.',
      '30s': 'Family and partnership goals in your 30s shape your support network.',
      '40s': 'Nurturing relationships with aging parents and growing children is crucial in your 40s.',
      '50s': 'Deepening bonds with adult children and rekindling couple intimacy matters in your 50s.',
      '60s': 'Prioritizing spouse companionship and grandchildren relationships enriches your 60s.',
      '70s+': 'Cherishing family time and creating lasting memories becomes precious in your 70s+.'
    },
    spiritual: {
      '20s': 'Exploring your values and beliefs in your 20s guides future decisions.',
      '30s': 'Finding deeper meaning through parenting and service enriches your 30s.',
      '40s': 'Midlife reflection and existential questioning can bring clarity in your 40s.',
      '50s': 'Life review and mission fulfillment become important in your 50s.',
      '60s': 'Cultivating peace, gratitude, and spiritual maturity enhances your 60s.',
      '70s+': 'Spiritual preparation and acceptance of mortality brings peace in your 70s+.'
    },
    intellectual: {
      '20s': 'Skill acquisition and creative exploration in your 20s builds your foundation.',
      '30s': 'Professional development and intellectual hobbies keep you sharp in your 30s.',
      '40s': 'Continuous learning and knowledge sharing become valuable in your 40s.',
      '50s': 'Lifelong learning and new challenges keep you engaged in your 50s.',
      '60s': 'Cognitive activities and teaching others maintain brain health in your 60s.',
      '70s+': 'Brain health maintenance and wisdom sharing remain important in your 70s+.'
    },
    physical: {
      '20s': 'Establishing healthy habits in your 20s impacts lifelong wellness.',
      '30s': 'Managing family stress and maintaining fitness matters in your 30s.',
      '40s': 'Chronic disease prevention and regular exercise become crucial in your 40s.',
      '50s': 'Metabolic and joint health need attention in your 50s.',
      '60s': 'Fall prevention and physical activity maintenance are key in your 60s.',
      '70s+': 'Mobility and daily living skills preservation matter most in your 70s+.'
    },
    environment: {
      '20s': 'Creating your first independent living space shapes your 20s.',
      '30s': 'Building a family-friendly home environment matters in your 30s.',
      '40s': 'Optimizing your living space for family needs is important in your 40s.',
      '50s': 'Planning for downsizing and accessibility starts in your 50s.',
      '60s': 'Senior-friendly home modifications enhance safety in your 60s.',
      '70s+': 'Safe aging-in-place preparations become essential in your 70s+.'
    },
    financial: {
      '20s': 'Building financial literacy and savings habits in your 20s pays dividends.',
      '30s': 'Home purchase and education savings become priorities in your 30s.',
      '40s': 'Retirement savings acceleration is critical in your 40s.',
      '50s': 'Retirement fund completion and investment management peak in your 50s.',
      '60s': 'Retirement income and estate planning need attention in your 60s.',
      '70s+': 'Healthcare costs and inheritance planning dominate your 70s+.'
    },
    career: {
      '20s': 'Career exploration and skill building launch your 20s.',
      '30s': 'Career advancement and work-life balance challenge your 30s.',
      '40s': 'Career peak and mentoring opportunities define your 40s.',
      '50s': 'Career maturity and retirement transition planning guide your 50s.',
      '60s': 'Gradual retirement and new role exploration enrich your 60s.',
      '70s+': 'Meaningful engagement and social contribution continue in your 70s+.'
    },
    leisure: {
      '20s': 'Travel and adventure exploration make your 20s memorable.',
      '30s': 'Family-centered activities and maintaining hobbies balance your 30s.',
      '40s': 'Personal hobbies and family travel create memories in your 40s.',
      '50s': 'Couple-centered leisure and new hobbies flourish in your 50s.',
      '60s': 'Hobby deepening and cultural engagement enrich your 60s.',
      '70s+': 'Simple pleasures and quality time become precious in your 70s+.'
    }
  };

  return messages[area]?.[stage] || `Consider adding dreams for ${area} in your ${stage}.`;
}

// Fetch user data functions
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
      top_terminal: Array.isArray(terminalRecord?.top3) ? terminalRecord.top3.slice(0, 3) : [],
      top_instrumental: Array.isArray(instrumentalRecord?.top3) ? instrumentalRecord.top3.slice(0, 3) : [],
      top_work: Array.isArray(workRecord?.top3) ? workRecord.top3.slice(0, 3) : []
    };
  } catch (error) {
    console.error('Error fetching values:', error);
    return null;
  }
}

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
    console.error('Error fetching strengths:', error);
    return null;
  }
}

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
      aspirations: data.core_aspirations ? JSON.parse(data.core_aspirations).map((a: any) => a.keyword) : []
    };
  } catch (error) {
    console.error('Error fetching vision:', error);
    return null;
  }
}

async function fetchSwotData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('swot_analyses')
      .select('strengths, weaknesses, opportunities, threats')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      opportunities: data.opportunities || [],
      threats: data.threats || []
    };
  } catch (error) {
    console.error('Error fetching SWOT:', error);
    return null;
  }
}

// Generate AI recommendations using Claude
async function generateAIRecommendations(context: {
  tableData: TableEntry[];
  matrixState: MatrixState;
  missingAnalysis: MissingAnalysis[];
  values: any;
  strengths: any;
  vision: any;
  swot: any;
}): Promise<Recommendation[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not configured, returning empty recommendations');
    return [];
  }

  const { tableData, matrixState, missingAnalysis, values, strengths, vision, swot } = context;

  // If no profile data, return basic recommendations based on missing areas
  if (!values && !strengths && !vision && !swot) {
    return missingAnalysis.slice(0, 4).map(missing => ({
      title: `Explore ${missing.area} goals for your ${missing.stage}`,
      description: missing.message,
      wellbeing_area: missing.area,
      life_stage: missing.stage,
      why: 'Based on gaps in your dream matrix'
    }));
  }

  const anthropic = new Anthropic({ apiKey });

  let prompt = `You are a life coach helping users create personalized dream goals.

User Profile:`;

  if (values && values.top_terminal.length > 0) {
    prompt += `\n- Core Values: ${values.top_terminal.join(', ')}`;
  }
  if (values && values.top_work.length > 0) {
    prompt += `\n- Work Values: ${values.top_work.join(', ')}`;
  }
  if (strengths && strengths.length > 0) {
    prompt += `\n- Key Strengths: ${strengths.join(', ')}`;
  }
  if (vision && vision.statement) {
    prompt += `\n- Vision: "${vision.statement}"`;
  }
  if (swot) {
    if (swot.strengths?.length) prompt += `\n- SWOT Strengths: ${swot.strengths.slice(0, 3).join(', ')}`;
    if (swot.opportunities?.length) prompt += `\n- SWOT Opportunities: ${swot.opportunities.slice(0, 3).join(', ')}`;
  }

  prompt += `\n
Current Dreams Added:
${tableData.map(e => `- ${e.title} (${e.wellbeing_area}, ${e.life_stage})`).join('\n') || 'None yet'}

Missing Areas (need dreams):
${missingAnalysis.map(m => `- ${m.area} in ${m.stage}: ${m.message}`).join('\n')}

Generate 4-6 personalized dream recommendations that:
1. Fill the missing areas identified above
2. Align with the user's values, strengths, and vision
3. Are specific and actionable
4. Include a brief "why" explanation connecting to user's profile

Wellbeing Areas:
- relationship: Relationships and emotional connections
- spiritual: Meaning, purpose, and inner growth
- intellectual: Mental stimulation and learning
- physical: Health, fitness, and body wellbeing
- environment: Living space and surroundings
- financial: Money, security, and wealth
- career: Work and professional life
- leisure: Recreation and hobbies

Return ONLY a JSON array. No other text.
Format:
[
  {
    "title": "Short, inspiring title (max 60 chars)",
    "description": "Brief description (max 100 chars)",
    "wellbeing_area": "one of the 8 areas",
    "life_stage": "20s|30s|40s|50s|60s|70s+",
    "why": "Why this aligns with user's profile (max 80 chars)",
    "related_values": ["relevant", "values"]
  }
]`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const recommendations = JSON.parse(jsonMatch[0]) as Recommendation[];
      return recommendations.slice(0, 6);
    }

    return [];
  } catch (error) {
    console.error('Error calling Claude API:', error);
    // Return fallback recommendations based on missing areas
    return missingAnalysis.slice(0, 4).map(missing => ({
      title: `Set a ${missing.area} goal for your ${missing.stage}`,
      description: missing.message.substring(0, 100),
      wellbeing_area: missing.area,
      life_stage: missing.stage,
      why: 'Based on gaps in your dream matrix'
    }));
  }
}
