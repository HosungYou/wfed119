import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/values/session
 *
 * Returns the current user's values discovery status for all three value types
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authentication check with dev mode support
    const { data: { user } } = await supabase.auth.getUser();
    const auth = checkDevAuth(user ? { user } : null);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    // 2. Get all value results for this user
    const { data: valueResults, error } = await supabase
      .from('value_results')
      .select('value_set, top3, layout, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Values Session] Query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 3. Build status for each value type
    const terminalResult = valueResults?.find(r => r.value_set === 'terminal');
    const instrumentalResult = valueResults?.find(r => r.value_set === 'instrumental');
    const workResult = valueResults?.find(r => r.value_set === 'work');

    // Helper to check if a value set is completed (has top3 selected)
    const isCompleted = (result: typeof terminalResult) => {
      if (!result) return false;
      const top3 = result.top3;
      if (Array.isArray(top3) && top3.length >= 3) return true;
      return false;
    };

    // Helper to get values from result
    const getValues = (result: typeof terminalResult) => {
      if (!result) return [];
      const top3 = result.top3;
      if (Array.isArray(top3)) return top3;
      return [];
    };

    const response = {
      terminal_values: getValues(terminalResult),
      terminal_completed: isCompleted(terminalResult),
      instrumental_values: getValues(instrumentalResult),
      instrumental_completed: isCompleted(instrumentalResult),
      work_values: getValues(workResult),
      work_completed: isCompleted(workResult),
      // Additional data for UI
      terminal_updated_at: terminalResult?.updated_at || null,
      instrumental_updated_at: instrumentalResult?.updated_at || null,
      work_updated_at: workResult?.updated_at || null,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Values Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
