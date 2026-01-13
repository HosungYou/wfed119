import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { CreateErrcActionStepRequest, UpdateErrcActionStepRequest } from '@/lib/types/errc';
import { calculateItemProgress } from '@/lib/types/errc';

/**
 * GET /api/errc/items/[id]/steps
 *
 * Fetch all action steps for an ERRC item
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
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

    // Verify item belongs to user's session
    const { data: item } = await supabase
      .from('errc_items')
      .select('id, session_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('id', item.session_id)
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: steps, error } = await supabase
      .from('errc_action_steps')
      .select('*')
      .eq('errc_item_id', itemId)
      .order('step_number');

    if (error) {
      console.error('[ERRC Steps] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 });
    }

    return NextResponse.json(steps || []);
  } catch (error) {
    console.error('[ERRC Steps] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/errc/items/[id]/steps
 *
 * Create a new action step for an ERRC item
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
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

    const body: Omit<CreateErrcActionStepRequest, 'errc_item_id'> = await req.json();

    if (!body.step_text) {
      return NextResponse.json({ error: 'step_text is required' }, { status: 400 });
    }

    // Verify item belongs to user's session
    const { data: item } = await supabase
      .from('errc_items')
      .select('id, session_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('id', item.session_id)
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get next step number
    const { data: existingSteps } = await supabase
      .from('errc_action_steps')
      .select('step_number')
      .eq('errc_item_id', itemId)
      .order('step_number', { ascending: false })
      .limit(1);

    const nextStepNumber = body.step_number || ((existingSteps?.[0]?.step_number || 0) + 1);

    const { data, error } = await supabase
      .from('errc_action_steps')
      .insert({
        errc_item_id: itemId,
        step_number: nextStepNumber,
        step_text: body.step_text,
        due_date: body.due_date || null,
        status: 'not_started',
      })
      .select()
      .single();

    if (error) {
      console.error('[ERRC Steps] Error creating:', error);
      return NextResponse.json({ error: 'Failed to create step' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[ERRC Steps] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/errc/items/[id]/steps
 *
 * Update a specific step (by step_number query param)
 * Query params: step=1,2,3... (required)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
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

    const { searchParams } = new URL(req.url);
    const stepNumber = searchParams.get('step');

    if (!stepNumber) {
      return NextResponse.json({ error: 'step query param is required' }, { status: 400 });
    }

    const body: UpdateErrcActionStepRequest = await req.json();

    // Verify item belongs to user's session
    const { data: item } = await supabase
      .from('errc_items')
      .select('id, session_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('id', item.session_id)
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (body.step_text !== undefined) updateData.step_text = body.step_text;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: updatedStep, error } = await supabase
      .from('errc_action_steps')
      .update(updateData)
      .eq('errc_item_id', itemId)
      .eq('step_number', parseInt(stepNumber))
      .select()
      .single();

    if (error) {
      console.error('[ERRC Steps] Error updating:', error);
      return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
    }

    // Recalculate item progress
    const { data: allSteps } = await supabase
      .from('errc_action_steps')
      .select('status')
      .eq('errc_item_id', itemId);

    if (allSteps) {
      const progress = calculateItemProgress(allSteps as { status: string }[]);
      await supabase
        .from('errc_items')
        .update({ progress_percentage: progress })
        .eq('id', itemId);
    }

    return NextResponse.json(updatedStep);
  } catch (error) {
    console.error('[ERRC Steps] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/errc/items/[id]/steps
 *
 * Delete a specific step
 * Query params: step=1,2,3... (required)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
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

    const { searchParams } = new URL(req.url);
    const stepNumber = searchParams.get('step');

    if (!stepNumber) {
      return NextResponse.json({ error: 'step query param is required' }, { status: 400 });
    }

    // Verify item belongs to user's session
    const { data: item } = await supabase
      .from('errc_items')
      .select('id, session_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('id', item.session_id)
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('errc_action_steps')
      .delete()
      .eq('errc_item_id', itemId)
      .eq('step_number', parseInt(stepNumber));

    if (error) {
      console.error('[ERRC Steps] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete step' }, { status: 500 });
    }

    // Renumber remaining steps
    const { data: remainingSteps } = await supabase
      .from('errc_action_steps')
      .select('id, step_number')
      .eq('errc_item_id', itemId)
      .order('step_number');

    if (remainingSteps) {
      for (let i = 0; i < remainingSteps.length; i++) {
        if (remainingSteps[i].step_number !== i + 1) {
          await supabase
            .from('errc_action_steps')
            .update({ step_number: i + 1 })
            .eq('id', remainingSteps[i].id);
        }
      }
    }

    // Recalculate item progress
    const { data: allSteps } = await supabase
      .from('errc_action_steps')
      .select('status')
      .eq('errc_item_id', itemId);

    const progress = allSteps ? calculateItemProgress(allSteps as { status: string }[]) : 0;
    await supabase
      .from('errc_items')
      .update({ progress_percentage: progress })
      .eq('id', itemId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ERRC Steps] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
