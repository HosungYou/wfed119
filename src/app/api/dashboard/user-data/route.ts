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
    const userEmail = session.user.email;
    const userName = session.user.name;
    const userImage = session.user.image;

    // Fetch user data from current schema
    const [sessions, valueResults, strengths] = await Promise.all([
      // Get all sessions (from Session table)
      prisma.session.findMany({
        include: {
          conversations: {
            select: {
              role: true,
              content: true,
              timestamp: true
            },
            orderBy: { timestamp: 'desc' }
          },
          strengths: {
            select: {
              category: true,
              name: true,
              confidence: true,
              evidence: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Get value results for this user
      prisma.valueResult.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      }),

      // Get all strengths
      prisma.strength.findMany({
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Filter user's strengths by looking for sessions that might belong to them
    const userStrengths = strengths.filter(s =>
      sessions.some(session => session.sessionId === s.sessionId)
    );

    // Process and structure the data
    const dashboard = {
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        image: userImage,
        createdAt: new Date().toISOString(), // Fallback since no user table
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.completed).length
      },

      modules: {
        strengths: {
          sessions: sessions.filter(s => s.strengths.length > 0),
          latestStrengths: userStrengths.slice(0, 10),
          completed: userStrengths.length > 0
        },

        values: {
          terminal: valueResults.find(v => v.valueSet === 'terminal'),
          instrumental: valueResults.find(v => v.valueSet === 'instrumental'),
          work: valueResults.find(v => v.valueSet === 'work'),
          completed: valueResults.length >= 3
        },

        enneagram: {
          sessions: [],
          completed: false
        },

        career: {
          sessions: [],
          completed: false
        }
      },

      insights: {
        strengthSummary: aggregateStrengths(userStrengths),
        valueSummary: summarizeValues(valueResults),
        completionRate: calculateCompletionRate(sessions, valueResults, userStrengths)
      },

      adminAccess: false // No role system in current schema
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
function aggregateStrengths(strengths: any[]) {
  const strengthMap = new Map();

  strengths.forEach((strength: any) => {
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

function calculateCompletionRate(sessions: any[], valueResults: any[], strengths: any[]) {
  const totalPossible = 2; // Current available modules: strengths + values
  let completed = 0;

  if (strengths.length > 0) completed++; // Has strengths
  if (valueResults.length >= 1) completed++; // Has at least one value set

  return (completed / totalPossible) * 100;
}