import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/mission/check-prerequisites
 * Check if user has completed required modules for Mission
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    // Check Values module
    const { data: valuesData } = await supabase
      .from('value_results')
      .select('value_set, top3')
      .eq('user_id', userId);

    const hasValues = valuesData && valuesData.length > 0 &&
      valuesData.some((v: any) => v.top3 && v.top3.length > 0);

    // Check Strengths module
    const { data: strengthsData } = await supabase
      .from('strength_discovery_results')
      .select('final_strengths')
      .eq('user_id', userId)
      .limit(1)
      .single();

    const hasStrengths = strengthsData?.final_strengths &&
      JSON.parse(strengthsData.final_strengths).length > 0;

    // Check Enneagram module
    const { data: enneagramData } = await supabase
      .from('enneagram_results')
      .select('primary_type')
      .eq('user_id', userId)
      .limit(1)
      .single();

    const hasEnneagram = !!enneagramData?.primary_type;

    // Check Vision module
    const { data: visionData } = await supabase
      .from('vision_statements')
      .select('final_statement')
      .eq('user_id', userId)
      .limit(1)
      .single();

    const hasVision = !!visionData?.final_statement;

    return NextResponse.json({
      values: hasValues,
      strengths: hasStrengths,
      enneagram: hasEnneagram,
      vision: hasVision,
      canStart: hasValues && hasVision, // Minimum requirement
    });
  } catch (error) {
    console.error('[Mission Prerequisites] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
