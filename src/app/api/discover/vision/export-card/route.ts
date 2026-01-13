import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const defaultTemplates = [
  {
    id: 'gradient-purple',
    name: 'Purple Gradient',
    design_config: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      accentColor: '#fbbf24',
      fontFamily: 'inherit'
    }
  },
  {
    id: 'gradient-blue',
    name: 'Ocean Blue',
    design_config: {
      background: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
      textColor: '#ffffff',
      accentColor: '#fbbf24',
      fontFamily: 'inherit'
    }
  },
  {
    id: 'gradient-sunset',
    name: 'Sunset',
    design_config: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      textColor: '#ffffff',
      accentColor: '#fbbf24',
      fontFamily: 'inherit'
    }
  },
  {
    id: 'gradient-forest',
    name: 'Forest Green',
    design_config: {
      background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
      textColor: '#ffffff',
      accentColor: '#fbbf24',
      fontFamily: 'inherit'
    }
  }
];

const resolveTemplate = (templateId: string | null | undefined) => {
  if (!templateId) return defaultTemplates[0];
  return defaultTemplates.find((template) => template.id === templateId) || defaultTemplates[0];
};

/**
 * POST /api/discover/vision/export-card
 *
 * 비전 카드를 PNG 이미지로 생성
 * NOTE: 실제 이미지 생성은 클라이언트에서 html-to-image 라이브러리로 처리
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. 인증 확인
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    let session = null;

    if (!authError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }

    if (!session || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Vision Statement 데이터 조회
    const { data: visionData, error: visionError } = await supabase
      .from('vision_statements')
      .select('*')
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

    const template = resolveTemplate(visionData.selected_template_id);

    // 3. 카드 데이터 구성
    const cardData = {
      statement: visionData.final_statement,
      style: visionData.statement_style,
      template,
      user: {
        name: session.user.user_metadata?.full_name || session.user.email,
        email: session.user.email
      },
      createdAt: visionData.completed_at || visionData.updated_at
    };

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
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    let session = null;

    if (!authError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }

    if (!session || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Vision Statement 조회
    const { data: visionData, error: visionError } = await supabase
      .from('vision_statements')
      .select('id, final_statement, statement_style, completed_at, updated_at, selected_template_id')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .single();

    if (visionError || !visionData) {
      return NextResponse.json(
        { error: 'No completed vision statement found' },
        { status: 404 }
      );
    }

    const template = resolveTemplate(visionData.selected_template_id);

    // 3. 응답 데이터 구성
    return NextResponse.json({
      statement: visionData.final_statement,
      style: visionData.statement_style,
      template,
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
