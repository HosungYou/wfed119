import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase-server';

type LifeStage = '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';
type WellbeingArea = 'relationship' | 'spiritual' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure';

interface Dream {
  id: string;
  title: string;
  description?: string;
  life_stage?: LifeStage;
  wellbeing_area?: WellbeingArea;
  why?: string;
}

const WELLBEING_LABELS: Record<WellbeingArea, string> = {
  relationship: 'Relationships',
  spiritual: 'Spiritual Growth',
  intellectual: 'Intellectual Development',
  physical: 'Physical Health',
  environment: 'Living Environment',
  financial: 'Financial Security',
  career: 'Career & Work',
  leisure: 'Leisure & Recreation'
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let session = null;

    if (!userError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { dreams } = body as { dreams: Dream[] };

    if (!dreams || dreams.length === 0) {
      return NextResponse.json({
        feedback: 'Start adding dreams to your matrix to receive personalized feedback.'
      });
    }

    // Fetch user profile for context
    const [valuesData, visionData] = await Promise.all([
      fetchValuesData(supabase, userId),
      fetchVisionData(supabase, userId)
    ]);

    // Generate AI feedback
    const feedback = await generateFinalFeedback(dreams, valuesData, visionData);

    // Update module progress in database
    try {
      await supabase
        .from('module_progress')
        .upsert({
          user_id: userId,
          module_name: 'dreams',
          progress: 100,
          current_stage: 'completed',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_name'
        });
    } catch (error) {
      console.error('Failed to update module progress:', error);
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error finalizing dreams:', error);
    return NextResponse.json(
      { error: 'Failed to finalize dreams' },
      { status: 500 }
    );
  }
}

async function fetchValuesData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('value_results')
      .select('value_set, top3')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (!data || data.length === 0) return null;

    const terminalRecord = data.find((r: any) => r.value_set === 'terminal');
    return terminalRecord?.top3?.slice(0, 3) || [];
  } catch (error) {
    return null;
  }
}

async function fetchVisionData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('vision_statements')
      .select('final_statement')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.final_statement || null;
  } catch (error) {
    return null;
  }
}

async function generateFinalFeedback(
  dreams: Dream[],
  values: string[] | null,
  vision: string | null
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Analyze dream distribution
  const areaCount: Partial<Record<WellbeingArea, number>> = {};
  const stageCount: Partial<Record<LifeStage, number>> = {};

  dreams.forEach(dream => {
    if (dream.wellbeing_area) {
      areaCount[dream.wellbeing_area] = (areaCount[dream.wellbeing_area] || 0) + 1;
    }
    if (dream.life_stage) {
      stageCount[dream.life_stage] = (stageCount[dream.life_stage] || 0) + 1;
    }
  });

  const coveredAreas = Object.keys(areaCount) as WellbeingArea[];
  const coveredStages = Object.keys(stageCount) as LifeStage[];
  const totalDreams = dreams.length;

  // Find strongest and weakest areas
  const sortedAreas = coveredAreas.sort((a, b) => (areaCount[b] || 0) - (areaCount[a] || 0));
  const strongestArea = sortedAreas[0];
  const strongestAreaLabel = strongestArea ? WELLBEING_LABELS[strongestArea] : '';

  // If no API key, return a basic feedback
  if (!apiKey) {
    if (totalDreams >= 10 && coveredAreas.length >= 6) {
      return `Excellent work! Your ${totalDreams} dreams span ${coveredAreas.length} wellbeing areas and ${coveredStages.length} life stages, showing comprehensive life planning. Your strongest focus is on ${strongestAreaLabel}. This balanced approach will help you grow holistically across different dimensions of life.`;
    } else if (totalDreams >= 5) {
      return `Good progress! You've mapped ${totalDreams} dreams across ${coveredAreas.length} areas. Consider expanding to cover more life stages and wellbeing dimensions for a more complete vision of your future.`;
    } else {
      return `You've started your dream journey with ${totalDreams} dreams. Continue adding more goals across different wellbeing areas and life stages to create a comprehensive life roadmap.`;
    }
  }

  // Generate AI feedback
  const anthropic = new Anthropic({ apiKey });

  let prompt = `You are a life coach providing encouraging, personalized feedback on a user's dream life matrix.

User's Dream Summary:
- Total dreams: ${totalDreams}
- Wellbeing areas covered: ${coveredAreas.length}/8 (${coveredAreas.map(a => WELLBEING_LABELS[a]).join(', ')})
- Life stages covered: ${coveredStages.length}/6 (${coveredStages.join(', ')})
- Strongest area: ${strongestAreaLabel} (${areaCount[strongestArea] || 0} dreams)

Dreams by area:
${sortedAreas.map(area => `- ${WELLBEING_LABELS[area]}: ${areaCount[area]} dreams`).join('\n')}`;

  if (values && values.length > 0) {
    prompt += `\n\nUser's Core Values: ${values.join(', ')}`;
  }

  if (vision) {
    prompt += `\n\nUser's Vision Statement: "${vision}"`;
  }

  prompt += `

Provide a single paragraph (2-3 sentences, max 200 characters) of personalized, encouraging feedback that:
1. Acknowledges their progress and strongest areas
2. Notes how their dreams align with their values/vision (if provided)
3. Gently suggests one area they might consider expanding

Be warm, specific, and actionable. Don't be generic. Reference their actual dreams and areas.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return responseText.trim();
  } catch (error) {
    console.error('Error calling Claude API:', error);

    // Fallback feedback
    if (totalDreams >= 10 && coveredAreas.length >= 6) {
      return `Impressive! Your ${totalDreams} dreams across ${coveredAreas.length} wellbeing areas show thoughtful life planning. Your focus on ${strongestAreaLabel} is clear, and your balanced approach will serve you well.`;
    }
    return `You've created ${totalDreams} meaningful dreams spanning ${coveredAreas.length} life dimensions. This is a strong foundation for intentional living and growth.`;
  }
}
