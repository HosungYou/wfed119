import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

const normalizeTop3 = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

type StrengthItem = {
  name: string;
  strength: string;
  category?: string;
  rank: number;
};

const buildStrengthList = (rawStrengths: unknown): StrengthItem[] => {
  if (!rawStrengths || typeof rawStrengths !== 'object') return [];

  const strengths: StrengthItem[] = [];
  const entries = Object.entries(rawStrengths as Record<string, unknown>);

  for (const [category, items] of entries) {
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      let name = '';

      if (typeof item === 'string') {
        name = item;
      } else if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const candidate = record.name || record.strength || record.title;
        if (typeof candidate === 'string') name = candidate;
      }

      if (!name) continue;

      strengths.push({
        name,
        strength: name,
        category,
        rank: strengths.length + 1,
      });
    }
  }

  return strengths.slice(0, 5);
};

/**
 * GET /api/discover/vision/context
 *
 * Vision Statement 생성을 위한 컨텍스트 데이터 조회
 * - Top 3 Values (궁극적, 수단적, 직업 가치)
 * - Top 5 Strengths
 * - 사용자 기본 정보
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authentication check with dev mode support
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('[Vision Context] Auth error:', authError);
    }

    const auth = checkDevAuth(user ? { user } : null);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;
    const userEmail = user?.email || null;

    // 2. Values 데이터 조회
    const { data: valuesData, error: valuesError } = await supabase
      .from('value_results')
      .select('value_set, top3, insights, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (valuesError) {
      console.error('[Vision Context] Values query error:', valuesError);
    }

    const valuesContext = {
      terminal: { top3: [] as string[], insights: null as unknown },
      instrumental: { top3: [] as string[], insights: null as unknown },
      work: { top3: [] as string[], insights: null as unknown }
    };

    valuesData?.forEach((record) => {
      const set = record.value_set as keyof typeof valuesContext | null;
      if (!set || !valuesContext[set]) return;
      if (valuesContext[set].top3.length > 0) return;

      valuesContext[set] = {
        top3: normalizeTop3(record.top3),
        insights: record.insights ?? null
      };
    });

    // 3. Strengths 데이터 조회 (user_id -> user_email fallback)
    let strengthsData: { strengths?: unknown } | null = null;

    const { data: strengthsByUser, error: strengthsError } = await supabase
      .from('strength_profiles')
      .select('strengths, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (strengthsError && strengthsError.code !== 'PGRST116') {
      console.error('[Vision Context] Strengths query error:', strengthsError);
    }

    strengthsData = strengthsByUser;

    if (!strengthsData && userEmail) {
      const { data: strengthsByEmail, error: strengthsEmailError } = await supabase
        .from('strength_profiles')
        .select('strengths, updated_at')
        .eq('user_email', userEmail)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (strengthsEmailError && strengthsEmailError.code !== 'PGRST116') {
        console.error('[Vision Context] Strengths email query error:', strengthsEmailError);
      }

      strengthsData = strengthsByEmail;
    }

    const strengths = buildStrengthList(strengthsData?.strengths);

    // 4. Build response
    return NextResponse.json({
      values: valuesContext,
      strengths,
      user: {
        id: userId,
        email: auth.isDevelopmentMode ? 'dev@example.com' : user?.email,
        name: auth.isDevelopmentMode ? 'Dev User' : (user?.user_metadata?.full_name || user?.email)
      }
    });

  } catch (error) {
    console.error('[Vision Context] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
