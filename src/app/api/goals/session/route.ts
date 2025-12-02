import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { GoalSettingSession, GoalSessionStatus } from '@/lib/types/goalSetting';

/**
 * GET /api/goals/session
 * Fetch current goal setting session for the user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current session with all related data
    const { data: goalSession, error } = await supabase
      .from('goal_setting_sessions')
      .select(`
        *,
        goal_roles (
          *,
          goal_objectives (
            *,
            goal_key_results (
              *,
              goal_action_plans (*)
            )
          )
        ),
        goal_reflections (*)
      `)
      .eq('user_id', auth.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Goal Session] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    return NextResponse.json(goalSession || null);
  } catch (error) {
    console.error('[Goal Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/goals/session
 * Create or update goal setting session
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { swot_analysis_id, status } = body;

    // Check if session exists
    const { data: existingSession } = await supabase
      .from('goal_setting_sessions')
      .select('id, status')
      .eq('user_id', auth.userId)
      .single();

    let result;

    if (existingSession) {
      // Update existing session
      const updateData: Partial<GoalSettingSession> = {};
      if (status) updateData.status = status as GoalSessionStatus;
      if (status === 'completed') updateData.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('goal_setting_sessions')
        .update(updateData)
        .eq('id', existingSession.id)
        .select()
        .single();

      if (error) {
        console.error('[Goal Session] Error updating:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
      }
      result = data;
    } else {
      // Verify SWOT analysis exists
      if (!swot_analysis_id) {
        return NextResponse.json({ error: 'swot_analysis_id is required' }, { status: 400 });
      }

      const { data: swotData } = await supabase
        .from('swot_analyses')
        .select('id')
        .eq('id', swot_analysis_id)
        .eq('user_id', auth.userId)
        .single();

      if (!swotData) {
        return NextResponse.json({ error: 'SWOT analysis not found' }, { status: 404 });
      }

      // Create new session
      const { data, error } = await supabase
        .from('goal_setting_sessions')
        .insert({
          user_id: auth.userId,
          swot_analysis_id: swot_analysis_id,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) {
        console.error('[Goal Session] Error creating:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Goal Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/goals/session
 * Delete goal setting session and all related data
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('goal_setting_sessions')
      .delete()
      .eq('user_id', auth.userId);

    if (error) {
      console.error('[Goal Session] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Goal Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
