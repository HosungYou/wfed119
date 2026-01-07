import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/discover/vision/validate
 *
 * AI를 활용한 Vision Statement 검증
 * - 사용자의 컨텍스트(values, strengths, aspirations)를 고려한 검증
 * - 4가지 기준: Concise, Clear, Inspiring, Unique
 */
export async function POST(req: NextRequest) {
  // Validate API key early
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
    // Return a basic validation without AI
    const body = await req.json();
    const { statement } = body;
    const wordCount = statement?.trim().split(/\s+/).length || 0;

    return NextResponse.json({
      passed: wordCount <= 6,
      feedback: wordCount <= 6
        ? `Your vision statement has ${wordCount} words. AI validation is not available, but the word count looks good!`
        : `Your vision statement has ${wordCount} words. Please reduce to 6 or fewer words.`,
      suggestions: wordCount > 6 ? ['Try removing unnecessary adjectives or articles to reduce word count.'] : []
    });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const supabase = await createServerSupabaseClient();

    // 1. 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { statement, context } = body;

    if (!statement || !statement.trim()) {
      return NextResponse.json(
        { error: 'Statement is required' },
        { status: 400 }
      );
    }

    // 2. AI 검증 프롬프트 구성
    const systemPrompt = `
You are an expert career coach specializing in vision statement evaluation.

Your task is to evaluate the user's vision statement based on these criteria:

**Validation Criteria:**
1. **Concise**: MUST be 6 words or less (STRICT requirement)
2. **Clear**: Meaning is clear and easy to understand
3. **Inspiring**: Has the power to move into action
4. **Impact**: Magnitude stated or implied (e.g., "10 million dreams", "global communities")

**User Context:**
- Core Values: ${formatValues(context?.values)}
- Key Strengths: ${formatStrengths(context?.strengths)}
- Future Imagery: ${context?.futureImagery || 'Not provided'}
- Core Aspirations: ${formatAspirations(context?.coreAspirations)}

**Your Response Format:**
Return a JSON object with:
{
  "passed": true/false,
  "feedback": "Brief 2-3 sentence assessment",
  "suggestions": ["suggestion 1", "suggestion 2"] // Only if passed is false
}

**Evaluation Guidelines:**
- FIRST: Count the words in the statement. If > 6 words, automatically set passed: false
- Be encouraging but honest
- If the statement passes all criteria, set passed: true
- If it needs improvement, provide 2-3 specific, actionable suggestions
- For > 6 words: "Your vision is X words. Please reduce to 6 or fewer. Try removing adjectives or articles."
- Consider whether the statement authentically reflects the user's values and strengths
- Check if the statement is genuinely inspiring and unique to this person

**Examples of 6-word visions:**
- "Transform 10 million dreams into reality" (6 words ✓)
- "Empower youth through innovative education solutions" (6 words ✓)
- "Create sustainable futures for global communities" (6 words ✓)
`.trim();

    const userMessage = `Please evaluate this vision statement:

"${statement}"

Does it meet all four criteria (Concise, Clear, Inspiring, Unique) based on my context?`;

    // 3. Claude API 호출
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    // 4. 응답 파싱
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // JSON 추출 (마크다운 코드블록 제거)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
    }

    const result = JSON.parse(jsonText);

    console.log('[Validate] AI validation result:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Validate] Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate statement' },
      { status: 500 }
    );
  }
}

/**
 * Values 포맷팅
 */
function formatValues(values: any): string {
  if (!values) return 'Not provided';

  const parts: string[] = [];

  const terminal = values.terminal?.top3 || values.terminal;
  const instrumental = values.instrumental?.top3 || values.instrumental;
  const work = values.work?.top3 || values.work;

  if (Array.isArray(terminal) && terminal.length > 0) {
    const topValues = terminal.slice(0, 3).map((v: any) => v.value || v).join(', ');
    parts.push(`Terminal Values: ${topValues}`);
  }
  if (Array.isArray(instrumental) && instrumental.length > 0) {
    const topValues = instrumental.slice(0, 3).map((v: any) => v.value || v).join(', ');
    parts.push(`Instrumental Values: ${topValues}`);
  }
  if (Array.isArray(work) && work.length > 0) {
    const topValues = work.slice(0, 3).map((v: any) => v.value || v).join(', ');
    parts.push(`Work Values: ${topValues}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'Not provided';
}

/**
 * Strengths 포맷팅
 */
function formatStrengths(strengths: any[]): string {
  if (!strengths || strengths.length === 0) return 'Not provided';

  return strengths
    .slice(0, 5)
    .map((s: any, idx: number) => {
      const name = typeof s === 'string'
        ? s
        : (s.name || s.strength || s.strengths?.name || 'Unknown');
      return `${idx + 1}. ${name}`;
    })
    .join(', ');
}

/**
 * Aspirations 포맷팅
 */
function formatAspirations(aspirations: any[]): string {
  if (!aspirations || aspirations.length === 0) return 'Not provided';

  return aspirations
    .map((a: any) => `${a.keyword} (${a.reason})`)
    .join(', ');
}
