import { NextRequest, NextResponse } from 'next/server';

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

/**
 * GET /api/discover/vision/templates
 *
 * 비전 카드 템플릿 목록 조회 (하드코딩)
 */
export async function GET(req: NextRequest) {
  try {
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
 * 현재 DB에 템플릿 테이블이 없으므로 비활성화
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Template creation is not supported in the current schema.' },
    { status: 501 }
  );
}
