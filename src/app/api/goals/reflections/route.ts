import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { ReflectionType } from '@/lib/types/goalSetting';

const VALID_REFLECTION_TYPES: ReflectionType[] = [
  'identity_alignment',
  'deliberation',
  'incompleteness',
  'diversity',
  'connectivity',
  'feasibility',
  'execution_ease',
];

/**
 * GET /api/goals/reflections
 * Fetch all reflections for the current goal setting session
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

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

    const { data: reflections, error } = await supabase
      .from('goal_reflections')
      .select('*')
      .eq('session_id', goalSession.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Goal Reflections] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch reflections' }, { status: 500 });
    }

    return NextResponse.json(reflections || []);
  } catch (error) {
    console.error('[Goal Reflections] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/goals/reflections
 * Create or update a reflection (upsert by reflection_type)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reflection_type, reflection_text } = body;

    if (!reflection_type || !VALID_REFLECTION_TYPES.includes(reflection_type)) {
      return NextResponse.json({
        error: `reflection_type must be one of: ${VALID_REFLECTION_TYPES.join(', ')}`
      }, { status: 400 });
    }

    if (!reflection_text?.trim()) {
      return NextResponse.json({ error: 'reflection_text is required' }, { status: 400 });
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

    // Check if reflection exists for this type
    const { data: existingReflection } = await supabase
      .from('goal_reflections')
      .select('id')
      .eq('session_id', goalSession.id)
      .eq('reflection_type', reflection_type)
      .single();

    let result;

    if (existingReflection) {
      // Update existing reflection
      const { data, error } = await supabase
        .from('goal_reflections')
        .update({ reflection_text: reflection_text.trim() })
        .eq('id', existingReflection.id)
        .select()
        .single();

      if (error) {
        console.error('[Goal Reflections] Error updating:', error);
        return NextResponse.json({ error: 'Failed to update reflection' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new reflection
      const { data, error } = await supabase
        .from('goal_reflections')
        .insert({
          session_id: goalSession.id,
          reflection_type,
          reflection_text: reflection_text.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('[Goal Reflections] Error inserting:', error);
        return NextResponse.json({ error: 'Failed to create reflection' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Goal Reflections] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/goals/reflections/bulk
 * Bulk upsert all reflections at once
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reflections } = body;

    if (!reflections || !Array.isArray(reflections)) {
      return NextResponse.json({ error: 'reflections array is required' }, { status: 400 });
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

    // Delete existing reflections
    await supabase
      .from('goal_reflections')
      .delete()
      .eq('session_id', goalSession.id);

    // Insert new reflections
    const reflectionsToInsert = reflections
      .filter((r: any) => r.reflection_text?.trim() && VALID_REFLECTION_TYPES.includes(r.reflection_type))
      .map((r: any) => ({
        session_id: goalSession.id,
        reflection_type: r.reflection_type,
        reflection_text: r.reflection_text.trim(),
      }));

    if (reflectionsToInsert.length === 0) {
      return NextResponse.json({ success: true, reflections: [] });
    }

    const { data, error } = await supabase
      .from('goal_reflections')
      .insert(reflectionsToInsert)
      .select();

    if (error) {
      console.error('[Goal Reflections] Error bulk inserting:', error);
      return NextResponse.json({ error: 'Failed to save reflections' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reflections: data });
  } catch (error) {
    console.error('[Goal Reflections] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/goals/reflections
 * Delete a reflection
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const reflectionType = searchParams.get('reflection_type');

    // Get current session
    const { data: goalSession } = await supabase
      .from('goal_setting_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!goalSession) {
      return NextResponse.json({ error: 'Goal session not found' }, { status: 404 });
    }

    let query = supabase.from('goal_reflections').delete();

    if (id) {
      query = query.eq('id', id);
    } else if (reflectionType) {
      query = query.eq('session_id', goalSession.id).eq('reflection_type', reflectionType);
    } else {
      return NextResponse.json({ error: 'Either id or reflection_type is required' }, { status: 400 });
    }

    const { error } = await query;

    if (error) {
      console.error('[Goal Reflections] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete reflection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Goal Reflections] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
