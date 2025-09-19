import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '../../../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    // Skip DB operations for now to enable deployment
    // if (process.env.DB_ENABLED !== 'true') {
    //   return NextResponse.json({ error: 'Database not enabled (set DB_ENABLED=true)' }, { status: 503 });
    // }

    // const enne = await prisma.enneagramSession.findUnique({ where: { sessionId } });
    // if (!enne) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    
    // Return mock data for now
    return NextResponse.json({ 
      message: 'Enneagram scoring temporarily disabled for deployment', 
      sessionId 
    });
  } catch (e) {
    console.error('enneagram/score error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
