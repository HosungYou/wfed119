import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, stage, messages, strengths } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const authSession = await getServerSession(authOptions);
    const userGoogleId = authSession?.user?.id ?? null;
    const userEmail = authSession?.user?.email ?? null;
    const userName = authSession?.user?.name ?? null;

    const normalizedStage = typeof stage === 'string' && stage ? stage : 'initial';
    const isCompleted = normalizedStage === 'summary';

    let linkedUserId: string | null = null;

    if (userGoogleId) {
      const existingUser = await prisma.user.findUnique({ where: { googleId: userGoogleId } });
      if (existingUser) {
        linkedUserId = existingUser.id;
        await prisma.userSession.upsert({
          where: { sessionId },
          update: {
            currentStage: normalizedStage,
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : null,
            metadata: {
              module: 'strengths',
              lastUpdated: new Date().toISOString(),
            },
          },
          create: {
            userId: existingUser.id,
            sessionId,
            sessionType: 'strengths',
            currentStage: normalizedStage,
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : null,
            metadata: {
              module: 'strengths',
              lastUpdated: new Date().toISOString(),
            },
          },
        });
      }
    }

    if (!linkedUserId) {
      await prisma.session.upsert({
        where: { sessionId },
        update: {
          currentStage: normalizedStage,
          updatedAt: new Date(),
          completed: isCompleted,
          userGoogleId: userGoogleId ?? undefined,
          userEmail: userEmail ?? undefined,
          userName: userName ?? undefined,
        },
        create: {
          sessionId,
          currentStage: normalizedStage,
          completed: isCompleted,
          userGoogleId: userGoogleId ?? undefined,
          userEmail: userEmail ?? undefined,
          userName: userName ?? undefined,
        },
      });
    }

    if (messages && Array.isArray(messages)) {
      await prisma.conversation.deleteMany({ where: { sessionId } });

      if (messages.length > 0) {
        const nowIso = new Date().toISOString();
        await prisma.conversation.createMany({
          data: messages.map((message: { role: string; content: string; timestamp?: string }, index: number) => ({
            sessionId,
            role: message.role,
            content: message.content,
            metadata: JSON.stringify({
              timestamp: message.timestamp || nowIso,
              messageIndex: index,
              stage: normalizedStage,
            }),
          })),
        });
      }
    }

    const normalisedStrengths = {
      skills: Array.isArray(strengths?.skills) ? strengths.skills : [],
      attitudes: Array.isArray(strengths?.attitudes) ? strengths.attitudes : [],
      values: Array.isArray(strengths?.values) ? strengths.values : [],
    };

    if (
      normalisedStrengths.skills.length ||
      normalisedStrengths.attitudes.length ||
      normalisedStrengths.values.length
    ) {
      await prisma.strength.deleteMany({ where: { sessionId } });

      const timestamp = new Date().toISOString();
      const strengthPromises: Promise<unknown>[] = [];

      for (const [category, items] of Object.entries(normalisedStrengths)) {
        for (const item of items) {
          strengthPromises.push(
            prisma.strength.create({
              data: {
                sessionId,
                category,
                name: item,
                evidence: `Recorded via Strengths module at ${timestamp}`,
                confidence: 0.8,
                userGoogleId: userGoogleId ?? undefined,
                userEmail: userEmail ?? undefined,
                userName: userName ?? undefined,
              },
            }),
          );
        }
      }

      if (strengthPromises.length > 0) {
        await Promise.all(strengthPromises);
      }

      const summarySegments: string[] = [];
      if (normalisedStrengths.skills.length) {
        summarySegments.push(`Skills ▸ ${normalisedStrengths.skills.slice(0, 3).join(', ')}`);
      }
      if (normalisedStrengths.attitudes.length) {
        summarySegments.push(`Attitudes ▸ ${normalisedStrengths.attitudes.slice(0, 3).join(', ')}`);
      }
      if (normalisedStrengths.values.length) {
        summarySegments.push(`Values ▸ ${normalisedStrengths.values.slice(0, 3).join(', ')}`);
      }

      const profileInsights = {
        topPicks: {
          skill: normalisedStrengths.skills[0] ?? null,
          attitude: normalisedStrengths.attitudes[0] ?? null,
          value: normalisedStrengths.values[0] ?? null,
        },
        counts: {
          skills: normalisedStrengths.skills.length,
          attitudes: normalisedStrengths.attitudes.length,
          values: normalisedStrengths.values.length,
        },
        stage: normalizedStage,
        completed: isCompleted,
        updatedAt: new Date().toISOString(),
      } as const;

      await prisma.strengthProfile.upsert({
        where: { sessionKey: sessionId },
        update: {
          userId: linkedUserId ?? undefined,
          userEmail: userEmail ?? undefined,
          strengths: normalisedStrengths,
          summary: summarySegments.join(' | ') || null,
          insights: profileInsights,
        },
        create: {
          sessionKey: sessionId,
          userId: linkedUserId ?? undefined,
          userEmail: userEmail ?? undefined,
          strengths: normalisedStrengths,
          summary: summarySegments.join(' | ') || null,
          insights: profileInsights,
        },
      });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Session saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session Save API Error:', error);

    return NextResponse.json(
      { error: 'Failed to save session. Please try again.' },
      { status: 500 }
    );
  }
}
