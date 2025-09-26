import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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

    // Fetch database statistics
    const [
      userCount,
      adminCount,
      sessionCount,
      completedSessionCount,
      valueResultCount,
      strengthCount,
      conversationCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
      prisma.session.count(),
      prisma.session.count({ where: { completed: true } }),
      prisma.valueResult.count(),
      prisma.strength.count(),
      prisma.conversation.count()
    ]);

    // Count value results by type
    const valuesByType = await prisma.valueResult.groupBy({
      by: ['valueSet'],
      _count: true
    });

    const valueTypeMap = valuesByType.reduce((acc, item) => {
      acc[item.valueSet] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Count unique strengths
    const uniqueStrengths = await prisma.strength.findMany({
      distinct: ['name'],
      select: { name: true }
    });

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

    // Active sessions (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeSessionCount = await prisma.session.count({
      where: {
        updatedAt: { gte: oneDayAgo },
        completed: false
      }
    });

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