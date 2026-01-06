import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/mission/session
 * Get or create mission session for user
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

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('mission_sessions')
      .insert({
        user_id: userId,
        status: 'in_progress',
        current_step: 1,
        values_used: [],
        purpose_answers: {},
        draft_versions: [],
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
 * Update mission session
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await request.json();

    // Validate step if provided
    if (body.current_step && (body.current_step < 1 || body.current_step > 4)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    // Build update object
    const updateData: any = {};

    if (body.current_step !== undefined) updateData.current_step = body.current_step;
    if (body.values_used !== undefined) updateData.values_used = body.values_used;
    if (body.purpose_answers !== undefined) updateData.purpose_answers = body.purpose_answers;
    if (body.draft_versions !== undefined) updateData.draft_versions = body.draft_versions;
    if (body.final_statement !== undefined) updateData.final_statement = body.final_statement;
    if (body.ai_conversation !== undefined) updateData.ai_conversation = body.ai_conversation;
    if (body.status !== undefined) updateData.status = body.status;

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
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

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
