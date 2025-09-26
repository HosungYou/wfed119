import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  emptyLayout,
  normalizeTop3,
  parseLayout,
  type ValueLayout,
  type ValueSet,
} from '../layout-utils';

const valueSets: ValueSet[] = ['terminal', 'instrumental', 'work'];

const resolveUserId = async (explicitId?: string): Promise<string | undefined> => {
  if (explicitId) return explicitId;
  const session = await getServerSession(authOptions);
  return session?.user?.id || session?.user?.email || undefined;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get('user_id') || searchParams.get('userId') || undefined;
    const userId = await resolveUserId(queryUserId);
    if (!userId) return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });

    const rows = await prisma.valueResult.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        valueSet: true,
        layout: true,
        top3: true,
        insights: true,
        moduleVersion: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
    });

    const latestBySet: Record<ValueSet, { layout: ValueLayout; top3: string[]; updatedAt: string; insights: unknown; moduleVersion: string | null } | null> = {
      terminal: null,
      instrumental: null,
      work: null,
    };
    for (const set of valueSets) {
      const record = rows.find((row) => row.valueSet === set);
      if (!record) continue;
      const layout = parseLayout(record.layout) ?? emptyLayout;
      const top3 = normalizeTop3(record.top3);
      latestBySet[set] = {
        layout,
        top3,
        updatedAt: record.updatedAt.toISOString(),
        insights: record.insights ?? null,
        moduleVersion: record.moduleVersion ?? null,
      };
    }

    return NextResponse.json({ userId, results: latestBySet });
  } catch (err) {
    console.error('GET /api/discover/values/results/all error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
