import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ENHANCED_SYSTEM_PROMPT } from '../prompts/enhancedSystemPrompt';

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

    const contextualPrompt = this.buildContextualPrompt(sessionContext);
    
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
          system: ENHANCED_SYSTEM_PROMPT + contextualPrompt,
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

    const contextualPrompt = this.buildContextualPrompt(sessionContext);
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: ENHANCED_SYSTEM_PROMPT + contextualPrompt },
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

    const contextualPrompt = this.buildContextualPrompt(sessionContext);
    
    if (anthropic) {
      try {
        const claudeMessages = messages.map(msg => ({
          role: msg.role === 'system' ? 'assistant' as const : msg.role as 'user' | 'assistant',
          content: msg.content
        }));

        const stream = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          messages: claudeMessages,
          system: ENHANCED_SYSTEM_PROMPT + contextualPrompt,
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
      const contextualPrompt = this.buildContextualPrompt(sessionContext);
      
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: 'system', content: ENHANCED_SYSTEM_PROMPT + contextualPrompt },
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

  private buildContextualPrompt(context: SessionContext): string {
    const { stage, messageCount, invalidResponseCount = 0 } = context;
    
    let additionalContext = `\n\nCURRENT CONTEXT:
- Conversation Stage: ${stage}
- Valid Message Count: ${messageCount}
- Invalid Response Count: ${invalidResponseCount}
`;

    // Add response validation emphasis if user has given invalid responses
    if (invalidResponseCount > 0) {
      additionalContext += `
- USER NEEDS GUIDANCE: They've provided ${invalidResponseCount} invalid responses
- Be extra clear about what kind of response you're looking for
- Provide specific examples to guide them`;
    }

    switch (stage) {
      case 'initial':
        additionalContext += `
- FOCUS: Elicit a meaningful story about work satisfaction
- Ask the opening question warmly and wait for their complete story
- If they give short or invalid response, guide them to share more detail
- Don't rush into analysis
- RESPONSE LENGTH: 2-3 sentences maximum + 1 question`;
        break;
      case 'exploration':
        additionalContext += `
- FOCUS: Acknowledge their story warmly, then ask ONE unique follow-up question
- Structure: Brief acknowledgment (1 sentence) → ONE question (?)
- Avoid repetitive questions - each question should explore something new
- CRITICAL: Must end with unique question mark (?)
- RESPONSE LENGTH: 2-3 sentences maximum`;
        break;
      case 'deepening':
        additionalContext += `
- FOCUS: Ask for NEW, DIFFERENT experiences (not the same story)
- Build on what they've shared - but request DIFFERENT examples
- Each question should explore a different dimension from previous ones
- Example: "Can you tell me about ANOTHER experience where..."
- CRITICAL: Must end with exactly one question mark (?)
- RESPONSE LENGTH: 2-4 sentences maximum`;
        break;
      case 'analysis':
        additionalContext += `
- FOCUS: Continue gathering MORE experiences (need 5-6 total stories)
- DO NOT provide analysis yet - keep collecting diverse examples
- Ask for specific experiences: "Tell me about a time when..."
- Each question should elicit a NEW story or experience
- CRITICAL: Must end with unique question mark (?)
- RESPONSE LENGTH: 2-4 sentences maximum
- NOTE: Still in discovery mode, not analysis mode yet`;
        break;
      case 'summary':
        additionalContext += `
- FOCUS: Provide comprehensive strength summary and future connections
- CRITICAL: DO NOT end with a question - provide definitive report/wrap-up
- Extract 5-8 strengths for EACH category (Skills, Attitudes, Values)
- Base ALL strengths on specific examples they shared
- Connect to 3-5 specific career paths with explanations
- Be comprehensive and conclusive
- End with hope and agency reinforcement
- RESPONSE LENGTH: This is your final comprehensive report, be thorough`;
        break;
    }

    return additionalContext;
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

    const analysisPrompt = `Analyze this conversation and extract career strengths. 

VALIDATION FIRST:
1. Check if conversation contains actual work/project experiences (not just questions)
2. Verify responses relate to skills/accomplishments/experiences
3. Ensure sufficient detail exists for extraction

IF INVALID (questions only, off-topic, or no experiences shared):
Return: {"skills":[],"attitudes":[],"values":[],"invalid":true,"reason":"[specific reason]"}

IF VALID, extract strengths with these rules:
- SKILLS (5-8 items REQUIRED): Specific abilities or competencies demonstrated
- ATTITUDES (5-8 items REQUIRED): Mindsets or approaches to work  
- VALUES (5-8 items REQUIRED): Core beliefs or principles shown

IMPORTANT: You MUST extract at least 5 items for each category. Look deeper into the conversation to find more nuanced strengths.

Each strength must:
- Link to specific statement in conversation
- Be 2-4 words maximum
- Have clear evidence
- Be distinct from others in the same category

Conversation: ${conversation.substring(0, 1500)}

Return valid JSON only: {"skills":["..."],"attitudes":["..."],"values":["..."],"invalid":false}`;

    try {
      if (anthropic) {
        const completion = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          messages: [
            { role: 'user', content: analysisPrompt }
          ],
          system: 'You are a career strength analyzer. Extract strengths ONLY from valid work experiences shared. Return JSON only.',
          max_tokens: 300,
          temperature: 0.3,
        });

        const response = completion.content[0];
        if (response.type === 'text') {
          return JSON.parse(response.text);
        }
      } else if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: 'system', content: 'Extract career strengths. Return valid JSON only.' },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.3,
          max_completion_tokens: 300,
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
        reason: 'Analysis failed'
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
        // Progress after 3 valid exchanges (need more examples)
        if (validUserMessages >= 3) {
          return { 
            shouldProgress: true, 
            nextStage: 'deepening',
            reason: 'Sufficient valid exploration completed' 
          };
        }
        break;
        
      case 'deepening':
        // Progress after 5 valid exchanges total (need diverse stories)
        if (validUserMessages >= 5) {
          return { 
            shouldProgress: true, 
            nextStage: 'analysis',
            reason: 'Deep exploration with valid responses completed' 
          };
        }
        break;
        
      case 'analysis':
        // Progress after 7 valid exchanges total (ensure 5-6 stories minimum)
        if (validUserMessages >= 7 && messages.length >= 10) {
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