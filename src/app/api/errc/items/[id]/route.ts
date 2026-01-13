import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { UpdateErrcItemRequest } from '@/lib/types/errc';

/**
 * GET /api/errc/items/[id]
 *
 * Fetch single ERRC item with action steps
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let session = null;

    if (!userError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }
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

    // Fetch item
    const { data: item, error: itemError } = await supabase
      .from('errc_items')
      .select('*')
      .eq('id', id)
      .eq('session_id', errcSession.id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Fetch action steps
    const { data: steps } = await supabase
      .from('errc_action_steps')
      .select('*')
      .eq('errc_item_id', id)
      .order('step_number');

    return NextResponse.json({ ...item, actionSteps: steps || [] });
  } catch (error) {
    console.error('[ERRC Item] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/errc/items/[id]
 *
 * Update ERRC item
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let session = null;

    if (!userError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateErrcItemRequest = await req.json();

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
    if (body.item_text !== undefined) updateData.item_text = body.item_text;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.related_wellbeing !== undefined) updateData.related_wellbeing = body.related_wellbeing;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.progress_percentage !== undefined) updateData.progress_percentage = body.progress_percentage;

    const { data, error } = await supabase
      .from('errc_items')
      .update(updateData)
      .eq('id', id)
      .eq('session_id', errcSession.id)
      .select()
      .single();

    if (error) {
      console.error('[ERRC Item] Error updating:', error);
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }

    // Fetch action steps
    const { data: steps } = await supabase
      .from('errc_action_steps')
      .select('*')
      .eq('errc_item_id', id)
      .order('step_number');

    return NextResponse.json({ ...data, actionSteps: steps || [] });
  } catch (error) {
    console.error('[ERRC Item] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/errc/items/[id]
 *
 * Delete ERRC item (CASCADE deletes action steps)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let session = null;

    if (!userError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }
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

    const { error } = await supabase
      .from('errc_items')
      .delete()
      .eq('id', id)
      .eq('session_id', errcSession.id);

    if (error) {
      console.error('[ERRC Item] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ERRC Item] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
