import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/discover/vision/check-prerequisites
 *
 * Vision Statement 모듈 진입 전 선행 조건 확인
 * - Values Discovery 완료 여부
 * - Strengths Discovery 완료 여부
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Values Discovery 완료 여부 확인
    const { data: valuesData, error: valuesError } = await supabase
      .from('value_assessment_results')
      .select('id, is_completed')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (valuesError && valuesError.code !== 'PGRST116') {
      console.error('[Prerequisites Check] Values query error:', valuesError);
    }

    const valuesCompleted = valuesData?.is_completed ?? false;

    // 3. Strengths Discovery 완료 여부 확인
    const { data: strengthsData, error: strengthsError } = await supabase
      .from('user_assessments')
      .select('id, completion_status')
      .eq('user_id', userId)
      .eq('completion_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (strengthsError && strengthsError.code !== 'PGRST116') {
      console.error('[Prerequisites Check] Strengths query error:', strengthsError);
    }

    const strengthsCompleted = strengthsData?.completion_status === 'completed';

    // 4. 응답 반환
    return NextResponse.json({
      values: valuesCompleted,
      strengths: strengthsCompleted,
      canProceed: valuesCompleted && strengthsCompleted,
      message: valuesCompleted && strengthsCompleted
        ? 'All prerequisites completed'
        : 'Please complete Values and Strengths modules first'
    });

  } catch (error) {
    console.error('[Prerequisites Check] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
