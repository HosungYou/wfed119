import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { buildSystemPrompt, STRENGTH_EXTRACTION_EXAMPLES } from '../prompts/systemPromptV2';

// Initialize Claude client (using Anthropic API)
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// Keep OpenAI as fallback
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
  invalidResponseCount?: number;
}

export interface StrengthAnalysis {
  skills: string[];
  attitudes: string[];
  values: string[];
  invalid?: boolean;
  reason?: string;
}

export interface ResponseValidation {
  isValid: boolean;
  reason?: string;
  shouldRedirect: boolean;
  redirectMessage?: string;
}

export class AIService {
  private validateUserResponse(message: string, stage: SessionContext['stage']): ResponseValidation {
    // Check if response is too short
    if (message.length < 30) {
      return {
        isValid: false,
        reason: 'Response too short',
        shouldRedirect: true,
        redirectMessage: "I'd love to hear more details! Could you expand on that experience? For example, what specific steps did you take, and what made it meaningful to you?"
      };
    }

    // Check if user is asking a question instead of sharing
    const questionPatterns = [
      /^(what|how|why|when|where|who|which|could|should|would|can|may|is|are|do|does|did)\s+/i,
      /\?$/,
      /^(i don't know|idk|not sure|unsure|maybe)/i,
      /^(can you|could you|will you|would you)/i
    ];

    const isQuestion = questionPatterns.some(pattern => pattern.test(message.trim()));
    if (isQuestion && stage !== 'initial') {
      return {
        isValid: false,
        reason: 'User asking questions instead of sharing',
        shouldRedirect: true,
        redirectMessage: "Your curiosity is wonderful! But first, I'd love to learn about YOUR experiences. Think of a specific time when you worked on something that engaged you. What was that experience like for you?"
      };
    }

    // Check for deflection patterns
    const deflectionPatterns = [
      /^(nothing|none|no idea|can't think|don't remember)/i,
      /^(skip|pass|next question)/i,
      /^(whatever|doesn't matter|who cares)/i
    ];

    const isDeflection = deflectionPatterns.some(pattern => pattern.test(message.trim()));
    if (isDeflection) {
      return {
        isValid: false,
        reason: 'User deflecting or avoiding',
        shouldRedirect: true,
        redirectMessage: "No pressure at all! Sometimes it helps to start small. Think about even a simple task or project where you felt a sense of accomplishment, no matter how minor it might seem. Every experience counts!"
      };
    }

    // Check for off-topic content
    const offTopicPatterns = [
      /(weather|sports team|tv show|movie|game|food|restaurant)/i,
      /(politics|news|celebrity|gossip)/i,
    ];

    const workRelatedKeywords = [
      /work|project|task|team|goal|achieve|accomplish|create|build|solve|help|learn|study|research|design|develop|write|organize|plan|manage/i
    ];

    const hasWorkContent = workRelatedKeywords.some(pattern => pattern.test(message));
    const hasOffTopic = offTopicPatterns.some(pattern => pattern.test(message));

    if (hasOffTopic && !hasWorkContent && stage !== 'initial') {
      return {
        isValid: false,
        reason: 'Off-topic response',
        shouldRedirect: true,
        redirectMessage: "That's interesting! Let's refocus on your work and project experiences though. What accomplishment, big or small, are you most proud of from the last year?"
      };
    }

    // For initial stage, require more substantial response
    if (stage === 'initial' && message.length < 100) {
      return {
        isValid: false,
        reason: 'Initial response needs more detail',
        shouldRedirect: true,
        redirectMessage: "That's a great start! Could you tell me more about that experience? I'm interested in hearing about what you did, how you approached it, and what made it satisfying for you."
      };
    }

    return {
      isValid: true,
      shouldRedirect: false
    };
  }

  async generateResponse(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): Promise<string> {
    // Validate last user message if exists
    if (messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        const validation = this.validateUserResponse(lastUserMessage.content, sessionContext.stage);
        if (!validation.isValid && validation.shouldRedirect) {
          // Don't advance stage, return redirect message
          return validation.redirectMessage || 'Could you tell me more about your own experiences?';
        }
      }
    }

    // Build optimized system prompt (V2)
    const systemPrompt = buildSystemPrompt(sessionContext.stage, {
      messageCount: sessionContext.messageCount,
      invalidCount: sessionContext.invalidResponseCount || 0,
      userThemes: sessionContext.extractedThemes
    });

    // Try Claude first, fallback to OpenAI
    if (anthropic) {
      try {
        // Convert messages format for Claude
        const claudeMessages = messages.map(msg => ({
          role: msg.role === 'system' ? 'assistant' as const : msg.role as 'user' | 'assistant',
          content: msg.content
        }));

        const completion = await anthropic.messages.create({
          model: "claude-3-haiku-20240307", // Most cost-effective model
          messages: claudeMessages,
          system: systemPrompt,
          max_tokens: 600,
          temperature: 0.7,
        });

        const response = completion.content[0];
        if (response.type === 'text') {
          return response.text;
        }
        throw new Error('Unexpected response format from Claude');
      } catch (error) {
        console.error('Claude API Error:', error);
        // Fallback to OpenAI
        if (openai) {
          return this.generateOpenAIResponse(messages, sessionContext);
        }
        throw new Error('Failed to generate AI response. Please check your API keys.');
      }
    } else if (openai) {
      return this.generateOpenAIResponse(messages, sessionContext);
    } else {
      throw new Error('No AI service configured. Please add ANTHROPIC_API_KEY or OPENAI_API_KEY to your environment.');
    }
  }

  private async generateOpenAIResponse(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): Promise<string> {
    if (!openai) {
      throw new Error('OpenAI client not initialized.');
    }

    // Build optimized system prompt (V2)
    const systemPrompt = buildSystemPrompt(sessionContext.stage, {
      messageCount: sessionContext.messageCount,
      invalidCount: sessionContext.invalidResponseCount || 0,
      userThemes: sessionContext.extractedThemes
    });

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_completion_tokens: 600,
      }, {
        timeout: 6000,
      });

