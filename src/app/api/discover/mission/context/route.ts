import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/mission/context
 * Fetch all relevant data from previous modules for Mission crafting
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

    // Fetch all module data in parallel
    const [valuesResult, strengthsResult, enneagramResult, visionResult, userResult] = await Promise.all([
      fetchValuesData(supabase, userId),
      fetchStrengthsData(supabase, userId),
      fetchEnneagramData(supabase, userId),
      fetchVisionData(supabase, userId),
      fetchUserData(supabase, userId),
    ]);

    return NextResponse.json({
      values: valuesResult,
      strengths: strengthsResult,
      enneagram: enneagramResult,
      vision: visionResult,
      user: userResult,
    });
  } catch (error) {
    console.error('[Mission Context] Error:', error);
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
      terminal: {
        top3: Array.isArray(terminal?.top3) ? terminal.top3 : [],
      },
      instrumental: {
        top3: Array.isArray(instrumental?.top3) ? instrumental.top3 : [],
      },
      work: {
        top3: Array.isArray(work?.top3) ? work.top3 : [],
      },
    };
  } catch (error) {
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

    if (!data?.final_strengths) return null;

    const strengths = JSON.parse(data.final_strengths);
    return strengths.slice(0, 5).map((s: any) => ({
      name: s.name || s,
      description: s.description || '',
    }));
  } catch (error) {
    return null;
  }
}

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

async function fetchVisionData(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('vision_statements')
      .select('final_statement, core_aspirations, time_horizon, time_horizon_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    let aspirations = [];
    if (data.core_aspirations) {
      try {
        aspirations = JSON.parse(data.core_aspirations);
      } catch {
        aspirations = [];
      }
    }

    return {
      statement: data.final_statement,
      aspirations: aspirations.map((a: any) => a.keyword || a),
      timeHorizon: data.time_horizon,
      timeHorizonType: data.time_horizon_type,
    };
  } catch (error) {
    return null;
  }
}

async function fetchUserData(supabase: any, userId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return {
      name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
      email: user?.email,
    };
  } catch (error) {
    return { name: 'User', email: '' };
  }
}
