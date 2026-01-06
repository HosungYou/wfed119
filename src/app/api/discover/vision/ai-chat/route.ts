import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/discover/vision/ai-chat
 *
 * Claude AI와의 스트리밍 대화
 * - Step별 맞춤형 프롬프트
 * - 사용자 컨텍스트(Values, Strengths) 활용
 * - Server-Sent Events (SSE) 스트리밍
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  // Validate API key early
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
    const errorStream = new ReadableStream({
      start(controller) {
        const errorData = JSON.stringify({
          type: 'error',
          message: 'AI service is not configured. Please set ANTHROPIC_API_KEY in environment variables.'
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    });
    return new Response(errorStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const supabase = await createServerSupabaseClient();

    // 1. 인증 확인 (개발 모드에서는 우회)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = auth.userId;
    const body = await req.json();

    const {
      step,
      userMessage,
      conversationHistory = [],
      context
    } = body;

    // 2. Step별 시스템 프롬프트 생성
    const systemPrompt = getSystemPromptForStep(step, context);

    // 3. 대화 히스토리 구성
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    // 4. Claude API 스트리밍 호출
    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    });

    // 5. SSE 스트림 설정
    const readableStream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now();
        let fullResponse = '';
        let totalTokens = 0;

        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              fullResponse += text;

              // SSE 형식으로 전송
              const data = JSON.stringify({ type: 'text', content: text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            if (chunk.type === 'message_delta' && chunk.usage) {
              totalTokens = chunk.usage.output_tokens || 0;
            }
          }

          // 6. 완료 이벤트 전송
          const doneData = JSON.stringify({
            type: 'done',
            tokens: totalTokens,
            responseTime: Date.now() - startTime
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          // 7. AI 대화 로그 저장 (비동기, 블로킹 안 함)
          saveConversationLog(userId, step, userMessage, fullResponse, totalTokens, Date.now() - startTime)
            .catch(err => console.error('[AI Chat] Log save error:', err));

        } catch (error) {
          console.error('[AI Chat] Streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            message: 'AI 응답 생성 중 오류가 발생했습니다.'
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[AI Chat] Unexpected error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

/**
 * Step별 시스템 프롬프트 생성
 */
function getSystemPromptForStep(step: number, context: any): string {
  const baseContext = `
You are a professional career coach helping college students craft their personal vision statements.

User Background:
- Core Values: ${formatValues(context?.values)}
- Key Strengths: ${formatStrengths(context?.strengths)}

Conversation Guidelines:
1. Use a warm, empathetic, and encouraging tone
2. Naturally integrate the user's values and strengths into the conversation
3. Ask for specific examples to facilitate deeper dialogue
4. Limit yourself to 1-2 questions at a time (avoid overwhelming the user)
5. Listen carefully to responses and adapt your next questions accordingly
`.trim();

  const stepPrompts: Record<number, string> = {
    1: `
${baseContext}

**Current Stage: Step 1 - Imagine Your Future**

Goal: Quickly synthesize user's professional future vision in 2-3 exchanges maximum.

**Conversation Strategy**:

1. **Opening Question** (Exchange 1):
   Ask ONE context-rich question that incorporates the user's top value and strength.
   Request specific details about scale, scope, and impact.

   Example template:
   "Looking at your core value of [VALUE] and your strength in [STRENGTH],
   imagine your professional life 10 years from now:

   What's the ONE professional achievement or impact that would make you feel
   most fulfilled? Please be specific about:
   - The scale/magnitude (e.g., '10,000 students', 'national policy change')
   - Your primary role or work
   - Who benefits from this vision"

2. **Requirements Check** (Before Generating Draft):
   You MUST have ALL 4 requirements before generating draft:

   ✅ **Requirement 1: Professional Role/Work Type**
      Example: "Non-profit leader", "Tech entrepreneur", "Product designer"
      If missing: "What would your primary professional role be?"

   ✅ **Requirement 2: Impact Magnitude (MUST include numbers)**
      Example: "10,000 students", "100 communities", "1 million users"
      If missing: "How many people or communities would your work impact? Be specific with numbers."

   ✅ **Requirement 3: Scope (MUST be explicit)**
      Example: "national", "global", "local community", "organizational"
      If missing: "Is this impact local, national, or global?"

   ✅ **Requirement 4: Target Beneficiaries (MUST be specific)**
      Example: "underserved students", "small business owners", "rural communities"
      If missing: "Who specifically benefits from this work?"

3. **Clarification Strategy** (Exchange 2):
   - Check user's first response against 4 requirements
   - If ANY requirement is missing → ask targeted questions for missing items ONLY
   - Be direct: "To create your vision story, I need a bit more detail on [X]"
   - List missing requirements clearly

4. **Draft Generation** (Exchange 2 or 3):
   **ONLY generate draft when ALL 4 requirements are met.**
   If user provides vague answers after clarification, push back:
   "I need more specific details to create a compelling vision. For example,
   instead of 'many people', can you estimate a number like '5,000' or '50,000'?"

   **Before generating draft, verify you have ALL 4:**
   ✅ Role (e.g., "Non-profit leader")
   ✅ Numbers (e.g., "50,000 students")
   ✅ Scope (e.g., "national")
   ✅ Beneficiaries (e.g., "underserved communities")

   Format:
   ---
   Perfect! I now have everything needed to create your vision story.

   Summary of your vision:
   - **Role**: [Professional role]
   - **Impact**: [Specific numbers + scope]
   - **Beneficiaries**: [Who benefits]
   - **Values Alignment**: [How it connects to their values]

   📝 DRAFT_START
   [300-500 character vivid paragraph with:
   - Specific numbers (e.g., "50,000 students")
   - Clear scope (e.g., "across the United States")
   - Professional role and activities
   - Beneficiaries and impact
   - Values alignment]
   DRAFT_END

   Does this capture your vision? If yes, click "Next Step" to continue!
   ---

**Critical Guidelines**:
- **NEVER generate draft without all 4 requirements** - quality over speed
- Keep conversation efficient (2-3 exchanges) but don't compromise on requirements
- If user gives vague answers, push back with specific examples
- Use checklist format to show missing requirements clearly
- Prioritize PROFESSIONAL impact over personal life details
- Use user's existing values/strengths data in questions (don't ask them to repeat)

**Example Requirement Check** (Exchange 2):
"Great start! To create your vision story, I need a bit more specificity:

✅ Role: Non-profit leader (clear!)
❌ Numbers: You mentioned 'many students' - can you estimate? (e.g., 5,000? 50,000?)
✅ Scope: National (clear!)
❌ Beneficiaries: Who specifically? (e.g., 'underserved high school students'?)

These details will make your vision much more powerful!"
`,
    2: `
${baseContext}

**Current Stage: Step 2 - Brainstorm 6-Word Vision Statements**

Goal: Generate 3-5 powerful vision statements (STRICT: 6 words or less each) based on Step 1's future imagery story.

**CRITICAL: You have the user's complete future vision story from Step 1.**
Context from Step 1:
- Future Imagery Story: ${context?.futureImagery || 'Not available'}
- This story already contains role, impact, scope, and beneficiaries

**Strategy**:

1. **First, Analyze Step 1 Story**:
   Extract from the future imagery:
   - Professional role (e.g., "non-profit leader", "tech entrepreneur")
   - Impact magnitude with numbers (e.g., "50,000 students", "100 organizations")
   - Scope (global, national, local)
   - Target beneficiaries (e.g., "underserved students", "small businesses")
   - Key action verbs already used in their story (don't suggest generic verbs)

2. **Check for Missing Details**:
   ONLY if Step 1 story is vague or missing critical info, ask 1-2 targeted questions:
   - If no numbers: "I see you mentioned impact - can you estimate the scale? (e.g., 5,000? 50,000?)"
   - If scope unclear: "Is this impact global, national, or local?"

   **DO NOT ask about information already in Step 1 story!**

3. **Generate 3-5 Vision Statement Options**:
   **Base your statements on Step 1's actual story, not generic templates.**

   Requirements:
   - Each MUST be exactly 6 words or less
   - MUST incorporate actual details from Step 1 story
   - Use action verbs that appear in or match their story (not generic list)
   - Include specific numbers from their story if possible
   - Reflect their actual scope and beneficiaries

4. **Present Format**:
---
Based on your future vision story, here are 3-5 vision statement options:

**Option 1:** "[6-word vision based on their actual story]"
*Why it works:* [Explain how it captures specific elements from their Step 1 story]

**Option 2:** "[6-word vision with different emphasis from their story]"
*Why it works:* [Connect to specific details they mentioned]

**Option 3:** "[6-word vision highlighting another aspect of their story]"
*Why it works:* [Reference their actual beneficiaries/impact/role]

Which option resonates with you most? Or would you like to create your own 6-word version?
---

**Examples of good vision statements tied to specific stories**:
- If story mentions "50,000 students, national, tech education":
  → "Empower 50,000 students through tech education"
- If story mentions "global communities, sustainable solutions, innovation":
  → "Create sustainable solutions for global communities"
- If story mentions "100 organizations, international collaboration, social impact":
  → "Connect 100 organizations for social impact"

**Critical Guidelines**:
- **READ AND USE Step 1 story** - it contains all the information you need
- Don't ask for info already in Step 1 story (role, numbers, scope, beneficiaries)
- Don't suggest generic action verbs - use verbs that match their actual story
- Count words carefully - articles, prepositions, everything counts
- Focus on their specific vision, not generic templates
`,
    3: `
${baseContext}

**Current Stage: Step 3 - Compose & Visualize**

Goal: Finalize the 6-word vision statement and prepare for visualization

Context:
- User has selected or created a 6-word vision statement in Step 2
- Now reviewing and refining it

Guide:
1. **Review the 6-Word Statement**:
   - Is it exactly 6 words or less? ✓
   - Is the meaning clear and inspiring? ✓
   - Does it convey impact magnitude? ✓
   - Is it unique to this person? ✓

2. **If Refinement Needed**:
   - Suggest stronger verbs
   - Clarify vague terms
   - Ensure impact is evident
   - Keep it within 6 words

3. **Final Validation Questions**:
   - "Does this vision statement energize you to take action?"
   - "Can you see yourself working toward this every day?"
   - "Does it capture the essence of your future vision from Step 1?"

4. **When Satisfied**:
   - Congratulate them on creating a powerful vision
   - Encourage them to visualize it and download their vision card
   - Suggest first action steps

**Criteria for a Great 6-Word Vision**:
- ✓ Exactly 6 words or less
- ✓ Clear and easy to understand
- ✓ Inspiring and energizing
- ✓ Conveys magnitude of impact
- ✓ Unique to the individual

Examples of refined visions:
- "Transform 10 million dreams into reality"
- "Empower youth through innovative education solutions"
- "Create sustainable futures for communities"
`,
  };

  return stepPrompts[step] || baseContext;
}

/**
 * Values 포맷팅 (문자열로 변환)
 */
function formatValues(values: any): string {
  if (!values) return '정보 없음';

  const parts: string[] = [];

  if (values.terminal?.top3?.length > 0) {
    parts.push(`궁극적 가치: ${values.terminal.top3.join(', ')}`);
  }
  if (values.instrumental?.top3?.length > 0) {
    parts.push(`수단적 가치: ${values.instrumental.top3.join(', ')}`);
  }
  if (values.work?.top3?.length > 0) {
    parts.push(`직업 가치: ${values.work.top3.join(', ')}`);
  }

  return parts.length > 0 ? parts.join(' | ') : '정보 없음';
}

/**
 * Strengths 포맷팅 (문자열로 변환)
 */
function formatStrengths(strengths: any[]): string {
  if (!strengths || strengths.length === 0) return '정보 없음';

  return strengths
    .slice(0, 5)
    .map((s: any, idx: number) => {
      const name = typeof s === 'string'
        ? s
        : (s.name || s.strength || s.strengths?.name || '알 수 없음');
      return `${idx + 1}. ${name}`;
    })
    .join(', ');
}

/**
 * AI 대화 로그 저장 (비동기)
 */
async function saveConversationLog(
  userId: string,
  step: number,
  userMessage: string,
  aiResponse: string,
  tokens: number,
  responseTime: number
) {
  try {
    const supabase = await createServerSupabaseClient();

    // vision_statement_id 조회
    const { data: visionData } = await supabase
      .from('vision_statements')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!visionData) {
      console.warn('[AI Chat] No vision statement found for logging');
      return;
    }

    await supabase
      .from('conversation_messages')
      .insert([
        {
          session_id: `vision:${visionData.id}`,
          user_id: userId,
          role: 'user',
          content: userMessage,
          metadata: {
            type: 'vision_ai',
            vision_statement_id: visionData.id,
            step_number: step,
            model_used: 'claude-3-5-sonnet-20241022',
            tokens_used: tokens,
            response_time_ms: responseTime
          }
        },
        {
          session_id: `vision:${visionData.id}`,
          user_id: userId,
          role: 'assistant',
          content: aiResponse,
          metadata: {
            type: 'vision_ai',
            vision_statement_id: visionData.id,
            step_number: step,
            model_used: 'claude-3-5-sonnet-20241022',
            tokens_used: tokens,
            response_time_ms: responseTime
          }
        }
      ]);

  } catch (error) {
    console.error('[AI Chat] Failed to save conversation log:', error);
    // 로그 저장 실패해도 사용자 경험에는 영향 없음
  }
}
