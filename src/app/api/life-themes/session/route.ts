import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type {
  UpdateLifeThemesSessionRequest,
  LifeThemesSessionFull,
  QuestionNumber,
} from '@/lib/types/lifeThemes';

/**
 * GET /api/life-themes/session
 *
 * Fetch user's Life Themes session with all related data
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch session
    const { data: ltSession, error: sessionError } = await supabase
      .from('life_themes_sessions')
      .select('*')
      .eq('user_id', auth.userId)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('[Life Themes Session] Error fetching:', sessionError);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    if (!ltSession) {
      return NextResponse.json({});
    }

    // Fetch responses
    const { data: responses } = await supabase
      .from('life_themes_responses')
      .select('*')
      .eq('session_id', ltSession.id)
      .order('question_number');

    // Fetch patterns
    const { data: patterns } = await supabase
      .from('life_themes_patterns')
      .select('*')
      .eq('session_id', ltSession.id)
      .order('created_at');

    // Fetch themes
    const { data: themes } = await supabase
      .from('life_themes')
      .select('*')
      .eq('session_id', ltSession.id)
      .order('priority_rank');

    // Fetch analysis
    const { data: analysis } = await supabase
      .from('life_themes_analysis')
      .select('*')
      .eq('session_id', ltSession.id);

    const fullSession: LifeThemesSessionFull = {
      ...ltSession,
      responses: responses || [],
      patterns: patterns || [],
      themes: themes || [],
      analysis: analysis || [],
    };

    return NextResponse.json(fullSession);
  } catch (error) {
    console.error('[Life Themes Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/life-themes/session
 *
 * Create or update Life Themes session
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body with fallback to empty object
    let body: UpdateLifeThemesSessionRequest = {};
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
      .from('life_themes_sessions')
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
        .from('life_themes_sessions')
        .update(updateData)
        .eq('user_id', auth.userId)
        .select()
        .single();

      if (error) {
        console.error('[Life Themes Session] Error updating:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new session
      const { data, error } = await supabase
        .from('life_themes_sessions')
        .insert({
          user_id: auth.userId,
          status: 'in_progress',
          current_step: 'role_models',
        })
        .select()
        .single();

      if (error) {
        console.error('[Life Themes Session] Error creating:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Life Themes Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/life-themes/session
 *
 * Delete user's Life Themes session (CASCADE deletes related data)
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('life_themes_sessions')
      .delete()
      .eq('user_id', auth.userId);

    if (error) {
      console.error('[Life Themes Session] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Life Themes Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
