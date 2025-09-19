import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  emptyLayout,
  isValueLayout,
  normalizeTop3,
  parseLayout,
  type ValueLayout,
  type ValueSet,
} from './layout-utils';

const resolveUserId = async (explicitId?: string): Promise<string | undefined> => {
  if (explicitId) return explicitId;
  const session = await getServerSession(authOptions);
  return session?.user?.id || session?.user?.email || undefined;
};

interface SaveRequestBody {
  user_id?: unknown;
  userId?: unknown;
  set?: unknown;
  layout?: unknown;
  top3?: unknown;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const setParam = searchParams.get('set');
    const set = (setParam === 'terminal' || setParam === 'instrumental' || setParam === 'work') ? setParam : null;

    const queryUserId = searchParams.get('user_id') || searchParams.get('userId') || undefined;
    const userId = await resolveUserId(queryUserId || undefined);

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

    const layout = parseLayout(latest.layout) ?? emptyLayout;
    const top3 = normalizeTop3(latest.top3);

    return NextResponse.json({
      exists: true,
      userId: latest.userId,
      set: latest.valueSet,
      layout,
      top3,
      updatedAt: latest.updatedAt,
    });
  } catch (err) {
    console.error('GET /api/discover/values/results error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveRequestBody;
    const set = body.set;
    const valueSet: ValueSet | null =
      set === 'terminal' || set === 'instrumental' || set === 'work' ? set : null;
    const layout: ValueLayout | null = isValueLayout(body.layout) ? body.layout : null;
    const top3Array = normalizeTop3(body.top3);

    const explicitUser = typeof body.user_id === 'string' ? body.user_id : typeof body.userId === 'string' ? body.userId : undefined;
    const uid = await resolveUserId(explicitUser);

    if (!uid || !valueSet || !layout) {
      return NextResponse.json({ error: 'Missing user identity, set, or layout' }, { status: 400 });
    }

    const saved = await prisma.$transaction(async (tx) => {
      const existing = await tx.valueResult.findMany({
        where: { userId: uid, valueSet },
        orderBy: { updatedAt: 'desc' },
      });

      const [latest, ...duplicates] = existing;

      if (duplicates.length > 0) {
        // Legacy saves could leave multiple rows per user/set; collapse them here.
        await tx.valueResult.deleteMany({
          where: { id: { in: duplicates.map((record) => record.id) } },
        });
      }

      if (latest) {
        return tx.valueResult.update({
          where: { id: latest.id },
          data: { layout, top3: top3Array },
        });
      }

      return tx.valueResult.create({
        data: {
          userId: uid,
          valueSet,
          layout,
          top3: top3Array,
        },
      });
    });

    return NextResponse.json({ success: true, id: saved.id });
  } catch (err) {
    console.error('POST /api/discover/values/results error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
