import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { swotData, strategies, priorities, answers } = body;

    const prompt = `You are a strategic planning coach. Based on the user's SWOT analysis, strategies, and their reflection answers, write a thoughtful reflection essay in Korean.

SWOT Analysis:
Strengths: ${swotData.strengths?.map((s: any) => s.text).join(', ')}
Weaknesses: ${swotData.weaknesses?.map((w: any) => w.text).join(', ')}
Opportunities: ${swotData.opportunities?.map((o: any) => o.text).join(', ')}
Threats: ${swotData.threats?.map((t: any) => t.text).join(', ')}

Top Priority Strategies (우선 실행):
${priorities.filter((p: any) => p.priority_group === '우선 실행').slice(0, 3).map((p: any, i: number) => `${i + 1}. ${p.text}`).join('\n')}

User's Reflection Answers:
${answers.map((a: any, i: number) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join('\n\n')}

Write a comprehensive reflection essay (200-300 words in Korean) that:
1. Summarizes key insights from their SWOT analysis
2. Highlights their strategic thinking process
3. Incorporates their answers to show personal understanding
4. Identifies growth opportunities and action plans
5. Ends with an encouraging and actionable conclusion

The essay should be written in first person, as if the user is reflecting on their own journey.

Return ONLY the reflection text in Korean (no JSON, no markdown, just the text):`;

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const reflection = content.text.trim();

    return NextResponse.json({ reflection });
  } catch (error) {
    console.error('[Reflection Draft] Error:', error);
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
  }
}
