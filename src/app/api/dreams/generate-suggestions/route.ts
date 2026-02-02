import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';

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

    // Fetch data from other modules
    const [valuesData, strengthsData, visionData, existingDreams] = await Promise.all([
      fetchValuesData(supabase, userId),
      fetchStrengthsData(supabase, userId),
      fetchVisionData(supabase, userId),
      fetchExistingDreams(supabase, userId)
    ]);

    // Validate that at least one module has data
    if (!valuesData && !strengthsData && !visionData) {
      return NextResponse.json(
        {
          error: 'No profile data found',
          message: 'Please complete at least one of the following modules: Values, Strengths, or Vision'
        },
        { status: 400 }
      );
    }

    // Analyze existing dreams pattern
    const dreamAnalysis = analyzeDreamPatterns(existingDreams);

    // Generate AI suggestions
    const suggestions = await generateAISuggestions({
      values: valuesData,
      strengths: strengthsData,
      vision: visionData,
      dreamAnalysis
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating dream suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

// Fetch user's top values from value_results table
async function fetchValuesData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('value_results')
      .select('value_set, top3')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (!data || data.length === 0) return null;

    // Group by value_set
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

// Fetch user's top strengths
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
      aspirations: data.core_aspirations ? JSON.parse(data.core_aspirations).map((a: any) => a.keyword) : []
    };
  } catch (error) {
    console.error('Error fetching vision:', error);
    return null;
  }
}

// Fetch existing dreams from in-memory store
async function fetchExistingDreams(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('dreams')
      .select('id, title, wellbeing_area, life_stage, category')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return data || [];
  } catch (error) {
    console.error('Error fetching dreams:', error);
    return [];
  }
}

// Analyze dream patterns
function analyzeDreamPatterns(dreams: any[]) {
  const categoryCount = {
    exploration: dreams.filter(d => d.category === 'exploration').length,
    learning: dreams.filter(d => d.category === 'learning').length,
    achievement: dreams.filter(d => d.category === 'achievement').length,
    experience: dreams.filter(d => d.category === 'experience').length
  };

  // Find underrepresented categories
  const totalDreams = dreams.length;
  const avgPerCategory = totalDreams / 4;
  const gaps = Object.entries(categoryCount)
    .filter(([_, count]) => count < avgPerCategory)
    .map(([category, _]) => category);

  return {
    categoryCount,
    gaps: gaps.length > 0 ? gaps : ['learning', 'experience'], // Default gaps
    totalDreams
  };
}

// Generate AI suggestions using Groq
async function generateAISuggestions(context: any) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.length < 10) {
    // Return fallback suggestions without AI
    console.warn('[Dreams AI] API key not configured, returning fallback suggestions');
    return generateFallbackSuggestions(context);
  }

  const groq = new Groq({ apiKey });

  const prompt = buildAIPrompt(context);

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      return suggestions;
    }

    return [];
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

// Build AI prompt with user context
function buildAIPrompt(context: any) {
  const { values, strengths, vision, dreamAnalysis } = context;

  let prompt = `You are a life coach helping users expand their dream list with personalized suggestions.

User Context:`;

  if (values && values.top_terminal.length > 0) {
    prompt += `\n- Top Values: ${values.top_terminal.join(', ')}`;
  }

  if (strengths && strengths.length > 0) {
    prompt += `\n- Key Strengths: ${strengths.join(', ')}`;
  }

  if (vision && vision.statement) {
    prompt += `\n- Vision Statement: "${vision.statement}"`;
  }

  prompt += `\n
Dream List Analysis:
- Exploration dreams: ${dreamAnalysis.categoryCount.exploration}
- Learning dreams: ${dreamAnalysis.categoryCount.learning}
- Achievement dreams: ${dreamAnalysis.categoryCount.achievement}
- Experience dreams: ${dreamAnalysis.categoryCount.experience}
- Gap categories (need more): ${dreamAnalysis.gaps.join(', ')}

Generate 8 personalized dream suggestions that:
1. Align with the user's values and vision
2. Leverage their key strengths
3. Fill in the gap categories
4. Are specific and actionable
5. Cover different life stages (20s, 30s, 40s, 50s, 60s, 70s+)
6. Span across diverse wellbeing areas

Distribution:
- 3 dreams for the biggest gap category
- 2 dreams for the second gap category
- 3 dreams spread across other categories

For each dream, provide:
- title: Short, inspiring title (max 60 chars)
- description: Brief description (max 120 chars)
- life_stage: '20s' | '30s' | '40s' | '50s' | '60s' | '70s+'
- wellbeing_area: 'relationship' | 'spiritual' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure'
- related_values: Array of related value names from user's top values
- why: Brief explanation of why this aligns with user (max 80 chars)

Wellbeing Areas Explanation:
- relationship: Relationships and emotional connections (관계/정서)
- spiritual: Meaning, purpose, and inner growth (영적)
- intellectual: Mental stimulation and learning (지적)
- physical: Health, fitness, and body wellbeing (신체적)
- environment: Living space and surroundings (환경/주거)
- financial: Money, security, and wealth (재정)
- career: Work and professional life (직업)
- leisure: Recreation and hobbies (여가)

Return ONLY a JSON array of dream objects. No other text.

Example format:
[
  {
    "title": "Master Spanish through immersion in Barcelona",
    "description": "Live in Barcelona for 3 months, attend language school, and practice with locals daily",
    "life_stage": "50s",
    "wellbeing_area": "intellectual",
    "related_values": ["Freedom", "Wisdom"],
    "why": "Combines your love of freedom with pursuit of new knowledge"
  }
]`;

  return prompt;
}

