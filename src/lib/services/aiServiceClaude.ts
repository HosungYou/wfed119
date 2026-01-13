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
  async generateGoalSuggestion(prompt: string): Promise<string> {
    const systemPrompt = [
      'You are a goal-setting coach for personal OKRs.',
      'Return a single concise suggestion in the same language as the prompt.',
      'Do not add bullet points or extra commentary.',
    ].join(' ');

    if (anthropic) {
      try {
        const completion = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          messages: [{ role: 'user', content: prompt }],
          system: systemPrompt,
          max_tokens: 120,
          temperature: 0.4,
        });

        const response = completion.content[0];
        if (response.type === 'text') {
          return response.text.trim();
        }
        throw new Error('Unexpected response format from Claude');
      } catch (error) {
        console.error('Claude Goal Suggestion Error:', error);
        if (openai) {
          return this.generateOpenAIGoalSuggestion(systemPrompt, prompt);
        }
        throw error;
      }
    }

    if (openai) {
      return this.generateOpenAIGoalSuggestion(systemPrompt, prompt);
    }

    throw new Error('No AI service configured. Please add ANTHROPIC_API_KEY or OPENAI_API_KEY to your environment.');
  }

  private async generateOpenAIGoalSuggestion(systemPrompt: string, prompt: string): Promise<string> {
    if (!openai) {
      throw new Error('OpenAI client not initialized.');
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_completion_tokens: 120,
    }, {
      timeout: 6000,
    });

    return completion.choices[0].message.content?.trim()
      || 'Suggestion unavailable. Please try again.';
  }

  private validateUserResponse(message: string, stage: SessionContext['stage']): ResponseValidation {
    const trimmedMessage = message.trim();
    const words = trimmedMessage.split(/\s+/);
    const wordCount = words.length;

    console.log('[VALIDATION] Checking message:', {
      stage,
      length: trimmedMessage.length,
      wordCount,
      preview: trimmedMessage.substring(0, 50)
    });

    // === LOGIC-BASED VALIDATION (Priority over character count) ===

    // 1. Check for deflection patterns (highest priority)
    const deflectionPatterns = [
      /^(nothing|none|no idea|can't think|don't remember|idk|dunno)$/i,
      /^(skip|pass|next)/i,
      /^(i don't know|not sure)$/i,
    ];
    const isDeflection = deflectionPatterns.some(pattern => pattern.test(trimmedMessage));
    if (isDeflection) {
      return {
        isValid: false,
        reason: 'User deflecting or avoiding',
        shouldRedirect: true,
        redirectMessage: "No pressure at all! Every experience counts. Think about even a simple task where you felt a sense of accomplishment. It could be organizing something, helping someone, or learning a new skill. What comes to mind?"
      };
    }

    // 2. Check if user is asking a META question (about the process itself)
    const metaQuestionPatterns = [
      /^(what|how|why) (do|should|can|will) (you|we|i|this)/i,
      /what('s| is) (this|the|next)/i,
      /how (long|many|much)/i,
      /^(can you|could you|will you|would you) (help|tell|explain)/i
    ];
    const isMetaQuestion = metaQuestionPatterns.some(pattern => pattern.test(trimmedMessage));
    if (isMetaQuestion && wordCount < 15) {
      return {
        isValid: false,
        reason: 'User asking meta questions instead of sharing',
        shouldRedirect: true,
        redirectMessage: "Great question! But first, let's focus on YOUR story. Think of a specific time when you worked on something that engaged you. What was that experience like for you?"
      };
    }

    // 3. Check for rhetorical questions within context (OK if part of storytelling)
    // Only flag if it's ONLY a question with no context
    const endsWithQuestion = trimmedMessage.endsWith('?');
    const hasContextualContent = wordCount > 20 || /\b(when|because|so|then|after|during)\b/i.test(trimmedMessage);

    if (endsWithQuestion && !hasContextualContent && stage !== 'initial') {
      return {
        isValid: false,
        reason: 'Only asking questions without sharing experience',
        shouldRedirect: true,
        redirectMessage: "I appreciate your curiosity! To identify your strengths, I need to hear about YOUR specific experiences. Can you share a concrete example from your work or projects?"
      };
    }

    // 4. Check for off-topic content (only if clearly unrelated)
    const offTopicPatterns = [
      /\b(weather|sports team|tv show|movie|celebrity|gossip)\b/i,
    ];
    const workLifeKeywords = [
      /\b(work|project|task|team|goal|achieve|accomplish|create|build|solve|help|learn|study|research|design|develop|write|organize|plan|manage|lead|teach|mentor|collaborate|present)\b/i
    ];

    const hasWorkContent = workLifeKeywords.some(pattern => pattern.test(trimmedMessage));
    const hasOffTopic = offTopicPatterns.some(pattern => pattern.test(trimmedMessage));

    if (hasOffTopic && !hasWorkContent) {
      return {
        isValid: false,
        reason: 'Off-topic response',
        shouldRedirect: true,
        redirectMessage: "That's interesting! Let's refocus on your work and project experiences. What accomplishment, big or small, are you most proud of recently?"
      };
    }

    // === CONTENT QUALITY CHECKS ===

    // 5. Initial stage: LOGIC-BASED ONLY (no character/word count requirements)
    if (stage === 'initial') {
      // Expanded action words including past tense variants
      const hasActionWords = /\b(did|do|made|make|created?|built?|organized?|solved?|helped?|learned?|developed?|designed?|worked?|led|lead|taught|teach|managed?|coordinated?|served?|facilitated?|implemented?|delivered?|achieved?|accomplished?)\b/i.test(trimmedMessage);
      const hasTimeContext = /\b(when|last|ago|during|while|after|recently|yesterday|week|month|year|20\d{2}|my|was|were)\b/i.test(trimmedMessage);
      const hasWorkContext = /\b(work|job|project|task|team|role|position|responsibility|program|education|coordinator|teacher|student|office|colleague|educational|training)\b/i.test(trimmedMessage);

      console.log('[VALIDATION] Initial stage patterns:', {
        hasActionWords,
        hasTimeContext,
        hasWorkContext,
        messageLength: trimmedMessage.length,
        wordCount
      });

      // CRITICAL: Accept if has ANY content markers (NO length requirements)
      if (hasActionWords || hasTimeContext || hasWorkContext) {
        console.log('[VALIDATION] ✅ Initial stage PASSED - has content markers');
        return {
          isValid: true,
          shouldRedirect: false
        };
      }

      // Only reject if completely missing work-related content
      console.log('[VALIDATION] ❌ Initial stage FAILED - no content markers found');
      return {
        isValid: false,
        reason: 'No work-related content detected',
        shouldRedirect: true,
        redirectMessage: "I'd love to hear about a specific work or project experience! Can you tell me about a time when you worked on something meaningful? What did you do, and what happened?"
      };
    }

    // 6. Subsequent stages: Ensure meaningful engagement (logic-based only)
    // Accept ANY response that's not a deflection or meta question
    // No word/character count requirements

    // === PASS VALIDATION ===
    console.log('[VALIDATION] Final PASS - no issues found');
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
        reason: `Awaiting valid response: ${validation.reason}`
      };
    }

    // Count VALID user messages (quality over quantity)
    const validUserMessages = userMessages.filter(msg =>
      this.validateUserResponse(msg.content, currentStage).isValid
    ).length;

    // Calculate total conversation depth (including assistant responses)
    const totalExchanges = Math.floor(messages.length / 2);

    // === LOGIC-BASED STAGE PROGRESSION ===

    switch (currentStage) {
      case 'initial':
        // Progress if user shared a valid initial story
        // CRITICAL: If validation passed, that means they shared enough - PROGRESS!
        // Don't add extra checks here that would block progression
        const messageLength = lastUserMessage.content.trim().length;
        const messageWords = lastUserMessage.content.split(/\s+/).length;

        // CRITICAL: Trust validation completely - NO length checks
        console.log('[STAGE_PROGRESS] Initial stage check:', {
          validationIsValid: validation.isValid
        });

        if (validation.isValid) {
          console.log('[STAGE_PROGRESS] ✅ Progressing to exploration - validation passed');
          return {
            shouldProgress: true,
            nextStage: 'exploration',
            reason: 'User shared valid initial story'
          };
        } else {
          console.log('[STAGE_PROGRESS] ❌ Not progressing - validation failed');
        }
        break;

      case 'exploration':
        // Progress after 2-3 exchanges OR 2 valid user messages
        // Goal: Have basic understanding of the experience
        if (validUserMessages >= 2 || totalExchanges >= 3) {
          return {
            shouldProgress: true,
            nextStage: 'deepening',
            reason: 'Basic exploration completed - moving to deeper insights'
          };
        }
        break;

      case 'deepening':
        // Progress after 3-4 valid user messages OR 5 total exchanges
        // Goal: Uncover emotional and personal dimensions
        if (validUserMessages >= 3 || totalExchanges >= 5) {
          return {
            shouldProgress: true,
            nextStage: 'analysis',
            reason: 'Deep exploration with insights completed'
          };
        }
        break;

      case 'analysis':
        // Progress after 4-5 valid user messages OR 7 total exchanges
        // Goal: Identify patterns and transferable strengths
        if (validUserMessages >= 4 || totalExchanges >= 7) {
          return {
            shouldProgress: true,
            nextStage: 'summary',
            reason: 'Comprehensive analysis complete - ready for synthesis'
          };
        }
        break;

      case 'summary':
        // Already at final stage
        return { shouldProgress: false, reason: 'Already at summary stage' };
    }

    return {
      shouldProgress: false,
      reason: `Need ${currentStage === 'initial' ? 'more detail in initial story' : 'more conversation depth'}`
    };
  }
}
