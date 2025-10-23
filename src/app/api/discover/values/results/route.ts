import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

const resolveUserId = async (explicitId?: string): Promise<string | undefined> => {
  if (explicitId) return explicitId;
  const session = await getServerSession(authOptions);
  return session?.user?.id || session?.user?.email || undefined;
};

interface SaveRequestBody {
  user_id?: unknown;
  userId?: unknown;
  set?: unknown;
  layout?: unknown;
  top3?: unknown;
}

export async function GET(req: NextRequest) {
  if (isDatabaseDisabled()) {
    return dbDisabledResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const setParam = searchParams.get('set');
    const set = (setParam === 'terminal' || setParam === 'instrumental' || setParam === 'work') ? setParam : null;

    const queryUserId = searchParams.get('user_id') || searchParams.get('userId') || undefined;
    const userId = await resolveUserId(queryUserId || undefined);

    if (!userId || !set) {
      return NextResponse.json({ error: 'Missing user_id and set' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: latest, error } = await supabase
      .from('value_results')
      .select('*')
      .eq('user_id', userId)
      .eq('value_set', set)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

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
    const body = (await req.json()) as SaveRequestBody;
    const set = body.set;
    const valueSet: ValueSet | null =
      set === 'terminal' || set === 'instrumental' || set === 'work' ? set : null;
    const layout: ValueLayout | null = isValueLayout(body.layout) ? body.layout : null;
    const top3Array = normalizeTop3(body.top3);

    const explicitUser = typeof body.user_id === 'string' ? body.user_id : typeof body.userId === 'string' ? body.userId : undefined;
    const uid = await resolveUserId(explicitUser);

    if (!uid || !valueSet || !layout) {
      return NextResponse.json({ error: 'Missing user identity, set, or layout' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Find existing records
    const { data: existing } = await supabase
      .from('value_results')
      .select('*')
      .eq('user_id', uid)
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
        user_id: uid,
        value_set: valueSet,
        layout,
        top3: top3Array,
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
