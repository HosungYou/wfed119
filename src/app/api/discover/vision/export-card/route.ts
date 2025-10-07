import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * POST /api/discover/vision/export-card
 *
 * 비전 카드를 PNG 이미지로 생성
 *
 * NOTE: 실제 이미지 생성은 클라이언트에서 html-to-image 라이브러리로 처리
 * 이 API는 생성된 이미지를 저장하거나 메타데이터를 기록하는 용도로 사용 가능
 *
 * 현재는 카드 데이터만 반환하고, 클라이언트에서 PNG 생성
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Vision Statement 데이터 조회
    const { data: visionData, error: visionError } = await supabase
      .from('vision_statements')
      .select(`
        *,
        vision_card_templates (
          name,
          design_config
        )
      `)
      .eq('user_id', userId)
      .single();

    if (visionError || !visionData) {
      console.error('[Export Card] Query error:', visionError);
      return NextResponse.json(
        { error: 'Vision statement not found' },
        { status: 404 }
      );
    }

    if (!visionData.final_statement) {
      return NextResponse.json(
        { error: 'Vision statement not completed yet' },
        { status: 400 }
      );
    }

    // 3. 카드 데이터 구성
    const cardData = {
      statement: visionData.final_statement,
      style: visionData.statement_style,
      template: visionData.vision_card_templates || {
        name: 'Default',
        design_config: {
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          textColor: '#ffffff',
          fontFamily: 'Inter',
          layout: 'modern'
        }
      },
      user: {
        name: session.user.user_metadata?.full_name || session.user.email,
        email: session.user.email
      },
      createdAt: visionData.completed_at || visionData.updated_at
    };

    // 4. (선택적) 이미지 생성 이벤트 로깅
    // TODO: 나중에 이미지 생성 횟수 추적 등에 활용 가능

    return NextResponse.json(cardData);

  } catch (error) {
    console.error('[Export Card] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/discover/vision/export-card
 *
 * 현재 사용자의 비전 카드 데이터 조회 (이미지 생성용)
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

    // 2. Vision Statement + Template 조회
    const { data: visionData, error: visionError } = await supabase
      .from('vision_statements')
      .select(`
        id,
        final_statement,
        statement_style,
        completed_at,
        updated_at,
        vision_card_templates (
          id,
          name,
          design_config
        )
      `)
      .eq('user_id', userId)
      .eq('is_completed', true)
      .single();

    if (visionError || !visionData) {
      return NextResponse.json(
        { error: 'No completed vision statement found' },
        { status: 404 }
      );
    }

    // 3. 응답 데이터 구성
    return NextResponse.json({
      statement: visionData.final_statement,
      style: visionData.statement_style,
      template: visionData.vision_card_templates,
      completedAt: visionData.completed_at,
      user: {
        name: session.user.user_metadata?.full_name || 'User',
        email: session.user.email
      }
    });

  } catch (error) {
    console.error('[Export Card] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
