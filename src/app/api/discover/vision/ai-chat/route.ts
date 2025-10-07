import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
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

    // 1. 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
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
당신은 대학생들의 비전 설정을 돕는 전문 커리어 코치입니다.
사용자의 배경 정보:
- 주요 가치 (Values): ${formatValues(context?.values)}
- 주요 강점 (Strengths): ${formatStrengths(context?.strengths)}

대화 가이드라인:
1. 친근하고 공감적인 톤으로 대화하세요
2. 사용자의 가치와 강점을 대화에 자연스럽게 녹여내세요
3. 구체적인 예시를 요청하여 깊이 있는 대화를 이끌어내세요
4. 한 번에 1-2개의 질문만 하세요 (과도한 질문 지양)
5. 사용자의 답변을 경청하고 그에 맞춰 다음 질문을 조정하세요
`.trim();

  const stepPrompts: Record<number, string> = {
    1: `
${baseContext}

**현재 단계: Step 1 - 미래 상상하기**

목표: 사용자가 10년 후의 이상적인 하루를 생생하게 상상하도록 돕기

가이드:
1. 시각적 디테일 유도: "어디서 눈을 뜨나요?", "주변에 무엇이 보이나요?"
2. 감정 탐색: "그 순간 어떤 기분이 드나요?"
3. 활동 구체화: "하루 중 가장 의미 있는 순간은 언제인가요?"
4. 관계 질문: "누구와 함께 시간을 보내나요?"

사용자의 Top 가치를 언급하며 질문을 연결하세요.
예: "당신의 주요 가치 중 하나인 '[가치명]'이 10년 후 삶에서 어떻게 나타나나요?"
`,
    2: `
${baseContext}

**현재 단계: Step 2 - 핵심 열망 발견하기**

목표: Step 1의 미래 상상에서 핵심 테마와 열망 추출

가이드:
1. 패턴 파악: 상상 속에서 반복되는 요소 지적
2. "왜" 질문: "왜 그것이 중요한가요?"를 3-5번 반복하여 깊은 동기 발견
3. 강점 연결: 사용자의 강점이 열망 실현에 어떻게 기여하는지 탐색
4. 우선순위: 여러 열망 중 가장 핵심적인 3-5개 선정 돕기

출력 형식: 최종적으로 3-5개의 핵심 열망 키워드를 제시하세요.
`,
    3: `
${baseContext}

**현재 단계: Step 3 - 비전 초안 만들기**

목표: 사용자의 열망을 간결하고 영감적인 한 문장으로 압축

가이드:
1. 3가지 스타일 제안:
   - 행동 중심: "나는 [행동]을 통해 [영향]을 만든다"
   - 상태 중심: "나는 [역할/상태]로서 [가치]를 실현한다"
   - 영감 중심: "[은유적 표현]으로 [이상]을 추구한다"

2. 각 스타일별로 1개씩 초안 작성하여 제시
3. 사용자가 선택한 초안을 함께 다듬기
4. 10살 아이도 이해할 수 있을 만큼 단순하게
5. 읽으면 에너지가 솟는 표현 사용

예시:
- "교육을 통해 다음 세대에게 가능성의 씨앗을 심는다"
- "창의적 자유를 누리며 세상에 아름다움을 더하는 예술가"
`,
    4: `
${baseContext}

**현재 단계: Step 4 - 완성 및 시각화**

목표: 최종 비전 선언문 확정 및 과거-현재-미래 연결

가이드:
1. 최종 문장 검증:
   - 간결한가? (한 문장)
   - 명확한가? (누구나 이해 가능)
   - 영감을 주는가? (읽으면 에너지 충전)
   - 고유한가? (나만의 특별함 반영)

2. 과거-현재-미래 연결:
   - "당신의 과거 경험 [강점]이 이 비전으로 어떻게 이어지나요?"
   - "현재 당신의 [가치]가 이 비전에 어떻게 반영되어 있나요?"

3. 첫 번째 액션 아이템 제안:
   - "이 비전을 향한 첫 걸음은 무엇일까요?"
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
