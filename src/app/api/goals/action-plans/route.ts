import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/goals/action-plans
 * Fetch action plans for a key result
 */
export async function GET(req: NextRequest) {
  try {
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
    const keyResultId = searchParams.get('key_result_id');

    let query = supabase
      .from('goal_action_plans')
      .select('*')
      .order('action_number', { ascending: true });

    if (keyResultId) {
      query = query.eq('key_result_id', keyResultId);
    }

    const { data: actionPlans, error } = await query;

    if (error) {
      console.error('[Goal Action Plans] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch action plans' }, { status: 500 });
    }

    return NextResponse.json(actionPlans || []);
  } catch (error) {
    console.error('[Goal Action Plans] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/goals/action-plans
 * Create or update action plans for a key result
 */
export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { key_result_id, action_plans } = body;

    if (!key_result_id) {
      return NextResponse.json({ error: 'key_result_id is required' }, { status: 400 });
    }

    if (!action_plans || !Array.isArray(action_plans)) {
      return NextResponse.json({ error: 'action_plans array is required' }, { status: 400 });
    }

    // Delete existing action plans for this key result
    await supabase
      .from('goal_action_plans')
      .delete()
      .eq('key_result_id', key_result_id);

    // Insert new action plans
    const plansToInsert = action_plans
      .filter((plan: any) => plan.action_text?.trim())
      .map((plan: any, index: number) => ({
        key_result_id: key_result_id,
        action_number: plan.action_number || index + 1,
        action_text: plan.action_text,
        due_date: plan.due_date || null,
        is_completed: plan.is_completed || false,
        completed_at: plan.is_completed ? new Date().toISOString() : null,
      }));

    if (plansToInsert.length === 0) {
      return NextResponse.json({ success: true, action_plans: [] });
    }

    const { data, error } = await supabase
      .from('goal_action_plans')
      .insert(plansToInsert)
      .select();

    if (error) {
      console.error('[Goal Action Plans] Error inserting:', error);
      return NextResponse.json({ error: 'Failed to save action plans' }, { status: 500 });
    }

    return NextResponse.json({ success: true, action_plans: data });
  } catch (error) {
    console.error('[Goal Action Plans] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/goals/action-plans
 * Update a single action plan (toggle completion, update text, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { id, action_text, due_date, is_completed } = body;

    if (!id) {
      return NextResponse.json({ error: 'Action plan id is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (action_text !== undefined) updateData.action_text = action_text;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed;
      updateData.completed_at = is_completed ? new Date().toISOString() : null;
    }

    const { data, error } = await supabase
      .from('goal_action_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Goal Action Plans] Error updating:', error);
      return NextResponse.json({ error: 'Failed to update action plan' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Goal Action Plans] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/goals/action-plans
 * Delete an action plan
 */
export async function DELETE(req: NextRequest) {
  try {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Action plan id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('goal_action_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Goal Action Plans] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete action plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Goal Action Plans] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
