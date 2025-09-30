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

    // TODO: Implement discriminators stage with Supabase
    // Discriminators stage requires loading session data and scoring
    if (stage === 'discriminators') {
      return NextResponse.json({ items: [] });
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
