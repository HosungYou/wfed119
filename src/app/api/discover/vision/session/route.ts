import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/discover/vision/session
 *
 * 현재 사용자의 Vision Statement 세션 조회
 * - 진행 중인 세션 또는 새로운 세션 생성
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. 기존 Vision Statement 조회
    const { data: visionData, error: visionError } = await supabase
      .from('vision_statements')
      .select('*')
      .eq('user_id', userId)
      .single();

    // 3. 없으면 새로 생성
    if (visionError && visionError.code === 'PGRST116') {
      // 선행 조건 데이터 가져오기
      const { data: valuesData } = await supabase
        .from('value_assessment_results')
        .select('id, layout, insights')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: newVision, error: createError } = await supabase
        .from('vision_statements')
        .insert({
          user_id: userId,
          values_result_id: valuesData?.id || null,
          current_step: 1,
          is_completed: false
        })
        .select()
        .single();

      if (createError) {
        console.error('[Vision Session] Create error:', createError);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }

      return NextResponse.json(newVision);
    }

    if (visionError) {
      console.error('[Vision Session] Query error:', visionError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(visionData);

  } catch (error) {
    console.error('[Vision Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/discover/vision/session
 *
 * Vision Statement 세션 업데이트 (중간 저장)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const {
      current_step,
      future_imagery,
      future_imagery_analysis,
      core_aspirations,
      draft_versions,
      final_statement,
      statement_style,
      selected_template_id,
      is_completed
    } = body;

    // 2. 업데이트할 필드 준비
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (current_step !== undefined) updateData.current_step = current_step;
    if (future_imagery !== undefined) updateData.future_imagery = future_imagery;
    if (future_imagery_analysis !== undefined) updateData.future_imagery_analysis = future_imagery_analysis;
    if (core_aspirations !== undefined) updateData.core_aspirations = core_aspirations;
    if (draft_versions !== undefined) updateData.draft_versions = draft_versions;
    if (final_statement !== undefined) updateData.final_statement = final_statement;
    if (statement_style !== undefined) updateData.statement_style = statement_style;
    if (selected_template_id !== undefined) updateData.selected_template_id = selected_template_id;
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed;
      if (is_completed) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    // 3. 업데이트 실행
    const { data, error } = await supabase
      .from('vision_statements')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Vision Session] Update error:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('[Vision Session] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
