import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all user data in parallel
    const [user, userSessions, valueResults, analysisResults] = await Promise.all([
      // Get user info with role
      prisma.user.findUnique({
        where: { googleId: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          createdAt: true
        }
      }),

      // Get all user sessions
      prisma.userSession.findMany({
        where: {
          user: { googleId: userId }
        },
        include: {
          strengths: {
            select: {
              category: true,
              name: true,
              confidence: true
            }
          },
          _count: {
            select: { conversations: true }
          }
        },
        orderBy: { startedAt: 'desc' }
      }),

      // Get value results
      prisma.valueResult.findMany({
        where: {
          user: { googleId: userId }
        },
        orderBy: { updatedAt: 'desc' }
      }),

      // Get analysis results
      prisma.analysisResult.findMany({
        where: {
          user: { googleId: userId }
        },
        orderBy: { generatedAt: 'desc' },
        take: 5
      })
    ]);

    // Process and structure the data
    const dashboard = {
      user: {
        ...user,
        totalSessions: userSessions.length,
        completedSessions: userSessions.filter(s => s.completed).length
      },

      modules: {
        strengths: {
          sessions: userSessions.filter(s => s.sessionType === 'strengths'),
          latestStrengths: userSessions
            .filter(s => s.sessionType === 'strengths' && s.strengths.length > 0)
            .slice(0, 1)[0]?.strengths || [],
          completed: userSessions.some(s => s.sessionType === 'strengths' && s.completed)
        },

        values: {
          terminal: valueResults.find(v => v.valueSet === 'terminal'),
          instrumental: valueResults.find(v => v.valueSet === 'instrumental'),
          work: valueResults.find(v => v.valueSet === 'work'),
          completed: valueResults.length === 3
        },

        enneagram: {
          sessions: userSessions.filter(s => s.sessionType === 'enneagram'),
          completed: userSessions.some(s => s.sessionType === 'enneagram' && s.completed)
        },

        career: {
          sessions: userSessions.filter(s => s.sessionType === 'career'),
          completed: userSessions.some(s => s.sessionType === 'career' && s.completed)
        }
      },

      insights: {
        recentAnalyses: analysisResults,
        strengthSummary: aggregateStrengths(userSessions),
        valueSummary: summarizeValues(valueResults),
        completionRate: calculateCompletionRate(userSessions, valueResults)
      },

      adminAccess: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    };

    return NextResponse.json(dashboard);

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// Helper functions
function aggregateStrengths(sessions: any[]) {
  const strengthMap = new Map();

  sessions.forEach(session => {
    session.strengths.forEach((strength: any) => {
      const key = `${strength.category}:${strength.name}`;
      if (!strengthMap.has(key)) {
        strengthMap.set(key, {
          category: strength.category,
          name: strength.name,
          occurrences: 0,
          avgConfidence: 0
        });
      }
      const item = strengthMap.get(key);
      item.occurrences++;
      item.avgConfidence = (item.avgConfidence + strength.confidence) / 2;
    });
  });

  return Array.from(strengthMap.values())
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 10);
}

function summarizeValues(valueResults: any[]) {
  const summary = {
    terminal: [],
    instrumental: [],
    work: []
  };

  valueResults.forEach(result => {
    if (result.top3) {
      summary[result.valueSet as keyof typeof summary] = result.top3;
    }
  });

  return summary;
}

function calculateCompletionRate(sessions: any[], valueResults: any[]) {
  const totalPossible = 4; // 4 main modules
  let completed = 0;

  if (sessions.some(s => s.sessionType === 'strengths' && s.completed)) completed++;
  if (valueResults.length === 3) completed++; // All 3 value sets
  if (sessions.some(s => s.sessionType === 'enneagram' && s.completed)) completed++;
  if (sessions.some(s => s.sessionType === 'career' && s.completed)) completed++;

  return (completed / totalPossible) * 100;
}