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

const dbDisabledResponse = () =>
  NextResponse.json({ error: 'Database operations disabled' }, { status: 503 });

const isDatabaseDisabled = () => process.env.DB_ENABLED === 'false';

const isSerializableObject = (input: unknown): Record<string, unknown> | null => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  try {
    JSON.stringify(input);
    return input as Record<string, unknown>;
  } catch {
    return null;
  }
};

interface SaveRequestBody {
  set?: unknown;
  layout?: unknown;
  top3?: unknown;
  insights?: unknown;
  moduleVersion?: unknown;
}

export async function GET(req: NextRequest) {
  if (isDatabaseDisabled()) {
    return dbDisabledResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const setParam = searchParams.get('set');
    const set = (setParam === 'terminal' || setParam === 'instrumental' || setParam === 'work') ? setParam : null;

    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    let session = null;

    if (!authError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!set) {
      return NextResponse.json({ error: 'Missing set' }, { status: 400 });
    }

    const { data: latest, error } = await supabase
      .from('value_results')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('value_set', set)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !latest) {
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
  if (isDatabaseDisabled()) {
    return dbDisabledResponse();
  }

  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    let session = null;

    if (!authError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }

    if (!session?.user) {
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

    const userId = session.user.id;

    // Find existing records
    const { data: existing } = await supabase
      .from('value_results')
      .select('*')
      .eq('user_id', userId)
      .eq('value_set', valueSet)
      .order('updated_at', { ascending: false });

    // Delete duplicates if any (keep only the latest)
    if (existing && existing.length > 1) {
      const duplicateIds = existing.slice(1).map(r => r.id);
      await supabase
        .from('value_results')
        .delete()
        .in('id', duplicateIds);
    }

    // Upsert the record
    const { data: saved, error } = await supabase
      .from('value_results')
      .upsert({
        user_id: userId,
        value_set: valueSet,
        layout,
        top3: top3Array,
        insights: insights || null,
        module_version: moduleVersion,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,value_set',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: saved.id });
  } catch (err) {
    console.error('POST /api/discover/values/results error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
