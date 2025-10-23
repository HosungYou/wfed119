import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/swot/goals
 * Fetch user's SWOT goals
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    // Get SWOT analysis ID first
    const { data: swotData } = await supabase
      .from('swot_analyses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!swotData) {
      return NextResponse.json([]);
    }

    // Get goals
    const { data: goals, error } = await supabase
      .from('swot_goals')
      .select('*')
      .eq('swot_analysis_id', swotData.id)
      .order('goal_number', { ascending: true });

    if (error) {
      console.error('[SWOT Goals] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    return NextResponse.json(goals || []);
  } catch (error) {
    console.error('[SWOT Goals] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/swot/goals
 * Create or update SWOT goals (bulk upsert)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;
    const body = await req.json();
    const { goals } = body;

    // Get SWOT analysis ID
    const { data: swotData } = await supabase
      .from('swot_analyses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!swotData) {
      return NextResponse.json({ error: 'SWOT analysis not found' }, { status: 404 });
    }

    // Delete existing goals
    await supabase
      .from('swot_goals')
      .delete()
      .eq('swot_analysis_id', swotData.id);

    // Insert new goals (only non-empty ones)
    const goalsToInsert = goals
      .filter((g: any) => g.role_responsibility.trim() && g.action_plan.trim())
      .map((g: any) => ({
        swot_analysis_id: swotData.id,
        user_id: userId,
        goal_number: g.goal_number,
        role_responsibility: g.role_responsibility,
        sub_goals: g.sub_goals || [],
        action_plan: g.action_plan,
        criteria: g.criteria,
        deadline: g.deadline || null,
        percentage_allocation: g.percentage_allocation || 0
      }));

    if (goalsToInsert.length > 0) {
      const { error } = await supabase
        .from('swot_goals')
        .insert(goalsToInsert);

      if (error) {
        console.error('[SWOT Goals] Error inserting:', error);
        return NextResponse.json({ error: 'Failed to save goals' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, count: goalsToInsert.length });
  } catch (error) {
    console.error('[SWOT Goals] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
