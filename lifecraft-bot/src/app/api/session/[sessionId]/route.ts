import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Find the session
    const session = await prisma.session.findUnique({
      where: { sessionId },
      include: {
        conversations: {
          orderBy: { timestamp: 'asc' }
        },
        strengths: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Transform conversations back to chat messages format
    const messages = session.conversations.map(conv => ({
      role: conv.role,
      content: conv.content,
      timestamp: conv.timestamp.toISOString()
    }));

    // Transform strengths back to categorized format
    const strengths = {
      skills: session.strengths
        .filter(s => s.category === 'skills')
        .map(s => s.name),
      attitudes: session.strengths
        .filter(s => s.category === 'attitudes')
        .map(s => s.name),
      values: session.strengths
        .filter(s => s.category === 'values')
        .map(s => s.name)
    };

    return NextResponse.json({
      sessionId: session.sessionId,
      stage: session.currentStage,
      completed: session.completed,
      messages,
      strengths,
      metadata: {
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messageCount: messages.length,
        strengthCount: session.strengths.length
      }
    });

  } catch (error) {
    console.error('Session Load API Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to load session. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Delete all related data first (due to foreign key constraints)
    await prisma.conversation.deleteMany({
      where: { sessionId }
    });

    await prisma.strength.deleteMany({
      where: { sessionId }
    });

    // Delete the session itself
    await prisma.session.delete({
      where: { sessionId }
    });

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
      sessionId
    });

  } catch (error) {
    console.error('Session Delete API Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete session. Please try again.' },
      { status: 500 }
    );
  }
}
