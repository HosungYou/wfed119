import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/mission/check-prerequisites
 * Check if user has completed required modules for Mission
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

    // Check Life Themes module
    const { data: lifeThemesData } = await supabase
      .from('life_themes_results')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const hasLifeThemes = lifeThemesData && lifeThemesData.length > 0;

    return NextResponse.json({
      values: hasValues,
      strengths: hasStrengths,
      enneagram: hasEnneagram,
      lifeThemes: hasLifeThemes,
      canStart: hasEnneagram && hasLifeThemes && hasValues, // Matches module order: enneagram → life-themes → values → mission
    });
  } catch (error) {
    console.error('[Mission Prerequisites] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
