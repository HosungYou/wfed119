import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/life-roles/session
 * Get or create life-roles session for user
 * On new session creation, pre-fills from mission_sessions data
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
      .from('life_roles_sessions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Life Roles Session] Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingSession) {
      return NextResponse.json(existingSession);
    }

    // Pre-fill from mission_sessions if available
    let prefillRoles: any[] = [];
    let prefillRainbow: any = {};
    let prefillRoleCommitments: any[] = [];

    const { data: missionSession } = await supabase
      .from('mission_sessions')
      .select('life_roles, role_commitments')
      .eq('user_id', userId)
      .single();

    if (missionSession) {
      if (missionSession.life_roles && Array.isArray(missionSession.life_roles) && missionSession.life_roles.length > 0) {
        prefillRoles = missionSession.life_roles.map((r: any, i: number) => ({
          id: r.id || `prefill_${i}`,
          entity: r.entity || '',
          role: r.role || '',
          category: 'personal',
          importance: 3,
          source: 'mission',
        }));
      }
      if (missionSession.role_commitments && Array.isArray(missionSession.role_commitments)) {
        prefillRoleCommitments = missionSession.role_commitments.map((c: any) => ({
          roleId: '',
          roleName: c.role || '',
          commitment: c.commitment || '',
          currentTimePct: 0,
          desiredTimePct: 0,
          gapAnalysis: '',
        }));
      }
    }

    // Create new session with pre-filled data
    const { data: newSession, error: createError } = await supabase
      .from('life_roles_sessions')
      .insert({
        user_id: userId,
        status: 'in_progress',
        current_step: 1,
        life_roles: prefillRoles,
        rainbow_data: prefillRainbow,
        role_commitments: prefillRoleCommitments,
        reflection: {},
      })
      .select()
      .single();

    if (createError) {
      console.error('[Life Roles Session] Create error:', createError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json(newSession);
  } catch (error) {
    console.error('[Life Roles Session] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/discover/life-roles/session
 * Update life-roles session
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

    if (body.current_step && (body.current_step < 1 || body.current_step > 4)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    const updateData: any = {};

    if (body.current_step !== undefined) updateData.current_step = body.current_step;
    if (body.life_roles !== undefined) updateData.life_roles = body.life_roles;
    if (body.rainbow_data !== undefined) updateData.rainbow_data = body.rainbow_data;
    if (body.role_commitments !== undefined) updateData.role_commitments = body.role_commitments;
    if (body.reflection !== undefined) updateData.reflection = body.reflection;
    if (body.status !== undefined) updateData.status = body.status;

    if (body.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('life_roles_sessions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Life Roles Session] Update error:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Life Roles Session] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/discover/life-roles/session
 * Delete/reset life-roles session
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
      .from('life_roles_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[Life Roles Session] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Life Roles Session] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
