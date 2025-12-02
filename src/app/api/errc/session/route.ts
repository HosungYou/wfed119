import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { CreateErrcSessionRequest, UpdateErrcSessionRequest, ErrcSessionFull } from '@/lib/types/errc';

/**
 * GET /api/errc/session
 *
 * Fetch user's ERRC session with all related data
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch ERRC session
    const { data: errcSession, error: sessionError } = await supabase
      .from('errc_sessions')
      .select('*')
      .eq('user_id', auth.userId)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('[ERRC Session] Error fetching session:', sessionError);
      return NextResponse.json({ error: 'Failed to fetch ERRC session' }, { status: 500 });
    }

    if (!errcSession) {
      return NextResponse.json({});
    }

    // Fetch wellbeing assessments
    const { data: wellbeingAssessments } = await supabase
      .from('errc_wellbeing_assessments')
      .select('*')
      .eq('session_id', errcSession.id);

    // Fetch items with action steps
    const { data: items } = await supabase
      .from('errc_items')
      .select('*')
      .eq('session_id', errcSession.id)
      .order('category')
      .order('priority');

    // Fetch action steps for all items
    const itemIds = items?.map(i => i.id) || [];
    const { data: actionSteps } = itemIds.length > 0
      ? await supabase
          .from('errc_action_steps')
          .select('*')
          .in('errc_item_id', itemIds)
          .order('step_number')
      : { data: [] };

    // Fetch reflections
    const { data: reflections } = await supabase
      .from('errc_reflections')
      .select('*')
      .eq('session_id', errcSession.id)
      .order('created_at', { ascending: false });

    // Combine items with their action steps
    const itemsWithSteps = items?.map(item => ({
      ...item,
      actionSteps: actionSteps?.filter(step => step.errc_item_id === item.id) || [],
    })) || [];

    // Build full session response
    const fullSession: ErrcSessionFull = {
      ...errcSession,
      wellbeingBefore: wellbeingAssessments?.find(a => a.assessment_type === 'before') || null,
      wellbeingAfter: wellbeingAssessments?.find(a => a.assessment_type === 'after') || null,
      items: itemsWithSteps,
      reflections: reflections || [],
    };

    return NextResponse.json(fullSession);
  } catch (error) {
    console.error('[ERRC Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/errc/session
 *
 * Create or update ERRC session
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body with fallback to empty object
    let body: CreateErrcSessionRequest & UpdateErrcSessionRequest = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is OK - will create new session with defaults
    }

    // Check if session exists
    const { data: existingSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    let result;

    if (existingSession) {
      // Update existing session
      const updateData: Record<string, unknown> = {};
      if (body.status) updateData.status = body.status;
      if (body.current_step) updateData.current_step = body.current_step;
      if (body.status === 'completed') updateData.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('errc_sessions')
        .update(updateData)
        .eq('user_id', auth.userId)
        .select()
        .single();

      if (error) {
        console.error('[ERRC Session] Error updating:', error);
        return NextResponse.json({ error: 'Failed to update ERRC session' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new session
      const { data, error } = await supabase
        .from('errc_sessions')
        .insert({
          user_id: auth.userId,
          swot_analysis_id: body.swot_analysis_id || null,
          status: 'in_progress',
          current_step: 'wellbeing_before',
        })
        .select()
        .single();

      if (error) {
        console.error('[ERRC Session] Error creating:', error);
        return NextResponse.json({ error: 'Failed to create ERRC session' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ERRC Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/errc/session
 *
 * Delete user's ERRC session (CASCADE deletes related data)
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
      .from('errc_sessions')
      .delete()
      .eq('user_id', auth.userId);

    if (error) {
      console.error('[ERRC Session] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete ERRC session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ERRC Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
