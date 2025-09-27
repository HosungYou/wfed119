import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '../prompts/systemPrompt';

// Initialize OpenAI client only when API key is available (skip during build)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface SessionContext {
  stage: 'initial' | 'exploration' | 'deepening' | 'analysis' | 'summary';
  messageCount: number;
  extractedThemes?: string[];
}

export interface StrengthAnalysis {
  skills: string[];
  attitudes: string[];
  values: string[];
}

export class AIService {
  async generateResponse(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): Promise<string> {
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check your API key.');
    }
    
    try {
      const contextualPrompt = this.buildContextualPrompt(sessionContext);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextualPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_completion_tokens: 600, // Reduced again for Vercel limits
      }, {
        timeout: 6000, // Maximum safe timeout for Vercel
      });

      return completion.choices[0].message.content || 'I apologize, but I encountered an issue generating a response. Could you please try again?';
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate AI response. Please check your OpenAI API key and try again.');
    }
  }

  async *generateStreamingResponse(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): AsyncGenerator<string, void, unknown> {
    if (!openai) {
      yield 'OpenAI client not initialized. Please check your API key configuration.';
      return;
    }
    
    try {
      const contextualPrompt = this.buildContextualPrompt(sessionContext);
      
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextualPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_completion_tokens: 600,
        stream: true, // Enable streaming
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Streaming AI Service Error:', error);
      yield 'I apologize, but I encountered an issue generating a response. Could you please try again?';
    }
  }

  private buildContextualPrompt(context: SessionContext): string {
    const { stage, messageCount } = context;
    
    let additionalContext = `\n\nCURRENT CONTEXT:
- Conversation Stage: ${stage}
- Message Count: ${messageCount}
`;

    switch (stage) {
      case 'initial':
        additionalContext += `
- FOCUS: Elicit a meaningful story about work satisfaction
- Ask the opening question warmly and wait for their complete story
- Don't rush into analysis`;
        break;
      case 'exploration':
        additionalContext += `
- FOCUS: Acknowledge their story warmly, then ask ONE unique follow-up question
- Structure: Brief acknowledgment → Thoughtful interpretation → Encouraging observation → UNIQUE QUESTION (?)
- Avoid repetitive questions - each question should explore something new
- Examples: "What specifically made this meaningful?" "What skills came naturally?" "What values were honored?"
- CRITICAL: Must end with unique question mark (?)`;
        break;
      case 'deepening':
        additionalContext += `
- FOCUS: Continue questioning with warm engagement to uncover deeper insights
- Structure: Acknowledge their sharing → Show genuine interest → Ask thoughtful follow-up question
- Question types to explore: emotions ("How did that feel?"), examples ("Tell me about another time..."), connections ("How does this relate to your values?")
- Build on what they've shared - reference their specific words and experiences
- Maintain curiosity and warmth throughout
- Each question should explore a different dimension from previous ones
- CRITICAL: Must end with exactly one question mark (?)`;
        break;
      case 'analysis':
        additionalContext += `
- FOCUS: Question while categorizing patterns, avoid repetitive inquiries
- Ask varied questions: skill applications, attitude consistency, value conflicts, pattern recognition
- Each question should explore a different aspect from previous ones
- Begin organizing themes while still questioning
- CRITICAL: Must end with unique question mark (?)`;
        break;
      case 'summary':
        additionalContext += `
- FOCUS: Provide comprehensive strength summary and future connections
- CRITICAL: DO NOT end with a question - provide definitive report/wrap-up
- Structure: Strength summary → Career connections → Encouragement → Definitive closing
- This is the final report stage - be comprehensive and conclusive
- End with hope and agency reinforcement`;
        break;
    }

    return additionalContext;
  }

  async analyzeStrengths(conversation: string): Promise<StrengthAnalysis> {
    if (!openai) {
      throw new Error('OpenAI client not initialized. Please check your API key.');
    }
    
    const analysisPrompt = `Extract strengths from this conversation. Return JSON with 3 arrays:

SKILLS (max 6): Abilities, competencies
ATTITUDES (max 6): Mindsets, approaches  
VALUES (max 6): Core beliefs, principles

Rules: Clear evidence, 2-3 words each

Conversation: ${conversation.substring(0, 1500)}

Return: {"skills":["..."],"attitudes":["..."],"values":["..."]}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: 'Extract career strengths. Return valid JSON only.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_completion_tokens: 300, // Reduced for faster processing
        response_format: { type: "json_object" }
      }, {
        timeout: 5000 // Conservative timeout for Vercel
      });

      const result = completion.choices[0].message.content;
      if (!result) throw new Error('No analysis result received');
      
      return JSON.parse(result);
    } catch (error) {
      console.error('Strength Analysis Error:', error);
      // Re-throw error to be handled upstream instead of silent fallback
      throw new Error(`Strength analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async shouldProgressStage(
    messages: ChatMessage[], 
    currentStage: SessionContext['stage']
  ): Promise<{ shouldProgress: boolean; nextStage?: SessionContext['stage']; reason?: string }> {
    if (messages.length < 2) {
      return { shouldProgress: false };
    }

    const lastUserMessage = messages[messages.length - 2]; // Get user's last message (before AI response)
    const messageLength = lastUserMessage?.content?.length || 0;

    switch (currentStage) {
      case 'initial':
        // Progress if user shared a substantial story (> 100 characters)
        if (messageLength > 100) {
          return { 
            shouldProgress: true, 
            nextStage: 'exploration',
            reason: 'User shared initial story' 
          };
        }
        break;
        
      case 'exploration':
        // Progress after 2 rounds of exploration (4 messages total: user + AI + user + AI)
        if (messages.length >= 4) {
          return { 
            shouldProgress: true, 
            nextStage: 'deepening',
            reason: 'Sufficient exploration completed' 
          };
        }
        break;
        
      case 'deepening':
        // Progress after 2 rounds of deepening (total 8 messages)
        if (messages.length >= 8) {
          return { 
            shouldProgress: true, 
            nextStage: 'analysis',
            reason: 'Deep exploration completed' 
          };
        }
        break;
        
      case 'analysis':
        // Progress after 2 rounds of analysis (total 10 messages) to summary
        if (messages.length >= 10) {
          return { 
            shouldProgress: true, 
            nextStage: 'summary',
            reason: 'Ready for final synthesis' 
          };
        }
        break;
    }

    return { shouldProgress: false };
  }
}