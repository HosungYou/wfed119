import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    const supabase = createServerSupabaseClient();

    // TODO: Implement Enneagram export with Supabase
    // This requires enneagram_sessions table implementation
    return NextResponse.json({
      message: 'Enneagram export - Supabase implementation pending',
      sessionId
    });

    // const payload = {
    //   primaryType: enne.primaryType ?? null,
    //   typeProbabilities: enne.typeScores ?? {},
    //   confidence: enne.confidence ?? null,
    //   likelyWing: enne.wingEstimate ?? null,
    //   dominantInstinct: enne.instinct ?? null,
    //   aiEvidence: (enne.aiEvidence as any) ?? [],
    //   notes: 'neutral summary',
    //   version: '1.0',
    // };

    // // Save export artifact for traceability
    // await prisma.exportArtifact.create({
    //   data: {
    //     sessionId,
    //     kind: 'enneagram-profile',
    //     content: payload as any,
    //     format: 'json',
    //   },
    // });

    // return NextResponse.json(payload);
  } catch (e) {
    console.error('enneagram/export error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
