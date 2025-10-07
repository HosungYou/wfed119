import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/discover/vision/templates
 *
 * 비전 카드 템플릿 목록 조회
 * - 활성화된 템플릿만 반환
 * - display_order 순으로 정렬
 */
export async function GET(req: NextRequest) {
  try {
    // Return hardcoded templates (no database required)
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

    return NextResponse.json(defaultTemplates);

  } catch (error) {
    console.error('[Templates] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/discover/vision/templates
 *
 * 새로운 템플릿 추가 (관리자 전용)
 * TODO: 관리자 권한 체크 추가 필요
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: 관리자 권한 체크
    // const isAdmin = await checkAdminRole(session.user.id);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await req.json();
    const { name, design_config, thumbnail_url, display_order } = body;

    if (!name || !design_config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, design_config' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('vision_card_templates')
      .insert({
        name,
        design_config,
        thumbnail_url,
        display_order: display_order || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('[Templates] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('[Templates] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
