import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/vision/check-prerequisites
 *
 * Vision Statement 모듈 진입 전 선행 조건 확인
 * - Values Discovery 완료 여부
 * - Strengths Discovery 완료 여부
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. 인증 확인 (개발 모드 지원)
    const { data: { user } } = await supabase.auth.getUser();
    const auth = checkDevAuth(user ? { user } : null);

    // 개발 모드에서는 선행조건 체크를 스킵하고 모두 완료로 처리
    if (auth.isDevelopmentMode) {
      return NextResponse.json({
        values: true,
        strengths: true,
        canProceed: true,
        message: 'Development mode - all prerequisites bypassed'
      });
    }

    if (!requireAuth(auth)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = auth.userId;
    const userEmail = user?.email || null;

    // 2. Values Discovery 완료 여부 확인
    const { data: valuesData, error: valuesError } = await supabase
      .from('value_results')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (valuesError && valuesError.code !== 'PGRST116') {
      console.error('[Prerequisites Check] Values query error:', valuesError);
    }

    const valuesCompleted = !!valuesData;

    // 3. Strengths Discovery 완료 여부 확인 (user_id -> user_email fallback)
    let strengthsCompleted = false;

    const { data: strengthsData, error: strengthsError } = await supabase
      .from('strength_profiles')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (strengthsError && strengthsError.code !== 'PGRST116') {
      console.error('[Prerequisites Check] Strengths query error:', strengthsError);
    }

    strengthsCompleted = !!strengthsData;

    if (!strengthsCompleted && userEmail) {
      const { data: strengthsByEmail, error: strengthsEmailError } = await supabase
        .from('strength_profiles')
        .select('id')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (strengthsEmailError && strengthsEmailError.code !== 'PGRST116') {
        console.error('[Prerequisites Check] Strengths email query error:', strengthsEmailError);
      }

      strengthsCompleted = !!strengthsByEmail;
    }

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
