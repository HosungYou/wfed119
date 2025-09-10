import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    if (process.env.DB_ENABLED !== 'true') {
      return NextResponse.json({ error: 'Database not enabled (set DB_ENABLED=true)' }, { status: 503 });
    }

    const enne = await prisma.enneagramSession.findUnique({ where: { sessionId } });
    if (!enne) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const payload = {
      primaryType: enne.primaryType ?? null,
      typeProbabilities: enne.typeScores ?? {},
      confidence: enne.confidence ?? null,
      likelyWing: enne.wingEstimate ?? null,
      dominantInstinct: enne.instinct ?? null,
      aiEvidence: (enne.aiEvidence as any) ?? [],
      notes: 'neutral summary',
      version: '1.0',
    };

    // Save export artifact for traceability
    await prisma.exportArtifact.create({
      data: {
        sessionId,
        kind: 'enneagram-profile',
        content: payload as any,
        format: 'json',
      },
    });

    return NextResponse.json(payload);
  } catch (e) {
    console.error('enneagram/export error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
