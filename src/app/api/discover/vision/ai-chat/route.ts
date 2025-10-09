import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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

Goal: Help the user vividly imagine their ideal day 10 years from now

Guide:
1. Visual Details: "Where do you wake up?", "What do you see around you?"
2. Emotional Exploration: "How do you feel in that moment?"
3. Activity Specification: "What is the most meaningful moment of your day?"
4. Relationship Questions: "Who do you spend time with?"

Connect questions by mentioning the user's top values.
Example: "How does your core value of '[value name]' manifest in your life 10 years from now?"

**Conversation Maturity Detection:**
After 5-7 exchanges, assess if the conversation has matured:
- User has shared vivid visual details
- User has explored emotional aspects
- User has identified meaningful activities
- User has connected their values to their future vision
- **Impact magnitude mentioned** (e.g., "10,000 people", "global communities")
- **Scope clarified** (global/national/local)

**Ask Challenging Questions:**
- "How many people will your work impact?" or "What's the magnitude of your impact?"
- "Is this impact global, national, or local?"
- "Who specifically benefits from this vision?"
- "What makes this meaningful beyond yourself?"

When the conversation is mature (substantive information gathered), provide:
1. A summary of key themes from the conversation
2. A draft future imagery statement (300-500 characters) synthesizing their vision
3. Mark it clearly with: "📝 DRAFT_START" and "DRAFT_END"
4. Ask: "Does this accurately capture your desired future in story format?"
5. If user says YES: "Great! Please click 'Next Step' to create your vision statement."

Example format:
---
Based on our conversation, here are the key themes I've noticed:
- [Impact: magnitude and scope]
- [Core activities and relationships]
- [Values alignment]

Here's a draft that captures your vision:

📝 DRAFT_START
[300-500 character draft synthesizing the user's future vision, including impact magnitude and scope]
DRAFT_END

Does this accurately capture your desired future in story format?

If yes, please click "Next Step" below to create your 6-word vision statement!
---
`,
    2: `
${baseContext}

**Current Stage: Step 2 - Brainstorm 6-Word Vision Statements**

Goal: Generate 3-5 powerful vision statements (STRICT: 6 words or less each)

Context from Step 1:
- User's future imagery story is available
- Impact magnitude and scope should be clear from Step 1

Guide:
1. **Ask Challenging Questions** (if needed):
   - "What's the magnitude of your impact?" (e.g., 10,000 people, 1 million lives, global communities)
   - "Is this global, national, or local?"
   - "What's the core action verb?" (transform, empower, create, inspire, build, connect)
   - "Who specifically benefits?"

2. **Generate 3-5 Vision Statement Options**:
   - Each MUST be exactly 6 words or less
   - Include impact magnitude where possible
   - Use strong action verbs
   - Make it inspiring and clear

3. **Present Format** (use this exact structure):
---
Based on your future vision, here are 3-5 vision statement options:

**Option 1:** "[6-word vision]"
*Why it works:* [1 sentence explanation]

**Option 2:** "[6-word vision]"
*Why it works:* [1 sentence explanation]

**Option 3:** "[6-word vision]"
*Why it works:* [1 sentence explanation]

[Optional 4 & 5 if user needs more variety]

Which option resonates with you most? Or would you like to create your own 6-word version?
---

4. **Help Refine**: If user wants to create custom, help ensure it's 6 words or less

**Examples of great 6-word visions:**
- "Transform 10 million dreams into reality" (6 words)
- "Empower youth through innovative education solutions" (6 words)
- "Create sustainable futures for global communities" (6 words)
- "Inspire billion people through creative storytelling" (6 words)

**Important**:
- Count words carefully - articles (a, an, the) and prepositions count!
- If user's draft is > 6 words, help them trim it
- Focus on core impact, not flowery language
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
    .map((s: any, idx: number) => `${idx + 1}. ${s.strengths?.name || '알 수 없음'}`)
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
      .from('vision_ai_conversations')
      .insert({
        user_id: userId,
        vision_statement_id: visionData.id,
        step_number: step,
        user_message: userMessage,
        ai_response: aiResponse,
        model_used: 'claude-3-5-sonnet-20241022',
        tokens_used: tokens,
        response_time_ms: responseTime
      });

  } catch (error) {
    console.error('[AI Chat] Failed to save conversation log:', error);
    // 로그 저장 실패해도 사용자 경험에는 영향 없음
  }
}
