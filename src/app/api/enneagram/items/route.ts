import { NextRequest, NextResponse } from 'next/server';
import { getScreenerItems } from '../../../../lib/enneagram/itemBank';
import { getInstinctItems } from '../../../../lib/enneagram/instincts';
import { getDiscriminatorItems, getDiscriminatorPairsForTop } from '../../../../lib/enneagram/discriminators';
import { scoreStage1 } from '../../../../lib/enneagram/scoring';
import { createSupabaseAdmin } from '@/lib/supabase';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId') ?? '';
    const stage = (searchParams.get('stage') ?? 'screener') as 'screener' | 'discriminators' | 'wings' | 'narrative';
    const locale = (searchParams.get('locale') ?? 'en') as 'en' | 'kr';

    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    if (stage === 'screener') {
      // Shuffle items for randomized presentation
      const items = shuffleArray(getScreenerItems(locale));
      return NextResponse.json({ items });
    }

    // const enne = await prisma.enneagramSession.findUnique({ where: { sessionId } });
    // if (!enne) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // if (stage === 'discriminators') {
    //   const stage1 = (enne.responses as any)?.stage1 ?? [];
    //   const { probabilities } = scoreStage1(stage1, locale);
    //   const sorted = Object.entries(probabilities)
    //     .map(([k, v]) => ({ type: Number(k), p: v }))
    //     .sort((a, b) => b.p - a.p);
    //   const top = sorted.slice(0, 3).map((x) => x.type);
    //   const pairs = getDiscriminatorPairsForTop(top);
    //   const items = getDiscriminatorItems(locale, pairs);

    //   // store plan once for consistency
    //   const responses = enne.responses as any;
    //   if (!responses.stage2Plan) {
    //     responses.stage2Plan = items.map((i) => ({ id: i.id, pair: i.pair }));
    //     // await prisma.enneagramSession.update({ where: { sessionId }, data: { responses } });
    //   }

    //   return NextResponse.json({ items });
    // }

    if (stage === 'discriminators') {
      let admin;
      try {
        admin = createSupabaseAdmin();
      } catch (error) {
        console.error('[Enneagram Items] Service role missing:', error);
        return NextResponse.json(
          { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' },
          { status: 501 }
        );
      }

      const { data: session, error } = await admin
        .from('enneagram_sessions')
        .select('responses, locale')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[Enneagram Items] Session lookup error:', error);
        return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
      }

      if (!session?.responses || typeof session.responses !== 'object') {
        return NextResponse.json({ error: 'Screener responses not found' }, { status: 404 });
      }

      const stage1 = (session.responses as Record<string, unknown>).screener;
      if (!Array.isArray(stage1) || stage1.length === 0) {
        return NextResponse.json({ error: 'Screener responses not found' }, { status: 404 });
      }

      const normalized = stage1
        .map((entry: any) => ({ itemId: entry?.itemId, value: entry?.value }))
        .filter((entry: any) => typeof entry.itemId === 'string' && typeof entry.value === 'number');

      const { probabilities } = scoreStage1(normalized, locale);
      const topTypes = Object.entries(probabilities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => Number(type));

      const pairs = getDiscriminatorPairsForTop(topTypes);
      const items = getDiscriminatorItems(locale, pairs);

      return NextResponse.json({ items });
    }

    if (stage === 'wings') {
      return NextResponse.json({ items: getInstinctItems(locale) });
    }

    if (stage === 'narrative') {
      const prompts = locale === 'kr'
        ? [
            '최근의 "아주 나다운" 순간을 묘사해 주세요. 무엇을 추구/회피/보호했나요?',
            '압박 상황이나 편안한 상태에서 우선순위와 행동이 어떻게 바뀌나요? 짧은 예를 들어 주세요.',
          ]
        : [
            'Describe a recent situation that felt "very you." What were you seeking, avoiding, or protecting?',
            'Under pressure or relaxed, how do your priorities and behavior shift? Give a brief example.',
          ];
      return NextResponse.json({ prompts });
    }

    return NextResponse.json({ error: 'Unsupported stage' }, { status: 400 });
  } catch (e) {
    console.error('enneagram/items error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
