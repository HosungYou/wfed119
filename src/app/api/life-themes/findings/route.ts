import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { FindingsData } from '@/lib/types/lifeThemes';

/**
 * GET /api/life-themes/findings
 * Fetch existing findings for user's session
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);
    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch findings from analysis table
    const { data, error } = await supabase
      .from('life_themes_analysis')
      .select('*')
      .eq('session_id', ltSession.id)
      .eq('analysis_type', 'findings')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Findings] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch findings' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ findings: [] });
    }

    // Parse structured_data to get FindingsData
    const findingsData = data.structured_data as FindingsData | null;
    return NextResponse.json(findingsData || { findings: [] });
  } catch (error) {
    console.error('[Findings] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/life-themes/findings
 * Save findings (upsert)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);
    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { findings } = body;

    if (!findings || !Array.isArray(findings)) {
      return NextResponse.json({ error: 'findings array is required' }, { status: 400 });
    }

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const findingsData: FindingsData = {
      findings,
      aiGenerated: body.aiGenerated ?? true,
      userEdited: body.userEdited ?? false,
    };

    // Check if findings already exist
    const { data: existing } = await supabase
      .from('life_themes_analysis')
      .select('id')
      .eq('session_id', ltSession.id)
      .eq('analysis_type', 'findings')
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('life_themes_analysis')
        .update({
          content: `${findings.length} themes identified`,
          structured_data: findingsData,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('life_themes_analysis')
        .insert({
          session_id: ltSession.id,
          analysis_type: 'findings',
          content: `${findings.length} themes identified`,
          structured_data: findingsData,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Update session step
    await supabase
      .from('life_themes_sessions')
      .update({ current_step: 'followup' })
      .eq('id', ltSession.id);

    return NextResponse.json(result.structured_data);
  } catch (error) {
    console.error('[Findings] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
