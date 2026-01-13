import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/goals/roles
 * Fetch all roles for the current goal setting session
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current session
    const { data: goalSession } = await supabase
      .from('goal_setting_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!goalSession) {
      return NextResponse.json([]);
    }

    // Get roles with objectives and key results
    const { data: roles, error } = await supabase
      .from('goal_roles')
      .select(`
        *,
        goal_objectives (
          *,
          goal_key_results (*)
        )
      `)
      .eq('session_id', goalSession.id)
      .order('role_number', { ascending: true });

    if (error) {
      console.error('[Goal Roles] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }

    return NextResponse.json(roles || []);
  } catch (error) {
    console.error('[Goal Roles] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/goals/roles
 * Create or update roles (bulk upsert)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { roles } = body;

    if (!roles || !Array.isArray(roles)) {
      return NextResponse.json({ error: 'roles array is required' }, { status: 400 });
    }

    // Get current session
    const { data: goalSession } = await supabase
      .from('goal_setting_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!goalSession) {
      return NextResponse.json({ error: 'Goal session not found' }, { status: 404 });
    }

    // Validate total percentage
    const totalPercentage = roles.reduce((sum: number, role: any) => sum + (role.percentage_allocation || 0), 0);
    if (totalPercentage > 100) {
      return NextResponse.json({ error: 'Total percentage allocation cannot exceed 100%' }, { status: 400 });
    }

    // Delete existing roles
    await supabase
      .from('goal_roles')
      .delete()
      .eq('session_id', goalSession.id);

    // Insert new roles
    const rolesToInsert = roles.map((role: any, index: number) => ({
      session_id: goalSession.id,
      role_number: role.role_number || index + 1,
      role_name: role.role_name,
      role_description: role.role_description || null,
      percentage_allocation: role.percentage_allocation || 0,
      is_wellbeing: role.is_wellbeing || index === 0,
    }));

    const { data, error } = await supabase
      .from('goal_roles')
      .insert(rolesToInsert)
      .select();

    if (error) {
      console.error('[Goal Roles] Error inserting:', error);
      return NextResponse.json({ error: 'Failed to save roles' }, { status: 500 });
    }

    return NextResponse.json({ success: true, roles: data });
  } catch (error) {
    console.error('[Goal Roles] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/goals/roles
 * Update a single role
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, role_name, role_description, percentage_allocation } = body;

    if (!id) {
      return NextResponse.json({ error: 'Role id is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (role_name !== undefined) updateData.role_name = role_name;
    if (role_description !== undefined) updateData.role_description = role_description;
    if (percentage_allocation !== undefined) updateData.percentage_allocation = percentage_allocation;

    const { data, error } = await supabase
      .from('goal_roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Goal Roles] Error updating:', error);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Goal Roles] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
