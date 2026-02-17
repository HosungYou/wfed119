import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/life-roles/check-prerequisites
 * Check if user has completed required modules for Life Roles
 * Required: mission (linear progression enforces enneagram, life-themes, values, mission)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();
    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    // Check Enneagram
    const { data: enneagramData } = await supabase
      .from('enneagram_sessions')
      .select('primary_type, stage')
      .eq('user_id', userId)
      .eq('stage', 'complete')
      .limit(1)
      .single();
    const hasEnneagram = !!enneagramData?.primary_type;

    // Check Life Themes
    const { data: lifeThemesData } = await supabase
      .from('life_themes_results')
      .select('themes, is_completed')
      .eq('user_id', userId)
      .limit(1)
      .single();
    const hasLifeThemes = lifeThemesData?.is_completed || (lifeThemesData?.themes && lifeThemesData.themes.length > 0);

    // Check Values
    const { data: valuesData } = await supabase
      .from('value_results')
      .select('value_set, top3')
      .eq('user_id', userId);
    const hasValues = valuesData && valuesData.length > 0 &&
      valuesData.some((v: any) => v.top3 && v.top3.length > 0);

    // Check Mission (direct prerequisite)
    const { data: missionData } = await supabase
      .from('mission_sessions')
      .select('status, final_statement')
      .eq('user_id', userId)
      .single();
    const hasMission = missionData?.status === 'completed' || !!missionData?.final_statement;

    return NextResponse.json({
      enneagram: hasEnneagram,
      lifeThemes: hasLifeThemes,
      values: hasValues,
      mission: hasMission,
      canStart: hasMission, // Mission is the minimum requirement (linear enforcement)
    });
  } catch (error) {
    console.error('[Life Roles Prerequisites] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
