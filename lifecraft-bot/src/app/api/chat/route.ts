import { NextRequest, NextResponse } from 'next/server';
import { AIService, SessionContext } from '@/lib/services/aiServiceClaude';
import { prisma } from '@/lib/prisma';

const aiService = new AIService();

export async function POST(req: NextRequest) {
  try {
    const { sessionId, messages, stage, context } = await req.json();
    
    // Validate required fields
    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, messages' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // Use env flag to enable DB writes when configured (Render/Postgres)
    if (process.env.DB_ENABLED === 'true') {
      // Ensure session exists in database
      let session = await prisma.session.findUnique({
        where: { sessionId }
      });

      if (!session) {
        session = await prisma.session.create({
          data: {
            sessionId,
            currentStage: stage || 'initial',
            completed: false
          }
        });
      }
    }

    // Check if we should progress to next stage BEFORE generating response
    const progressionCheck = await aiService.shouldProgressStage(messages, (stage as SessionContext['stage']) || 'initial');
    let currentStage = (stage as SessionContext['stage']) || 'initial';
    
    if (progressionCheck.shouldProgress && progressionCheck.nextStage) {
      currentStage = progressionCheck.nextStage;
      
      // Update session stage in database when DB enabled
      if (process.env.DB_ENABLED === 'true') {
        await prisma.session.update({
          where: { sessionId },
          data: { 
            currentStage: currentStage,
            updatedAt: new Date()
          }
        });
      }
    }

    // Build session context with updated stage
    const sessionContext: SessionContext = {
      stage: currentStage,
      messageCount: messages.length,
      extractedThemes: context?.themes || []
    };

    // Generate AI response with correct stage
    const response = await aiService.generateResponse(messages, sessionContext);
    
    // Save both user and assistant messages to database when DB enabled
    if (process.env.DB_ENABLED === 'true') {
      await prisma.conversation.createMany({
        data: [
          {
            sessionId,
            role: 'user',
            content: lastMessage.content,
            metadata: JSON.stringify({ 
              timestamp: new Date().toISOString(),
              messageIndex: messages.length - 1
            })
          },
          {
            sessionId,
            role: 'assistant',
            content: response,
            metadata: JSON.stringify({ 
              timestamp: new Date().toISOString(),
              messageIndex: messages.length,
              stage: currentStage
            })
          }
        ]
      });
    }

    let strengths = null;

    // If we've reached summary stage, analyze strengths
    if (currentStage === 'summary' && messages.length >= 8) {
      console.log('Summary stage reached, analyzing strengths...', {
        stage: currentStage,
        messageCount: messages.length
      });
      try {
        const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        strengths = await aiService.analyzeStrengths(conversationHistory);
        console.log('Strengths analysis completed:', strengths);
        
        if (strengths && process.env.DB_ENABLED === 'true') {
          // Clear existing strengths for this session
          await prisma.strength.deleteMany({
            where: { sessionId }
          });

          // Save new strength analysis
          const strengthPromises = [];
          
          for (const [category, items] of Object.entries(strengths)) {
            for (const item of items as string[]) {
              strengthPromises.push(
                prisma.strength.create({
                  data: {
                    sessionId,
                    category,
                    name: item,
                    evidence: conversationHistory,
                    confidence: 0.8
                  }
                })
              );
            }
          }
          
          await Promise.all(strengthPromises);
        }
      } catch (error) {
        console.error('Error analyzing strengths:', error);
        // Provide fallback strengths if analysis fails
        strengths = {
          skills: ['Problem-solving', 'Communication', 'Leadership', 'Facilitation', 'Mentorship', 'Team-building'],
          attitudes: ['Persistence', 'Curiosity', 'Collaboration', 'Empathetic', 'Patient', 'Encouraging'],
          values: ['Excellence', 'Impact', 'Growth', 'Trust', 'Inclusivity', 'Empowerment']
        };
      }
    }

    // Mark session as completed if we've reached summary when DB enabled
    if (currentStage === 'summary' && process.env.DB_ENABLED === 'true') {
      await prisma.session.update({
        where: { sessionId },
        data: { completed: true }
      });
    }

    return NextResponse.json({
      response,
      stage: currentStage,
      strengths,
      metadata: {
        progressionReason: progressionCheck.reason,
        messageCount: messages.length + 1,
        sessionStage: currentStage
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error. Please check API keys.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
