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

const resolveUserId = async (explicitId?: string): Promise<string | undefined> => {
  if (explicitId) return explicitId;
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || session?.user?.email || undefined;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get('user_id') || searchParams.get('userId') || undefined;
    const userId = await resolveUserId(queryUserId);
    if (!userId) return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });

    const supabase = createServerSupabaseClient();
    const { data: rows, error } = await supabase
      .from('value_results')
      .select(`
        id,
        user_id,
        value_set,
        layout,
        top3,
        insights,
        module_version,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    const latestBySet: Record<ValueSet, { layout: ValueLayout; top3: string[]; updatedAt: string; insights: unknown; moduleVersion: string | null } | null> = {
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
        updatedAt: record.updated_at,
        insights: record.insights ?? null,
        moduleVersion: record.module_version ?? null,
      };
    }

    return NextResponse.json({ userId, results: latestBySet });
  } catch (err) {
    console.error('GET /api/discover/values/results/all error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}