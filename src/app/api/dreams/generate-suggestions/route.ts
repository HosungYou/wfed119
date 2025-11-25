import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch data from other modules
    const [valuesData, strengthsData, visionData, existingDreams] = await Promise.all([
      fetchValuesData(supabase, userId),
      fetchStrengthsData(supabase, userId),
      fetchVisionData(supabase, userId),
      fetchExistingDreams()
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

// Fetch user's top values
async function fetchValuesData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('value_assessment_results')
      .select('terminal_values_sorted, instrumental_values_sorted, work_values_sorted')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    const terminalValues = data.terminal_values_sorted ? JSON.parse(data.terminal_values_sorted) : [];
    const instrumentalValues = data.instrumental_values_sorted ? JSON.parse(data.instrumental_values_sorted) : [];
    const workValues = data.work_values_sorted ? JSON.parse(data.work_values_sorted) : [];

    return {
      top_terminal: terminalValues.slice(0, 3).map((v: any) => v.value),
      top_instrumental: instrumentalValues.slice(0, 3).map((v: any) => v.value),
      top_work: workValues.slice(0, 3).map((v: any) => v.value)
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
async function fetchExistingDreams() {
  // In production, this would fetch from database
  // For now, using placeholder
  return [];
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

// Generate AI suggestions using Claude
async function generateAISuggestions(context: any) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = buildAIPrompt(context);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

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
