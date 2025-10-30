import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { swotData, strategies, priorities } = body;

    const prompt = `You are a strategic planning coach helping someone reflect on their SWOT analysis and strategic planning process.

Based on their SWOT analysis and prioritized strategies, generate exactly 5 thoughtful reflection questions in Korean that will help them:
1. Understand insights from their SWOT analysis
2. Reflect on their strategic choices
3. Consider implementation challenges
4. Think about personal growth
5. Plan concrete next steps

SWOT Summary:
- Strengths: ${swotData.strengths?.length || 0} items
- Weaknesses: ${swotData.weaknesses?.length || 0} items
- Opportunities: ${swotData.opportunities?.length || 0} items
- Threats: ${swotData.threats?.length || 0} items

Top Priority Strategies: ${priorities.slice(0, 3).map((p: any) => p.text).join('; ')}

Generate 5 open-ended questions that encourage deep reflection. Each question should be specific and actionable.

Return ONLY a JSON array of 5 questions (no markdown, no code blocks):
["질문 1", "질문 2", "질문 3", "질문 4", "질문 5"]`;

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let cleanedText = content.text.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const questions = JSON.parse(cleanedText);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('[Reflection Questions] Error:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
