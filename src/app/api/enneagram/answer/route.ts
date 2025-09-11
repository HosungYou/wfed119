import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '../../../../lib/prisma';
import { getScreenerItems } from '../../../../lib/enneagram/itemBank';
// import { itemById as discItemById } from '../../../../lib/enneagram/discriminators';
import { getInstinctItems } from '../../../../lib/enneagram/instincts';

type Stage = 'screener' | 'discriminators' | 'wings' | 'narrative' | 'complete';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, stage, input, locale = 'en' } = await req.json();

    if (!sessionId || !stage) {
      return NextResponse.json({ error: 'Missing sessionId or stage' }, { status: 400 });
    }

    // Skip DB operations for now to enable deployment
    let enne: any = null;
    // if (process.env.DB_ENABLED === 'true') {
    //   enne = await prisma.enneagramSession.findUnique({ where: { sessionId } });
    //   if (!enne) {
    //     enne = await prisma.enneagramSession.create({
    //       data: {
    //         sessionId,
    //         stage: 'screener',
    //         responses: { stage1: [], stage2: [], stage3: [], texts: [] },
    //         typeScores: {},
    //       },
    //     });
    //   }
    // }

    let nextStage: Stage = stage as Stage;
    let progress = 0;

    if (stage === 'screener') {
      const items = getScreenerItems('en');
      const totalItems = items.length; // 36

      const payload = Array.isArray(input?.items) ? input.items : [];
      const filtered = payload
        .filter((i: { itemId?: string; value?: string | number }) => typeof i?.itemId === 'string' && [1,2,3,4,5].includes(Number(i?.value)))
        .slice(0, totalItems);

      // Skip DB operations for now
      // if (process.env.DB_ENABLED === 'true') {
      //   // merge unique answers by itemId, last write wins
      //   const current = enne.responses?.stage1 ?? [];
      //   const map = new Map<string, { itemId: string; value: string | number }>();
      //   for (const r of current) map.set(r.itemId, r);
      //   for (const r of filtered) map.set(r.itemId, r);
      //   const merged = Array.from(map.values());
      //   enne = await prisma.enneagramSession.update({
      //     where: { sessionId },
      //     data: { responses: { ...enne.responses, stage1: merged } },
      //   });
      // }

      const count = (process.env.DB_ENABLED === 'true' ? enne.responses?.stage1?.length : filtered.length) || 0;
      progress = Math.min(1, count / totalItems);
      if (progress >= 1) nextStage = 'discriminators';
    }

    if (stage === 'discriminators') {
      // input: { answers: [{ itemId, choice: 'A'|'B' }] }
      const answers = Array.isArray(input?.answers) ? input.answers : [];
      let plan: Array<{ itemId: string; choice: string }> = [];
      // Skip DB operations completely for now
      // if (process.env.NODE_ENV !== 'production') {
      //   plan = enne.responses?.stage2Plan ?? [];
      //   const current = enne.responses?.stage2 ?? [];
      //   const map = new Map<string, { itemId: string; value: string | number }>();
      //   for (const r of current) map.set(r.itemId, r);
      //   for (const r of answers) {
      //     if (!r?.itemId || !['A', 'B'].includes(r?.choice)) continue;
      //     map.set(r.itemId, r);
      //   }
      //   const merged = Array.from(map.values());
      //   enne = await prisma.enneagramSession.update({
      //     where: { sessionId },
      //     data: { responses: { ...(enne.responses as any), stage2: merged } },
      //   });
      // }
      const total = plan.length || 6;
      const count = (process.env.NODE_ENV !== 'production' ? (enne.responses as any)?.stage2?.length : answers.length) || 0;
      progress = Math.max(0, Math.min(1, count / total));
      if (progress >= 1) nextStage = 'wings';
      // if (process.env.DB_ENABLED === 'true') {
      //   await prisma.enneagramSession.update({ where: { sessionId }, data: { stage: nextStage } });
      // }
    }

    if (stage === 'wings') {
      // instincts Likert: input { items: [{ itemId, value:1..5 }] }
      const payload = Array.isArray(input?.items) ? input.items : [];
      const validIds = new Set(getInstinctItems(locale).map((i) => i.id));
      const filtered = payload.filter((i: any) => validIds.has(i?.itemId) && [1, 2, 3, 4, 5].includes(Number(i?.value)));
      // if (process.env.DB_ENABLED === 'true') {
      //   const current = (enne.responses as any)?.stage3 ?? [];
      //   const map = new Map<string, { itemId: string; value: string | number }>();
      //   for (const r of current) map.set(r.itemId, r);
      //   for (const r of filtered) map.set(r.itemId, r);
      //   const merged = Array.from(map.values());
      //   enne = await prisma.enneagramSession.update({
      //     where: { sessionId },
      //     data: { responses: { ...(enne.responses as any), stage3: merged } },
      //   });
      // }
      const total = 12;
      const count = (process.env.DB_ENABLED === 'true' ? (enne.responses as any)?.stage3?.length : filtered.length) || 0;
      progress = Math.max(0, Math.min(1, count / total));
      if (progress >= 1) nextStage = 'narrative';
      // if (process.env.NODE_ENV !== 'production') {
      //   await prisma.enneagramSession.update({ where: { sessionId }, data: { stage: nextStage } });
      // }
    }

    if (stage === 'narrative') {
      // input: { texts: [promptA, promptB] }
      const texts = Array.isArray(input?.texts) ? input.texts.slice(0, 2) : [];
      // if (process.env.DB_ENABLED === 'true') {
      //   const current = (enne.responses as any)?.texts ?? [];
      //   const merged = [...current];
      //   texts.forEach((t, idx) => (merged[idx] = String(t)));
      //   await prisma.enneagramSession.update({ where: { sessionId }, data: { responses: { ...(enne.responses as any), texts: merged }, stage: 'complete' } });
      // }
      nextStage = 'complete';
      progress = 1;
    }

    return NextResponse.json({ nextStage, progress });
  } catch (e) {
    console.error('enneagram/answer error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
