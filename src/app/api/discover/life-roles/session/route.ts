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
    let prefillWellbeing: any = {};
    let prefillRainbow: any = {};
    let prefillRoleCommitments: any[] = [];
    let prefillWellbeingCommitments: any = {};

    const { data: missionSession } = await supabase
      .from('mission_sessions')
      .select('life_roles, wellbeing_reflections, role_commitments, wellbeing_commitments')
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
      if (missionSession.wellbeing_reflections && Object.keys(missionSession.wellbeing_reflections).length > 0) {
        // Convert simple string reflections to structured format
        const wr: any = {};
        for (const [key, val] of Object.entries(missionSession.wellbeing_reflections)) {
          if (typeof val === 'string' && val.trim()) {
            wr[key] = { reflection: val, currentLevel: 5, goals: '' };
          } else if (typeof val === 'object' && val !== null) {
            wr[key] = val;
          }
        }
        prefillWellbeing = wr;
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
      if (missionSession.wellbeing_commitments && Object.keys(missionSession.wellbeing_commitments).length > 0) {
        prefillWellbeingCommitments = missionSession.wellbeing_commitments;
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
        wellbeing_reflections: prefillWellbeing,
        rainbow_data: prefillRainbow,
        role_commitments: prefillRoleCommitments,
        wellbeing_commitments: prefillWellbeingCommitments,
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

    if (body.current_step && (body.current_step < 1 || body.current_step > 5)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    const updateData: any = {};

    if (body.current_step !== undefined) updateData.current_step = body.current_step;
    if (body.life_roles !== undefined) updateData.life_roles = body.life_roles;
    if (body.wellbeing_reflections !== undefined) updateData.wellbeing_reflections = body.wellbeing_reflections;
    if (body.rainbow_data !== undefined) updateData.rainbow_data = body.rainbow_data;
    if (body.role_commitments !== undefined) updateData.role_commitments = body.role_commitments;
    if (body.wellbeing_commitments !== undefined) updateData.wellbeing_commitments = body.wellbeing_commitments;
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