// Fallback suggestions when AI is not available
function generateFallbackSuggestions(context: any) {
  const { dreamAnalysis, values, strengths } = context;
  const gapCategories = dreamAnalysis?.gaps || ['learning', 'experience'];

  const fallbackDreams = [
    {
      title: "Learn a new skill that aligns with your strengths",
      description: "Take an online course or workshop in an area that interests you",
      life_stage: "30s",
      wellbeing_area: "intellectual",
      related_values: values?.top_terminal?.slice(0, 2) || ["Growth", "Knowledge"],
      why: "Continuous learning keeps you engaged and growing"
    },
    {
      title: "Build a meaningful relationship in your community",
      description: "Join a local group or volunteer organization to connect with others",
      life_stage: "40s",
      wellbeing_area: "relationship",
      related_values: values?.top_terminal?.slice(0, 2) || ["Connection", "Service"],
      why: "Strong relationships are key to wellbeing"
    },
    {
      title: "Establish a regular exercise routine",
      description: "Commit to 30 minutes of physical activity, 3 times per week",
      life_stage: "30s",
      wellbeing_area: "physical",
      related_values: ["Health", "Discipline"],
      why: "Physical health supports all other life areas"
    },
    {
      title: "Create a financial safety net",
      description: "Build an emergency fund covering 3-6 months of expenses",
      life_stage: "30s",
      wellbeing_area: "financial",
      related_values: ["Security", "Peace of mind"],
      why: "Financial stability reduces stress and enables other dreams"
    },
    {
      title: "Explore a new creative hobby",
      description: "Try painting, writing, music, or another creative outlet",
      life_stage: "40s",
      wellbeing_area: "leisure",
      related_values: ["Creativity", "Self-expression"],
      why: "Creative activities bring joy and fulfillment"
    },
    {
      title: "Define your life purpose",
      description: "Reflect on what gives your life meaning and direction",
      life_stage: "50s",
      wellbeing_area: "spiritual",
      related_values: ["Meaning", "Purpose"],
      why: "A clear sense of purpose guides important decisions"
    },
    {
      title: "Optimize your living space",
      description: "Create a home environment that supports your wellbeing",
      life_stage: "40s",
      wellbeing_area: "environment",
      related_values: ["Comfort", "Peace"],
      why: "Your environment affects your daily mood and productivity"
    },
    {
      title: "Achieve a career milestone",
      description: "Set a specific professional goal for the next 2-3 years",
      life_stage: "30s",
      wellbeing_area: "career",
      related_values: ["Achievement", "Growth"],
      why: "Career progress brings financial and personal satisfaction"
    }
  ];

  // Prioritize dreams based on gap categories
  const sortedDreams = fallbackDreams.sort((a, b) => {
    const aIsGap = gapCategories.includes(a.wellbeing_area);
    const bIsGap = gapCategories.includes(b.wellbeing_area);
    if (aIsGap && !bIsGap) return -1;
    if (!aIsGap && bIsGap) return 1;
    return 0;
  });

  return sortedDreams.slice(0, 8);
}
