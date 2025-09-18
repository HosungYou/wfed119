import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type ValueSet = 'terminal' | 'instrumental' | 'work';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get('user_id') || searchParams.get('userId');
    const set = (searchParams.get('set') as ValueSet | null);

    if (!userId) {
      const session = await getServerSession(authOptions as any);
      userId = (session as any)?.user?.id || (session as any)?.user?.email || undefined;
    }

    if (!userId || !set) {
      return NextResponse.json({ error: 'Missing user_id and set' }, { status: 400 });
    }

    const latest = await prisma.valueResult.findFirst({
      where: { userId, valueSet: set },
      orderBy: { updatedAt: 'desc' },
    });

    if (!latest) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({
      exists: true,
      userId: latest.userId,
      set: latest.valueSet,
      layout: latest.layout,
      top3: latest.top3,
      updatedAt: latest.updatedAt,
    });
  } catch (err) {
    console.error('GET /api/discover/values/results error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const set = body.set as ValueSet | undefined;
    const layout = body.layout;
    const top3 = body.top3 as string[] | undefined;

    let uid = body.user_id || body.userId;
    if (!uid) {
      const session = await getServerSession(authOptions as any);
      uid = (session as any)?.user?.id || (session as any)?.user?.email;
    }

    if (!uid || !set || !layout) {
      return NextResponse.json({ error: 'Missing user identity, set, or layout' }, { status: 400 });
    }

    const saved = await prisma.valueResult.upsert({
      where: {
        // Use composite unique constraint to uniquely identify a record per user+set
        userId_valueSet: { userId: uid, valueSet: set },
      },
      update: {
        layout,
        top3: Array.isArray(top3) ? top3 : [],
        updatedAt: new Date(),
      },
      create: {
        userId: uid,
        valueSet: set,
        layout,
        top3: Array.isArray(top3) ? top3 : [],
      },
    });

    return NextResponse.json({ success: true, id: saved.id });
  } catch (err) {
    console.error('POST /api/discover/values/results error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
