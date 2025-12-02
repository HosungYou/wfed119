import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/goals/objectives
 * Fetch objectives for a role or all objectives
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get('role_id');

    // Get current session
    const { data: goalSession } = await supabase
      .from('goal_setting_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!goalSession) {
      return NextResponse.json([]);
    }

    // Build query
    let query = supabase
      .from('goal_objectives')
      .select(`
        *,
        goal_key_results (*)
      `)
      .order('objective_number', { ascending: true });

    if (roleId) {
      query = query.eq('role_id', roleId);
    } else {
      // Get all objectives for roles in this session
      const { data: roles } = await supabase
        .from('goal_roles')
        .select('id')
        .eq('session_id', goalSession.id);

      if (!roles || roles.length === 0) {
        return NextResponse.json([]);
      }

      const roleIds = roles.map(r => r.id);
      query = query.in('role_id', roleIds);
    }

    const { data: objectives, error } = await query;

    if (error) {
      console.error('[Goal Objectives] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch objectives' }, { status: 500 });
    }

    return NextResponse.json(objectives || []);
  } catch (error) {
    console.error('[Goal Objectives] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/goals/objectives
 * Create or update objectives for a role
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { role_id, objectives } = body;

    if (!role_id) {
      return NextResponse.json({ error: 'role_id is required' }, { status: 400 });
    }

    if (!objectives || !Array.isArray(objectives)) {
      return NextResponse.json({ error: 'objectives array is required' }, { status: 400 });
    }

    // Delete existing objectives for this role
    await supabase
      .from('goal_objectives')
      .delete()
      .eq('role_id', role_id);

    // Insert new objectives
    const objectivesToInsert = objectives
      .filter((obj: any) => obj.objective_text?.trim())
      .map((obj: any, index: number) => ({
        role_id: role_id,
        objective_number: obj.objective_number || index + 1,
        objective_text: obj.objective_text,
        related_swot_strategies: obj.related_swot_strategies || [],
      }));

    if (objectivesToInsert.length === 0) {
      return NextResponse.json({ success: true, objectives: [] });
    }

    const { data, error } = await supabase
      .from('goal_objectives')
      .insert(objectivesToInsert)
      .select();

    if (error) {
      console.error('[Goal Objectives] Error inserting:', error);
      return NextResponse.json({ error: 'Failed to save objectives' }, { status: 500 });
    }

    return NextResponse.json({ success: true, objectives: data });
  } catch (error) {
    console.error('[Goal Objectives] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/goals/objectives
 * Update a single objective
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, objective_text, related_swot_strategies } = body;

    if (!id) {
      return NextResponse.json({ error: 'Objective id is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (objective_text !== undefined) updateData.objective_text = objective_text;
    if (related_swot_strategies !== undefined) updateData.related_swot_strategies = related_swot_strategies;

    const { data, error } = await supabase
      .from('goal_objectives')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Goal Objectives] Error updating:', error);
      return NextResponse.json({ error: 'Failed to update objective' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Goal Objectives] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/goals/objectives
 * Delete an objective
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Objective id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('goal_objectives')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Goal Objectives] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete objective' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Goal Objectives] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
