import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, stage, messages, strengths } = await req.json();

    // Get authenticated user if available
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Save to database with user association if authenticated
      // If user is authenticated, create UserSession, otherwise use legacy Session
      if (userId) {
        // Find or create the user
        const user = await prisma.user.findUnique({
          where: { googleId: userId }
        });

        if (user) {
          await prisma.userSession.upsert({
            where: { sessionId },
            update: {
              currentStage: stage || 'initial',
              completed: stage === 'summary',
              completedAt: stage === 'summary' ? new Date() : null
            },
            create: {
              userId: user.id,
              sessionId,
              sessionType: 'strengths',
              currentStage: stage || 'initial',
              completed: stage === 'summary',
              completedAt: stage === 'summary' ? new Date() : null
            }
          });
        }
      } else {
        // Fallback to legacy Session table for unauthenticated users
        await prisma.session.upsert({
          where: { sessionId },
          update: {
            currentStage: stage || 'initial',
            updatedAt: new Date(),
            completed: stage === 'summary'
          },
          create: {
            sessionId,
            currentStage: stage || 'initial',
            completed: stage === 'summary'
          }
        });
      }

      // If messages are provided, update them
      if (messages && Array.isArray(messages)) {
        // Clear existing conversations for this session to avoid duplicates
        await prisma.conversation.deleteMany({
          where: { sessionId }
        });

        // Save all messages
        if (messages.length > 0) {
          await prisma.conversation.createMany({
            data: messages.map((message: { role: string; content: string; timestamp?: string }, index: number) => ({
              sessionId,
              role: message.role,
              content: message.content,
              metadata: JSON.stringify({
                timestamp: message.timestamp || new Date().toISOString(),
                messageIndex: index
              })
            }))
          });
        }
      }

      // If strengths are provided, update them
      if (strengths) {
        // Clear existing strengths
        await prisma.strength.deleteMany({
          where: { sessionId }
        });

        // Save new strengths
        const strengthPromises = [];
        
        for (const [category, items] of Object.entries(strengths)) {
          for (const item of items as string[]) {
            strengthPromises.push(
              prisma.strength.create({
                data: {
                  sessionId,
                  category,
                  name: item,
                  evidence: `Saved from session at ${new Date().toISOString()}`,
                  confidence: 0.8
                }
              })
            );
          }
        }
        
        if (strengthPromises.length > 0) {
          await Promise.all(strengthPromises);
        }
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