import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scoreStage1, primaryType as getPrimaryType, confidenceBand } from '@/lib/enneagram/scoring';
import { itemById as discItemById } from '@/lib/enneagram/discriminators';
import { scoreInstincts } from '@/lib/enneagram/instincts';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    if (process.env.DB_ENABLED !== 'true') {
      return NextResponse.json({ error: 'Database not enabled (set DB_ENABLED=true)' }, { status: 503 });
    }

    const enne = await prisma.enneagramSession.findUnique({ where: { sessionId } });
    if (!enne) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const responses = (enne.responses as any) ?? {};
    const stage1 = responses.stage1 ?? [];
    const { probabilities, raw: raw1 } = scoreStage1(stage1, 'en');

    // Stage 2: discriminators → per-item count for chosen side
    const stage2 = (responses.stage2 ?? []) as { itemId: string; choice: 'A' | 'B' }[];
    const stage2Counts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0 };
    for (const ans of stage2) {
      const it = discItemById('en', ans.itemId);
      if (!it) continue;
      const winner = ans.choice === 'A' ? it.leftType : it.rightType;
      stage2Counts[String(winner)] += 1;
    }

    // Weighted combination: Stage1 *1.0 + Stage2 *1.6
    const combinedRaw: Record<string, number> = {} as any;
    for (const t of Object.keys(raw1)) {
      combinedRaw[t] = (raw1[t] || 0) * 1.0 + (stage2Counts[t] || 0) * 1.6;
    }
    const combinedTotal = Object.values(combinedRaw).reduce((a, b) => a + b, 0) || 1;
    const typeProbabilities: Record<string, number> = {};
    for (const t of Object.keys(combinedRaw)) typeProbabilities[t] = combinedRaw[t] / combinedTotal;

    const pType = getPrimaryType(typeProbabilities);
    const conf = confidenceBand(typeProbabilities);

    // Stage 3: instincts
    const stage3 = (responses.stage3 ?? []) as { itemId: string; value: 1|2|3|4|5 }[];
    const instincts = scoreInstincts(stage3, 'en');

    // Wing estimate: pick adjacent type with higher probability
    const primaryN = Number(pType);
    const leftWingType = ((primaryN + 7) % 9) + 1; // previous type (wrap 1<-9)
    const rightWingType = (primaryN % 9) + 1; // next type (wrap 9->1)
    const leftP = typeProbabilities[String(leftWingType)] || 0;
    const rightP = typeProbabilities[String(rightWingType)] || 0;
    const likelyWing = leftP >= rightP ? `${pType}w${leftWingType}` : `${pType}w${rightWingType}`;

    await prisma.enneagramSession.update({
      where: { sessionId },
      data: {
        typeScores: typeProbabilities,
        primaryType: pType,
        confidence: conf,
        instinct: instincts.dominant,
        wingEstimate: likelyWing,
      },
    });

    return NextResponse.json({ typeProbabilities, primaryType: pType, confidence: conf, instincts, likelyWing, raw: combinedRaw });
  } catch (e) {
    console.error('enneagram/score error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
