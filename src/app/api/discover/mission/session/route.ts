import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/mission/session
 * Get or create mission session for user (v3.5 - 4 steps)
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

    // Get existing session
    const { data: existingSession, error } = await supabase
      .from('mission_sessions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Mission Session] Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingSession) {
      return NextResponse.json(existingSession);
    }

    // Create new session with v3.5 schema
    const { data: newSession, error: createError } = await supabase
      .from('mission_sessions')
      .insert({
        user_id: userId,
        status: 'in_progress',
        current_step: 1,
        values_used: [],
        top3_mission_values: [],
        selected_targets: [],
        selected_verbs: [],
        custom_targets: [],
        custom_verbs: [],
        round1_data: {},
        round2_data: {},
        round3_data: {},
        reflections: {},
        ai_insights: {},
        draft_versions: [],
        purpose_answers: {},
        ai_conversation: [],
      })
      .select()
      .single();

    if (createError) {
      console.error('[Mission Session] Create error:', createError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json(newSession);
  } catch (error) {
    console.error('[Mission Session] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/discover/mission/session
 * Update mission session (v3.5 - supports new fields)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await request.json();

    // Validate step if provided (now 1-4, not 1-5)
    if (body.current_step !== undefined && (body.current_step < 1 || body.current_step > 4)) {
      return NextResponse.json({ error: 'Invalid step (must be 1-4)' }, { status: 400 });
    }

    // Build update object - all supported fields
    const updateData: Record<string, any> = {};

    // Core fields
    if (body.current_step !== undefined) updateData.current_step = body.current_step;
    if (body.status !== undefined) updateData.status = body.status;

    // Step 1: Values
    if (body.values_used !== undefined) updateData.values_used = body.values_used;
    if (body.top3_mission_values !== undefined) updateData.top3_mission_values = body.top3_mission_values;

    // Step 2: Mission Components
    if (body.selected_targets !== undefined) updateData.selected_targets = body.selected_targets;
    if (body.selected_verbs !== undefined) updateData.selected_verbs = body.selected_verbs;
    if (body.custom_targets !== undefined) updateData.custom_targets = body.custom_targets;
    if (body.custom_verbs !== undefined) updateData.custom_verbs = body.custom_verbs;

    // Step 3: Mission Drafting (3 rounds)
    if (body.round1_data !== undefined) updateData.round1_data = body.round1_data;
    if (body.round2_data !== undefined) updateData.round2_data = body.round2_data;
    if (body.round3_data !== undefined) updateData.round3_data = body.round3_data;
    if (body.draft_versions !== undefined) updateData.draft_versions = body.draft_versions;
    if (body.final_statement !== undefined) updateData.final_statement = body.final_statement;

    // Step 4: Reflections
    if (body.reflections !== undefined) updateData.reflections = body.reflections;

    // AI insights (shared)
    if (body.ai_insights !== undefined) updateData.ai_insights = body.ai_insights;

    // Legacy fields (keep for backward compat during migration)
    if (body.purpose_answers !== undefined) updateData.purpose_answers = body.purpose_answers;
    if (body.ai_conversation !== undefined) updateData.ai_conversation = body.ai_conversation;

    // Handle completion
    if (body.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('mission_sessions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Mission Session] Update error:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Mission Session] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/discover/mission/session
 * Delete/reset mission session
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    const { error } = await supabase
      .from('mission_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[Mission Session] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Mission Session] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
