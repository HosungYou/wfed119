import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/career-options/check-prerequisites
 * Check if user has completed previous modules
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    // Check Values
    const { data: valuesData } = await supabase
      .from('value_results')
      .select('value_set, top3')
      .eq('user_id', userId);

    const hasValues = valuesData && valuesData.length > 0 &&
      valuesData.some((v: any) => v.top3 && v.top3.length > 0);

    // Check Strengths
    const { data: strengthsData } = await supabase
      .from('strength_discovery_results')
      .select('final_strengths')
      .eq('user_id', userId)
      .limit(1)
      .single();

    const hasStrengths = strengthsData?.final_strengths &&
      JSON.parse(strengthsData.final_strengths).length > 0;

    // Check Vision
    const { data: visionData } = await supabase
      .from('vision_statements')
      .select('final_statement')
      .eq('user_id', userId)
      .limit(1)
      .single();

    const hasVision = !!visionData?.final_statement;

    // Check Mission
    const { data: missionData } = await supabase
      .from('mission_sessions')
      .select('final_statement, status')
      .eq('user_id', userId)
      .limit(1)
      .single();

    const hasMission = missionData?.status === 'completed' && !!missionData?.final_statement;

    return NextResponse.json({
      values: hasValues,
      strengths: hasStrengths,
      vision: hasVision,
      mission: hasMission,
      canStart: true, // Career options can start without prerequisites
    });
  } catch (error) {
    console.error('[Career Options Prerequisites] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
