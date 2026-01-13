import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/career-options/session
 * Get or create career exploration session
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
      .from('career_exploration_sessions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Career Options Session] Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingSession) {
      return NextResponse.json(existingSession);
    }

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('career_exploration_sessions')
      .insert({
        user_id: userId,
        status: 'in_progress',
        current_step: 1,
        holland_responses: {},
        holland_scores: {},
        suggested_careers: [],
        explored_careers: [],
        comparison_matrix: {},
        top_career_choices: [],
      })
      .select()
      .single();

    if (createError) {
      console.error('[Career Options Session] Create error:', createError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json(newSession);
  } catch (error) {
    console.error('[Career Options Session] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/discover/career-options/session
 * Update career exploration session
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

    // Build update object
    const updateData: any = {};

    if (body.current_step !== undefined) updateData.current_step = body.current_step;
    if (body.holland_responses !== undefined) updateData.holland_responses = body.holland_responses;
    if (body.holland_code !== undefined) updateData.holland_code = body.holland_code;
    if (body.holland_scores !== undefined) updateData.holland_scores = body.holland_scores;
    if (body.suggested_careers !== undefined) updateData.suggested_careers = body.suggested_careers;
    if (body.explored_careers !== undefined) updateData.explored_careers = body.explored_careers;
    if (body.comparison_matrix !== undefined) updateData.comparison_matrix = body.comparison_matrix;
    if (body.top_career_choices !== undefined) updateData.top_career_choices = body.top_career_choices;
    if (body.career_notes !== undefined) updateData.career_notes = body.career_notes;
    if (body.status !== undefined) updateData.status = body.status;
    // New fields for resume analysis
    if (body.resume_analysis !== undefined) updateData.resume_analysis = body.resume_analysis;
    if (body.selected_onet_careers !== undefined) updateData.selected_onet_careers = body.selected_onet_careers;

    // Handle completion
    if (body.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('career_exploration_sessions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Career Options Session] Update error:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Career Options Session] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/discover/career-options/session
 * Delete/reset career exploration session
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
      .from('career_exploration_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[Career Options Session] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Career Options Session] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
