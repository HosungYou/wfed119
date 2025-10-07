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
`,
    2: `
${baseContext}

**Current Stage: Step 2 - Discover Core Aspirations**

Goal: Extract core themes and aspirations from Step 1's future imagery

Guide:
1. Identify Patterns: Point out recurring elements in their imagination
2. "Why" Questions: Ask "Why is that important?" 3-5 times to discover deep motivations
3. Connect Strengths: Explore how the user's strengths contribute to realizing their aspirations
4. Prioritize: Help identify the 3-5 most essential aspirations

Output Format: Present 3-5 core aspiration keywords at the end.
`,
    3: `
${baseContext}

**Current Stage: Step 3 - Draft Your Vision**

Goal: Condense the user's aspirations into one concise, inspiring sentence

Guide:
1. Suggest 3 Styles:
   - Action-Focused: "I create [impact] through [action]"
   - State-Focused: "As a [role/state], I embody [value]"
   - Inspirational: "I pursue [ideal] through [metaphorical expression]"

2. Present one draft for each style
3. Refine the chosen draft together with the user
4. Keep it simple enough for a 10-year-old to understand
5. Use language that energizes when read

Examples:
- "I plant seeds of possibility in the next generation through education"
- "As an artist enjoying creative freedom, I add beauty to the world"
`,
    4: `
${baseContext}

**Current Stage: Step 4 - Finalize and Visualize**

Goal: Finalize the vision statement and connect past-present-future

Guide:
1. Validate the Final Statement:
   - Is it concise? (One sentence)
   - Is it clear? (Anyone can understand)
   - Is it inspiring? (Energizes when read)
   - Is it unique? (Reflects your distinct qualities)

2. Connect Past-Present-Future:
   - "How does your past experience with [strength] lead to this vision?"
   - "How is your current value of [value] reflected in this vision?"

3. Suggest First Action Item:
   - "What would be your first step toward this vision?"
`
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
