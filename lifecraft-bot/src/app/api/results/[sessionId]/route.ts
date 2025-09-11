import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  context: { params: { sessionId: string } }
) {
  try {
    const sessionId = context.params.sessionId;
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    if (process.env.DB_ENABLED !== 'true') {
      return NextResponse.json({ error: 'Database not enabled (set DB_ENABLED=true)' }, { status: 503 });
    }

    const strengths = await prisma.strength.findMany({ where: { sessionId } });
    const skills = strengths.filter((s) => s.category === 'skill').map((s) => s.name);
    const attitudes = strengths.filter((s) => s.category === 'attitude').map((s) => s.name);
    const values = strengths.filter((s) => s.category === 'value').map((s) => s.name);

    // const enne = await prisma.enneagramSession.findUnique({ where: { sessionId } });
    const enne = null; // Disabled for deployment

    const response = {
      strengths: { skills, attitudes, values },
      enneagram: null, // Disabled for deployment
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error('results GET error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
