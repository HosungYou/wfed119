import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

type SessionWhere = {
  completed?: boolean;
  updatedAt?: { gte?: Date };
};

type SessionDelegate = {
  count: (args?: { where?: SessionWhere }) => Promise<number>;
};

function resolveSessionDelegate(): SessionDelegate | null {
  const client = prisma as unknown as Record<string, unknown>;
  const primary = client.session as SessionDelegate | undefined;
  if (primary?.count) return primary;
  const fallback = client.userSession as SessionDelegate | undefined;
  if (fallback?.count) return fallback;
  return null;
}

async function checkSuperAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { googleId: userId },
    select: { role: true }
  });
  return user?.role === 'SUPER_ADMIN';
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const [
      userCount,
      adminCount,
      valueResultCount,
      strengthCount,
      conversationCount,
      valuesByType,
      uniqueStrengths
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      prisma.valueResult.count(),
      prisma.strength.count(),
      prisma.conversation.count(),
      prisma.valueResult.groupBy({ by: ['valueSet'], _count: true }),
      prisma.strength.findMany({ distinct: ['name'], select: { name: true } })
    ]);

    const sessionDelegate = resolveSessionDelegate();
    let sessionCount = 0;
    let completedSessionCount = 0;
    let activeSessionCount = 0;

    if (sessionDelegate) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      [sessionCount, completedSessionCount, activeSessionCount] = await Promise.all([
        sessionDelegate.count(),
        sessionDelegate.count({ where: { completed: true } }),
        sessionDelegate.count({ where: { completed: false, updatedAt: { gte: oneDayAgo } } })
      ]);
    }

    const valueTypeMap = valuesByType.reduce((acc, item) => {
      acc[item.valueSet] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate storage (for SQLite)
    let storageInfo = { used: '0 MB', limit: '500 MB', percentage: 0 };

    try {
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        storageInfo = {
          used: `${sizeInMB} MB`,
          limit: '500 MB',
          percentage: Math.round((parseFloat(sizeInMB) / 500) * 100)
        };
      }
    } catch (e) {
      console.error('Storage calculation error:', e);
    }

    // Check for last backup
    let lastBackup = null;
    const backupDir = path.join(process.cwd(), 'backup');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      const backupFiles = files.filter(f => f.endsWith('.db'));
      if (backupFiles.length > 0) {
        const latestBackup = backupFiles.sort().pop();
        if (latestBackup) {
          const backupPath = path.join(backupDir, latestBackup);
          const stats = fs.statSync(backupPath);
          lastBackup = stats.mtime;
        }
      }
    }

    return NextResponse.json({
      users: {
        total: userCount,
        admins: adminCount,
        active: activeSessionCount
      },
      sessions: {
        total: sessionCount,
        completed: completedSessionCount,
        active: activeSessionCount
      },
      values: {
        total: valueResultCount,
        byType: valueTypeMap
      },
      strengths: {
        total: strengthCount,
        unique: uniqueStrengths.length
      },
      conversations: conversationCount,
      storage: storageInfo,
      lastBackup
    });

  } catch (error) {
    console.error('Database stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}
