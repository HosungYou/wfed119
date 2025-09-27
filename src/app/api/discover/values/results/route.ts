import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  emptyLayout,
  isValueLayout,
  normalizeTop3,
  parseLayout,
  type ValueLayout,
  type ValueSet,
} from './layout-utils';

const isSerializableObject = (input: unknown): Record<string, unknown> | null => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  try {
    JSON.stringify(input);
    return input as Record<string, unknown>;
  } catch {
    return null;
  }
};

const resolveUserId = async (explicitId?: string): Promise<string | undefined> => {
  if (explicitId) return explicitId;

  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  return session?.user?.id;
};

interface SaveRequestBody {
  user_id?: unknown;
  userId?: unknown;
  set?: unknown;
  layout?: unknown;
  top3?: unknown;
  insights?: unknown;
  moduleVersion?: unknown;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const setParam = searchParams.get('set');
    const set = (setParam === 'terminal' || setParam === 'instrumental' || setParam === 'work') ? setParam : null;

    if (!set) {
      return NextResponse.json({ error: 'Missing set parameter' }, { status: 400 });
    }

    const { data: latest, error } = await supabase
      .from('value_results')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('value_set', set)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!latest) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    const layout = parseLayout(latest.layout) ?? emptyLayout;
    const top3 = normalizeTop3(latest.top3);

    return NextResponse.json({
      exists: true,
      userId: latest.user_id,
      set: latest.value_set,
      layout,
      top3,
      insights: latest.insights ?? null,
      moduleVersion: latest.module_version ?? null,
      updatedAt: latest.updated_at,
    });
  } catch (err) {
    console.error('GET /api/discover/values/results error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as SaveRequestBody;
    const set = body.set;
    const valueSet: ValueSet | null =
      set === 'terminal' || set === 'instrumental' || set === 'work' ? set : null;
    const layout: ValueLayout | null = isValueLayout(body.layout) ? body.layout : null;
    const top3Array = normalizeTop3(body.top3);
    const insights = isSerializableObject(body.insights);
    const moduleVersion = typeof body.moduleVersion === 'string' ? body.moduleVersion : null;

    if (!valueSet || !layout) {
      return NextResponse.json({ error: 'Missing set or layout' }, { status: 400 });
    }

    // Manual upsert logic for value result
    const { data: existingResult } = await supabase
      .from('value_results')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('value_set', valueSet)
      .single();

    const resultData = {
      user_id: session.user.id,
      value_set: valueSet,
      layout,
      top3: top3Array,
      insights: insights || null,
      module_version: moduleVersion || 'v1'
    };

    let error;
    let data;
    if (existingResult) {
      // Update existing result
      const response = await supabase
        .from('value_results')
        .update(resultData)
        .eq('user_id', session.user.id)
        .eq('value_set', valueSet)
        .select();
      error = response.error;
      data = response.data;
    } else {
      // Insert new result
      const response = await supabase
        .from('value_results')
        .insert(resultData)
        .select();
      error = response.error;
      data = response.data;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id });
  } catch (err) {
    console.error('POST /api/discover/values/results error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
