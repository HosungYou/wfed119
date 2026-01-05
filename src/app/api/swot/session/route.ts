import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/swot/session
 *
 * Fetch user's SWOT analysis session
 * Returns existing session or empty object if none exists
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    // Fetch SWOT analysis
    const { data: swotData, error: swotError } = await supabase
      .from('swot_analyses')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (swotError && swotError.code !== 'PGRST116') {
      // PGRST116 means "no rows returned" which is fine
      console.error('[SWOT Session] Error fetching SWOT:', swotError);
      return NextResponse.json({ error: 'Failed to fetch SWOT session' }, { status: 500 });
    }

    // Return data or empty object
    return NextResponse.json(swotData || {});

  } catch (error) {
    console.error('[SWOT Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/swot/session
 *
 * Create or update SWOT analysis session
 * Body can contain any SWOT fields to update
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await req.json();

    // Check if session exists
    const { data: existingData, error: existingError } = await supabase
      .from('swot_analyses')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('[SWOT Session] Error checking existing session:', existingError);
      return NextResponse.json({ error: 'Failed to check SWOT session' }, { status: 500 });
    }

    let result;

    if (existingData) {
      // Update existing session
      const { data, error } = await supabase
        .from('swot_analyses')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[SWOT Session] Error updating:', error);
        return NextResponse.json({ error: 'Failed to update SWOT session' }, { status: 500 });
      }

      result = data;
    } else {
      // Create new session
      const { data, error } = await supabase
        .from('swot_analyses')
        .insert({
          user_id: userId,
          vision_or_goal: body?.vision_or_goal ?? '',
          ...body
        })
        .select()
        .single();

      if (error) {
        console.error('[SWOT Session] Error creating:', error);
        return NextResponse.json({ error: 'Failed to create SWOT session' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[SWOT Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/swot/session
 *
 * Delete user's SWOT analysis session
 * Also deletes associated goals and ERRC data (CASCADE)
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    // Delete SWOT analysis (CASCADE will delete goals and ERRC)
    const { error } = await supabase
      .from('swot_analyses')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[SWOT Session] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete SWOT session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[SWOT Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
