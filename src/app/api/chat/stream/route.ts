import { NextRequest, NextResponse } from 'next/server';
import { AIService, SessionContext } from '@/lib/services/aiServiceClaude';

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

    // Check if we should progress to next stage
    const progressionCheck = await aiService.shouldProgressStage(messages, (stage as SessionContext['stage']) || 'initial');
    let currentStage = (stage as SessionContext['stage']) || 'initial';
    
    if (progressionCheck.shouldProgress && progressionCheck.nextStage) {
      currentStage = progressionCheck.nextStage;
    }

    // Build session context
    const sessionContext: SessionContext = {
      stage: currentStage,
      messageCount: messages.length,
      extractedThemes: context?.themes || []
    };

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          const metadata = {
            type: 'metadata',
            stage: currentStage,
            sessionId: sessionId
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));

          // Stream AI response
          for await (const chunk of aiService.generateStreamingResponse(messages, sessionContext)) {
            fullResponse += chunk;
            const data = {
              type: 'content',
              content: chunk
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          }

          // Handle strength analysis for summary stage
          if (currentStage === 'summary' && messages.length >= 8) {
            try {
              const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
              const strengths = await aiService.analyzeStrengths(conversationHistory);
              
              const strengthsData = {
                type: 'strengths',
                strengths: strengths
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(strengthsData)}\n\n`));
            } catch (error) {
              console.error('Strength analysis error in streaming:', error);
              // Send fallback strengths
              const fallbackStrengths = {
                skills: ['Problem-solving', 'Communication', 'Leadership', 'Facilitation', 'Mentorship', 'Team-building'],
                attitudes: ['Persistence', 'Curiosity', 'Collaboration', 'Empathetic', 'Patient', 'Encouraging'],
                values: ['Excellence', 'Impact', 'Growth', 'Trust', 'Inclusivity', 'Empowerment']
              };
              const strengthsData = {
                type: 'strengths',
                strengths: fallbackStrengths
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(strengthsData)}\n\n`));
            }
          }

          // Send completion signal
          const completion = {
            type: 'complete',
            fullResponse: fullResponse,
            stage: currentStage
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`));
          
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = {
            type: 'error',
            error: 'Failed to generate response'
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}