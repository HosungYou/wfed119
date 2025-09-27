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
    console.log('[GET /api/discover/values/results] Request received');

    const supabase = createServerSupabaseClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('[GET /api/discover/values/results] Auth error:', authError);
      return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 500 });
    }

    if (!session) {
      console.log('[GET /api/discover/values/results] No session found');
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    console.log('[GET /api/discover/values/results] User authenticated:', session.user.id);

    const { searchParams } = new URL(req.url);
    const setParam = searchParams.get('set');
    const set = (setParam === 'terminal' || setParam === 'instrumental' || setParam === 'work') ? setParam : null;

    console.log('[GET /api/discover/values/results] Params:', { setParam, set });

    if (!set) {
      console.error('[GET /api/discover/values/results] Invalid or missing set parameter:', setParam);
      return NextResponse.json({ error: 'Missing or invalid set parameter. Must be: terminal, instrumental, or work' }, { status: 400 });
    }

    console.log('[GET /api/discover/values/results] Querying database for user:', session.user.id, 'set:', set);

    const { data: latest, error } = await supabase
      .from('value_results')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('value_set', set)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[GET /api/discover/values/results] Database error:', error);
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    if (!latest) {
      console.log('[GET /api/discover/values/results] No saved results found for user');
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    console.log('[GET /api/discover/values/results] Found saved results:', latest.id);

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
    console.error('[GET /api/discover/values/results] Unexpected error:', err);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[POST /api/discover/values/results] Request received');

    const supabase = createServerSupabaseClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('[POST /api/discover/values/results] Auth error:', authError);
      return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 500 });
    }

    if (!session) {
      console.log('[POST /api/discover/values/results] No session found');
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    console.log('[POST /api/discover/values/results] User authenticated:', session.user.id);

    // Auto-create user in users table if not exists (for development)
    const { error: upsertUserError } = await supabase
      .from('users')
      .upsert({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email,
        role: 'USER',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: true
      });

    if (upsertUserError) {
      console.log('[POST /api/discover/values/results] User upsert failed (non-critical):', upsertUserError);
    }

    const body = (await req.json()) as SaveRequestBody;
    const set = body.set;
    const valueSet: ValueSet | null =
      set === 'terminal' || set === 'instrumental' || set === 'work' ? set : null;
    const layout: ValueLayout | null = isValueLayout(body.layout) ? body.layout : null;
    const top3Array = normalizeTop3(body.top3);
    const insights = isSerializableObject(body.insights);
    const moduleVersion = typeof body.moduleVersion === 'string' ? body.moduleVersion : null;

    console.log('[POST /api/discover/values/results] Params:', { valueSet, hasLayout: !!layout });

    if (!valueSet || !layout) {
      console.error('[POST /api/discover/values/results] Missing required data:', { valueSet, hasLayout: !!layout });
      return NextResponse.json({ error: 'Missing set or layout' }, { status: 400 });
    }

    // Proper Supabase upsert using onConflict with unique constraint
    console.log('[POST /api/discover/values/results] Performing proper upsert with unique constraint...');

    const resultData = {
      user_id: session.user.id,
      value_set: valueSet,
      layout,
      top3: top3Array,
      insights: insights || null,
      module_version: moduleVersion || 'v1',
      updated_at: new Date().toISOString()
    };

    // Use proper Supabase upsert with onConflict parameter
    const { data, error } = await supabase
      .from('value_results')
      .upsert(resultData, {
        onConflict: 'user_id,value_set', // Must match the unique constraint
        ignoreDuplicates: false // We want to update, not ignore
      })
      .select();

    if (error) {
      console.error('[POST /api/discover/values/results] Upsert error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Handle specific error cases
      if (error.code === '42P10') {
        return NextResponse.json({
          error: 'Database constraint missing',
          message: 'Unique constraint (user_id, value_set) is required. Please run the database migration.',
          details: error.message
        }, { status: 500 });
      }

      if (error.code === '23505') {
        // This shouldn't happen with proper upsert, but handle it
        console.log('[POST /api/discover/values/results] Unique constraint violation - this should not happen with upsert');
        return NextResponse.json({
          error: 'Unique constraint violation',
          message: 'Concurrent modification detected. Please try again.',
          details: error.message
        }, { status: 409 });
      }

      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log('[POST /api/discover/values/results] Upsert successful');
    return NextResponse.json({ success: true, id: data?.[0]?.id });

  } catch (err) {
    console.error('[POST /api/discover/values/results] Unexpected error:', err);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}