      return completion.choices[0].message.content || 'I apologize, but I encountered an issue generating a response. Could you please try again?';
    } catch (error) {
      console.error('OpenAI Service Error:', error);
      throw new Error('Failed to generate AI response.');
    }
  }

  async *generateStreamingResponse(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): AsyncGenerator<string, void, unknown> {
    // Validate last user message
    if (messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        const validation = this.validateUserResponse(lastUserMessage.content, sessionContext.stage);
        if (!validation.isValid && validation.shouldRedirect) {
          yield validation.redirectMessage || 'Could you tell me more about your own experiences?';
          return;
        }
      }
    }

    // Build optimized system prompt (V2)
    const systemPrompt = buildSystemPrompt(sessionContext.stage, {
      messageCount: sessionContext.messageCount,
      invalidCount: sessionContext.invalidResponseCount || 0,
      userThemes: sessionContext.extractedThemes
    });

    if (anthropic) {
      try {
        const claudeMessages = messages.map(msg => ({
          role: msg.role === 'system' ? 'assistant' as const : msg.role as 'user' | 'assistant',
          content: msg.content
        }));

        const stream = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          messages: claudeMessages,
          system: systemPrompt,
          max_tokens: 600,
          temperature: 0.7,
          stream: true,
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            yield chunk.delta.text;
          }
        }
      } catch (error) {
        console.error('Claude Streaming Error:', error);
        // Fallback to OpenAI
        if (openai) {
          yield* this.generateOpenAIStreaming(messages, sessionContext);
        } else {
          yield 'I apologize, but I encountered an issue. Please check your API configuration.';
        }
      }
    } else if (openai) {
      yield* this.generateOpenAIStreaming(messages, sessionContext);
    } else {
      yield 'No AI service configured. Please add ANTHROPIC_API_KEY or OPENAI_API_KEY to your environment.';
    }
  }

  private async *generateOpenAIStreaming(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): AsyncGenerator<string, void, unknown> {
    if (!openai) {
      yield 'OpenAI client not initialized.';
      return;
    }

    try {
      // Build optimized system prompt (V2)
      const systemPrompt = buildSystemPrompt(sessionContext.stage, {
        messageCount: sessionContext.messageCount,
        invalidCount: sessionContext.invalidResponseCount || 0,
        userThemes: sessionContext.extractedThemes
      });

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_completion_tokens: 600,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('OpenAI Streaming Error:', error);
      yield 'I apologize, but I encountered an issue generating a response.';
    }
  }


  async analyzeStrengths(conversation: string): Promise<StrengthAnalysis> {
    // First, validate that there's meaningful content to analyze
    if (conversation.length < 200) {
      return {
        skills: [],
        attitudes: [],
        values: [],
        invalid: true,
        reason: 'Insufficient conversation content for analysis'
      };
    }

    // Enhanced analysis prompt with few-shot examples
    const analysisPrompt = `Extract career strengths from this conversation.

${STRENGTH_EXTRACTION_EXAMPLES}

Now analyze this conversation:

${conversation.substring(0, 1500)}

Rules:
1. Validate conversation has actual work/project stories (not just questions)
2. Each strength needs clear evidence from their specific examples
3. Max 6 items per category
4. Be specific, not generic (e.g., "Mobile App Development" not "Programming")

Return JSON format:
{
  "skills": ["specific skill 1", "specific skill 2", ...],
  "attitudes": ["attitude 1", "attitude 2", ...],
  "values": ["value 1", "value 2", ...],
  "invalid": false
}

If invalid (no real examples), return:
{
  "skills": [],
  "attitudes": [],
  "values": [],
  "invalid": true,
  "reason": "description of why"
}`;

    try {
      if (anthropic) {
        const completion = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          messages: [
            { role: 'user', content: analysisPrompt }
          ],
          system: 'You are a career strength analyzer. Extract strengths from specific work experiences. Follow the examples shown. Return valid JSON only.',
          max_tokens: 400,
          temperature: 0.2, // Lower temperature for more consistent extraction
        });

        const response = completion.content[0];
        if (response.type === 'text') {
          return JSON.parse(response.text);
        }
      } else if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: 'system', content: 'Extract career strengths from specific work experiences. Follow the examples. Return valid JSON only.' },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.2,
          max_completion_tokens: 400,
          response_format: { type: "json_object" }
        }, {
          timeout: 5000
        });

        const result = completion.choices[0].message.content;
        if (!result) throw new Error('No analysis result received');

        return JSON.parse(result);
      }

      throw new Error('No AI service available');
    } catch (error) {
      console.error('Strength Analysis Error:', error);
      return {
        skills: [],
        attitudes: [],
        values: [],
        invalid: true,
        reason: 'Analysis failed due to error'
      };
    }
  }

  async shouldProgressStage(
    messages: ChatMessage[], 
    currentStage: SessionContext['stage']
  ): Promise<{ shouldProgress: boolean; nextStage?: SessionContext['stage']; reason?: string }> {
    if (messages.length < 2) {
      return { shouldProgress: false };
    }

    // Get last user message
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (!lastUserMessage) {
      return { shouldProgress: false };
    }

    // Validate the last user response
    const validation = this.validateUserResponse(lastUserMessage.content, currentStage);
    
    // Don't progress if last response was invalid
    if (!validation.isValid) {
      return { 
        shouldProgress: false,
        reason: `Invalid response: ${validation.reason}`
      };
    }

    const messageLength = lastUserMessage.content.length;
    const validUserMessages = userMessages.filter(msg => 
      this.validateUserResponse(msg.content, currentStage).isValid
    ).length;

    switch (currentStage) {
      case 'initial':
        // Progress only if user shared a substantial story (> 100 characters) and it's valid
        if (messageLength > 100 && validation.isValid) {
          return { 
            shouldProgress: true, 
            nextStage: 'exploration',
            reason: 'User shared valid initial story' 
          };
        }
        break;
        
      case 'exploration':
        // Progress after 2 valid exchanges
        if (validUserMessages >= 2) {
          return { 
            shouldProgress: true, 
            nextStage: 'deepening',
            reason: 'Sufficient valid exploration completed' 
          };
        }
        break;
        
      case 'deepening':
        // Progress after 4 valid exchanges total
        if (validUserMessages >= 4) {
          return { 
            shouldProgress: true, 
            nextStage: 'analysis',
            reason: 'Deep exploration with valid responses completed' 
          };
        }
        break;
        
      case 'analysis':
        // Progress after 5 valid exchanges total
        if (validUserMessages >= 5) {
          return { 
            shouldProgress: true, 
            nextStage: 'summary',
            reason: 'Ready for final synthesis with sufficient valid data' 
          };
        }
        break;
    }

    return { shouldProgress: false };
  }
}