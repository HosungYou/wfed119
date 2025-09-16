import { NextRequest, NextResponse } from 'next/server';
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

    // Skip database operations in production
    if (process.env.NODE_ENV !== 'production') {
      // Upsert session record
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