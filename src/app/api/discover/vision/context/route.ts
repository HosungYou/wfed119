import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

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

    // 1. 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Values 데이터 조회
    const { data: valuesData, error: valuesError } = await supabase
      .from('value_assessment_results')
      .select('set, top3, insights, layout')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (valuesError) {
      console.error('[Vision Context] Values query error:', valuesError);
    }

    // 3개 세트의 Top 3 가치 추출
    const valuesContext = {
      terminal: { top3: [], insights: null },
      instrumental: { top3: [], insights: null },
      work: { top3: [], insights: null }
    };

    valuesData?.forEach(record => {
      if (record.set && valuesContext[record.set as keyof typeof valuesContext]) {
        valuesContext[record.set as keyof typeof valuesContext] = {
          top3: record.top3 || [],
          insights: record.insights
        };
      }
    });

    // 3. Strengths 데이터 조회
    const { data: strengthsData, error: strengthsError } = await supabase
      .from('user_strengths')
      .select(`
        strength_id,
        score,
        rank,
        strengths:strength_id (
          name,
          description,
          category_id
        )
      `)
      .eq('user_id', userId)
      .order('rank', { ascending: true })
      .limit(5);

    if (strengthsError) {
      console.error('[Vision Context] Strengths query error:', strengthsError);
    }

    // 4. 응답 구성
    return NextResponse.json({
      values: valuesContext,
      strengths: strengthsData || [],
      user: {
        id: userId,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email
      }
    });

  } catch (error) {
    console.error('[Vision Context] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
