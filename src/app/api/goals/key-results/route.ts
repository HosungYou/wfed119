import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { KeyResultStatus } from '@/lib/types/goalSetting';

/**
 * GET /api/goals/key-results
 * Fetch key results for an objective or all key results
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const objectiveId = searchParams.get('objective_id');

    let query = supabase
      .from('goal_key_results')
      .select(`
        *,
        goal_action_plans (*)
      `)
      .order('key_result_number', { ascending: true });

    if (objectiveId) {
      query = query.eq('objective_id', objectiveId);
    }

    const { data: keyResults, error } = await query;

    if (error) {
      console.error('[Goal Key Results] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch key results' }, { status: 500 });
    }

    return NextResponse.json(keyResults || []);
  } catch (error) {
    console.error('[Goal Key Results] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/goals/key-results
 * Create or update key results for an objective
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
    const { objective_id, key_results } = body;

    if (!objective_id) {
      return NextResponse.json({ error: 'objective_id is required' }, { status: 400 });
    }

    if (!key_results || !Array.isArray(key_results)) {
      return NextResponse.json({ error: 'key_results array is required' }, { status: 400 });
    }

    // Delete existing key results for this objective
    await supabase
      .from('goal_key_results')
      .delete()
      .eq('objective_id', objective_id);

    // Insert new key results
    const keyResultsToInsert = key_results
      .filter((kr: any) => kr.key_result_text?.trim())
      .map((kr: any, index: number) => ({
        objective_id: objective_id,
        key_result_number: kr.key_result_number || index + 1,
        key_result_text: kr.key_result_text,
        success_criteria: kr.success_criteria || null,
        deadline: kr.deadline || null,
        status: kr.status || 'not_started',
        progress_percentage: kr.progress_percentage || 0,
      }));

    if (keyResultsToInsert.length === 0) {
      return NextResponse.json({ success: true, key_results: [] });
    }

    const { data, error } = await supabase
      .from('goal_key_results')
      .insert(keyResultsToInsert)
      .select();

    if (error) {
      console.error('[Goal Key Results] Error inserting:', error);
      return NextResponse.json({ error: 'Failed to save key results' }, { status: 500 });
    }

    return NextResponse.json({ success: true, key_results: data });
  } catch (error) {
    console.error('[Goal Key Results] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/goals/key-results
 * Update a single key result
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, key_result_text, success_criteria, deadline, status, progress_percentage } = body;

    if (!id) {
      return NextResponse.json({ error: 'Key result id is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (key_result_text !== undefined) updateData.key_result_text = key_result_text;
    if (success_criteria !== undefined) updateData.success_criteria = success_criteria;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (status !== undefined) updateData.status = status as KeyResultStatus;
    if (progress_percentage !== undefined) updateData.progress_percentage = progress_percentage;

    const { data, error } = await supabase
      .from('goal_key_results')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Goal Key Results] Error updating:', error);
      return NextResponse.json({ error: 'Failed to update key result' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Goal Key Results] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/goals/key-results
 * Delete a key result
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

    if (!id) {
      return NextResponse.json({ error: 'Key result id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('goal_key_results')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Goal Key Results] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete key result' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Goal Key Results] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
