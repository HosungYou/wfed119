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

    // Simple test - check if prisma is working
    console.log('Testing Prisma connection...');

    // Test basic database connection
    let testResult;
    try {
      testResult = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('Database connection successful:', testResult);
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: dbError.message
      }, { status: 500 });
    }

    // Try to get value results only (simplest query)
    let valueResults;
    try {
      valueResults = await prisma.valueResult.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });
      console.log('ValueResult query successful:', valueResults.length);
    } catch (valueError) {
      console.error('ValueResult query failed:', valueError);
      return NextResponse.json({
        error: 'ValueResult query failed',
        details: valueError.message
      }, { status: 500 });
    }

    // Return simplified dashboard data
    const dashboard = {
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        image: userImage,
        createdAt: new Date().toISOString(),
      },

      modules: {
        strengths: {
          completed: false,
          latestStrengths: [],
        },

        values: {
          terminal: valueResults.find(v => v.valueSet === 'terminal') || null,
          instrumental: valueResults.find(v => v.valueSet === 'instrumental') || null,
          work: valueResults.find(v => v.valueSet === 'work') || null,
          completed: valueResults.length >= 3
        },

        enneagram: {
          completed: false
        },

        career: {
          completed: false
        }
      },

      insights: {
        strengthSummary: [],
        completionRate: valueResults.length > 0 ? 50 : 0
      },

      adminAccess: false
    };

    return NextResponse.json(dashboard);

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}