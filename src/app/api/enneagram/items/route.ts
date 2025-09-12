import { NextRequest, NextResponse } from 'next/server';
import { getScreenerItems } from '../../../../lib/enneagram/itemBank';
import { getInstinctItems } from '../../../../lib/enneagram/instincts';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId') ?? '';
    const stage = (searchParams.get('stage') ?? 'screener') as 'screener' | 'discriminators' | 'wings' | 'narrative';
    const locale = (searchParams.get('locale') ?? 'en') as 'en' | 'kr';

    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    if (stage === 'screener') {
      return NextResponse.json({ items: getScreenerItems(locale) });
    }

    if (stage === 'discriminators') {
      // Return sample discriminator items for testing
      const items = locale === 'kr' ? [
        {
          id: 'd_1vs6_01',
          pair: '1vs6',
          leftType: 1,
          rightType: 6,
          prompt: '규칙과 새로운 위험이 충돌할 때, 저는 먼저…',
          optionA: '원칙을 적용합니다',
          optionB: '가정을 스트레스 테스트합니다',
        },
        {
          id: 'd_1vs6_02',
          pair: '1vs6',
          leftType: 1,
          rightType: 6,
          prompt: '불확실한 상황에서, 저는 다음에 더 이끌립니다…',
          optionA: '무엇이 옳은지',
          optionB: '무엇이 잘못될 수 있는지',
        },
        {
          id: 'd_3vs7_01',
          pair: '3vs7',
          leftType: 3,
          rightType: 7,
          prompt: '저는 다음을 통해 몰입을 유지합니다…',
          optionA: '측정 가능한 진전',
          optionB: '새로운 선택지',
        },
        {
          id: 'd_3vs7_02',
          pair: '3vs7',
          leftType: 3,
          rightType: 7,
          prompt: '계획이 실패할 때, 저는…',
          optionA: '실행을 최적화합니다',
          optionB: '새로운 기회로 전환합니다',
        },
        {
          id: 'd_4vs9_01',
          pair: '4vs9',
          leftType: 4,
          rightType: 9,
          prompt: '긴장 상황에서 저는…',
          optionA: '내면의 진실을 탐색합니다',
          optionB: '분위기를 누그러뜨리고 안정시킵니다',
        },
        {
          id: 'd_4vs9_02',
          pair: '4vs9',
          leftType: 4,
          rightType: 9,
          prompt: '저는 추구합니다…',
          optionA: '진정한 자기표현',
          optionB: '공유된 편안함과 안락함',
        },
      ] : [
        {
          id: 'd_1vs6_01',
          pair: '1vs6',
          leftType: 1,
          rightType: 6,
          prompt: 'When rules conflict with new risks, I first…',
          optionA: 'apply principles',
          optionB: 'stress-test assumptions',
        },
        {
          id: 'd_1vs6_02',
          pair: '1vs6',
          leftType: 1,
          rightType: 6,
          prompt: 'Under uncertainty, I am more driven by…',
          optionA: 'what is right',
          optionB: 'what could go wrong',
        },
        {
          id: 'd_3vs7_01',
          pair: '3vs7',
          leftType: 3,
          rightType: 7,
          prompt: 'I stay engaged by…',
          optionA: 'measurable progress',
          optionB: 'fresh options',
        },
        {
          id: 'd_3vs7_02',
          pair: '3vs7',
          leftType: 3,
          rightType: 7,
          prompt: 'When plans fail, I…',
          optionA: 'optimize execution',
          optionB: 'pivot to new opportunities',
        },
        {
          id: 'd_4vs9_01',
          pair: '4vs9',
          leftType: 4,
          rightType: 9,
          prompt: 'In tension, I…',
          optionA: 'explore inner truth',
          optionB: 'diffuse and steady',
        },
        {
          id: 'd_4vs9_02',
          pair: '4vs9',
          leftType: 4,
          rightType: 9,
          prompt: 'I pursue…',
          optionA: 'authentic self-expression',
          optionB: 'shared ease and comfort',
        },
      ];
      
      return NextResponse.json({ items });
    }

    if (stage === 'wings') {
      return NextResponse.json({ items: getInstinctItems(locale) });
    }

    if (stage === 'narrative') {
      const prompts = locale === 'kr'
        ? [
            '최근의 “아주 나다운” 순간을 묘사해 주세요. 무엇을 추구/회피/보호했나요?',
            '스트레스/안정 상황에서 우선순위와 행동이 어떻게 바뀌나요? 짧은 예를 주세요.',
          ]
        : [
            'Describe a recent situation that felt “very you.” What were you seeking, avoiding, or protecting?',
            'In stress or ease, how do your priorities and behavior shift? Give a brief example.',
          ];
      return NextResponse.json({ prompts });
    }

    return NextResponse.json({ error: 'Unsupported stage' }, { status: 400 });
  } catch (e) {
    console.error('enneagram/items error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
