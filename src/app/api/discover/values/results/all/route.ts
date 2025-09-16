import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get('user_id') || searchParams.get('userId');
    if (!userId) {
      const session = await getServerSession(authOptions as any);
      userId = (session as any)?.user?.id || (session as any)?.user?.email || undefined;
    }
    if (!userId) return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });

    const rows = await prisma.valueResult.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const latestBySet: Record<string, { layout: any; top3: string[]; updatedAt: string } | null> = {
      terminal: null,
      instrumental: null,
      work: null,
    };
    for (const set of ['terminal','instrumental','work'] as const) {
      const r = rows.find(x => x.valueSet === set);
      if (r) latestBySet[set] = { layout: r.layout as any, top3: r.top3, updatedAt: r.updatedAt.toISOString() };
    }

    return NextResponse.json({ userId, results: latestBySet });
  } catch (err) {
    console.error('GET /api/discover/values/results/all error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
