import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { CreateErrcReflectionRequest, UpdateErrcReflectionRequest, ErrcReflectionType } from '@/lib/types/errc';

/**
 * GET /api/errc/reflections
 *
 * Fetch all reflections for user's ERRC session
 * Query params: type=weekly_check_in|milestone|challenge|insight|final_reflection (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's ERRC session
    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'ERRC session not found' }, { status: 404 });
    }

    // Check for type filter
    const { searchParams } = new URL(req.url);
    const reflectionType = searchParams.get('type') as ErrcReflectionType | null;

    let query = supabase
      .from('errc_reflections')
      .select('*')
      .eq('session_id', errcSession.id)
      .order('created_at', { ascending: false });

    if (reflectionType) {
      query = query.eq('reflection_type', reflectionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ERRC Reflections] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch reflections' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[ERRC Reflections] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/errc/reflections
 *
 * Create a new reflection
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateErrcReflectionRequest = await req.json();

    if (!body.reflection_type || !body.content) {
      return NextResponse.json({ error: 'reflection_type and content are required' }, { status: 400 });
    }

    // Get user's ERRC session
    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'ERRC session not found' }, { status: 404 });
    }

    // Validate related_item_id if provided
    if (body.related_item_id) {
      const { data: item } = await supabase
        .from('errc_items')
        .select('id')
        .eq('id', body.related_item_id)
        .eq('session_id', errcSession.id)
        .single();

      if (!item) {
        return NextResponse.json({ error: 'Related item not found' }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('errc_reflections')
      .insert({
        session_id: errcSession.id,
        reflection_type: body.reflection_type,
        title: body.title || null,
        content: body.content,
        related_item_id: body.related_item_id || null,
        mood_level: body.mood_level || null,
        energy_level: body.energy_level || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[ERRC Reflections] Error creating:', error);
      return NextResponse.json({ error: 'Failed to create reflection' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[ERRC Reflections] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/errc/reflections
 *
 * Update a specific reflection
 * Query params: id=<reflection_id> (required)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reflectionId = searchParams.get('id');

    if (!reflectionId) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const body: UpdateErrcReflectionRequest = await req.json();

    // Get user's ERRC session
    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'ERRC session not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.mood_level !== undefined) updateData.mood_level = body.mood_level;
    if (body.energy_level !== undefined) updateData.energy_level = body.energy_level;

    const { data, error } = await supabase
      .from('errc_reflections')
      .update(updateData)
      .eq('id', reflectionId)
      .eq('session_id', errcSession.id)
      .select()
      .single();

    if (error) {
      console.error('[ERRC Reflections] Error updating:', error);
      return NextResponse.json({ error: 'Failed to update reflection' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[ERRC Reflections] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/errc/reflections
 *
 * Delete a reflection
 * Query params: id=<reflection_id> (required)
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reflectionId = searchParams.get('id');

    if (!reflectionId) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    // Get user's ERRC session
    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'ERRC session not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('errc_reflections')
      .delete()
      .eq('id', reflectionId)
      .eq('session_id', errcSession.id);

    if (error) {
      console.error('[ERRC Reflections] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete reflection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ERRC Reflections] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
