import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

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
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;

    // 2. Values 데이터 조회 (value_results 테이블 사용)
    const { data: valuesData, error: valuesError } = await supabase
      .from('value_results')
      .select('value_set, top3, insights, layout')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (valuesError) {
      console.error('[Vision Context] Values query error:', valuesError);
    }

    // 3개 세트의 Top 3 가치 추출
    const valuesContext: Record<string, { top3: string[]; insights: unknown }> = {
      terminal: { top3: [], insights: null },
      instrumental: { top3: [], insights: null },
      work: { top3: [], insights: null }
    };

    valuesData?.forEach(record => {
      const setKey = record.value_set;
      if (setKey && valuesContext[setKey]) {
        valuesContext[setKey] = {
          top3: Array.isArray(record.top3) ? record.top3 : [],
          insights: record.insights
        };
      }
    });

    // 3. Strengths 데이터 조회 (단일 소스: strength_discovery_results)
    const { data: strengthsRow, error: strengthsError } = await supabase
      .from('strength_discovery_results')
      .select('final_strengths')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (strengthsError) {
      console.error('[Vision Context] Strengths query error:', strengthsError);
    }

    let strengthsData: Array<{ name: string; description?: string }> = [];
    if (Array.isArray(strengthsRow?.final_strengths)) {
      strengthsData = strengthsRow?.final_strengths;
    } else if (typeof strengthsRow?.final_strengths === 'string') {
      try {
        const parsed = JSON.parse(strengthsRow.final_strengths);
        if (Array.isArray(parsed)) {
          strengthsData = parsed;
        }
      } catch (err) {
        console.warn('[Vision Context] Failed to parse final_strengths:', err);
      }
    }

    // 4. Build response
    return NextResponse.json({
      values: valuesContext,
      strengths: strengthsData || [],
      user: {
        id: userId,
        email: auth.isDevelopmentMode ? 'dev@example.com' : session?.user?.email,
        name: auth.isDevelopmentMode ? 'Dev User' : (session?.user?.user_metadata?.full_name || session?.user?.email)
      }
    });

  } catch (error) {
    console.error('[Vision Context] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
