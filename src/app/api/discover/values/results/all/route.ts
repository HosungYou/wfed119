import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  emptyLayout,
  normalizeTop3,
  parseLayout,
  type ValueLayout,
  type ValueSet,
} from '../layout-utils';

const valueSets: ValueSet[] = ['terminal', 'instrumental', 'work'];

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rows, error } = await supabase
      .from('value_results')
      .select('id, user_id, value_set, layout, top3, insights, module_version, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    const latestBySet: Record<ValueSet, { layout: ValueLayout; top3: string[]; insights: unknown; moduleVersion: string | null; updatedAt: string } | null> = {
      terminal: null,
      instrumental: null,
      work: null,
    };
    for (const set of valueSets) {
      const record = rows?.find((row) => row.value_set === set);
      if (!record) continue;
      const layout = parseLayout(record.layout) ?? emptyLayout;
      const top3 = normalizeTop3(record.top3);
      latestBySet[set] = {
        layout,
        top3,
        insights: record.insights ?? null,
        moduleVersion: record.module_version ?? null,
        updatedAt: record.updated_at
      };
    }

    return NextResponse.json({ userId: user.id, results: latestBySet });
  } catch (err) {
    console.error('GET /api/discover/values/results/all error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
