import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/life-roles/context
 * Fetch cross-module AI context for life-roles module
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

    const [valuesResult, enneagramResult, lifeThemesResult, missionResult] = await Promise.all([
      fetchValuesData(supabase, userId),
      fetchEnneagramData(supabase, userId),
      fetchLifeThemesData(supabase, userId),
      fetchMissionData(supabase, userId),
    ]);

    return NextResponse.json({
      values: valuesResult,
      enneagram: enneagramResult,
      lifeThemes: lifeThemesResult,
      mission: missionResult,
    });
  } catch (error) {
    console.error('[Life Roles Context] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function fetchValuesData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('value_results')
      .select('value_set, top3')
      .eq('user_id', userId);

    if (!data || data.length === 0) return null;

    const terminal = data.find((r: any) => r.value_set === 'terminal');
    const instrumental = data.find((r: any) => r.value_set === 'instrumental');
    const work = data.find((r: any) => r.value_set === 'work');

    return {
      terminal: Array.isArray(terminal?.top3) ? terminal.top3 : [],
      instrumental: Array.isArray(instrumental?.top3) ? instrumental.top3 : [],
      work: Array.isArray(work?.top3) ? work.top3 : [],
    };
  } catch {
    return null;
  }
}

async function fetchEnneagramData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('enneagram_sessions')
      .select('primary_type, wing_estimate, instinct')
      .eq('user_id', userId)
      .eq('stage', 'complete')
      .limit(1)
      .single();

    if (!data) return null;
    return { type: data.primary_type, wing: data.wing_estimate, instinct: data.instinct };
  } catch {
    return null;
  }
}

async function fetchLifeThemesData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('life_themes_results')
      .select('themes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data?.themes) return null;
    return data.themes.slice(0, 5).map((t: any) => ({
      theme: t.theme,
      description: t.description,
    }));
  } catch {
    return null;
  }
}

async function fetchMissionData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('mission_sessions')
      .select('final_statement, life_roles, wellbeing_reflections')
      .eq('user_id', userId)
      .single();

    if (!data) return null;
    return {
      finalStatement: data.final_statement || '',
      lifeRoles: data.life_roles || [],
      wellbeingReflections: data.wellbeing_reflections || {},
    };
  } catch {
    return null;
  }
}
