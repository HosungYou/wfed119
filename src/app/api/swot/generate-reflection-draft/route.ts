import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  try {
    // Check for API key first
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured. Please set GROQ_API_KEY.' },
        { status: 503 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const body = await request.json();
    const { swotData, strategies, priorities, answers } = body;

    const prompt = `You are a strategic planning coach. Based on the user's SWOT analysis, strategies, and their reflection answers, write a thoughtful reflection essay in ENGLISH.

SWOT Analysis:
Strengths: ${swotData.strengths?.map((s: any) => s.text).join(', ')}
Weaknesses: ${swotData.weaknesses?.map((w: any) => w.text).join(', ')}
Opportunities: ${swotData.opportunities?.map((o: any) => o.text).join(', ')}
Threats: ${swotData.threats?.map((t: any) => t.text).join(', ')}

Top Priority Strategies (우선 실행):
${priorities.filter((p: any) => p.priority_group === '우선 실행').slice(0, 3).map((p: any, i: number) => `${i + 1}. ${p.text}`).join('\n')}

User's Reflection Answers:
${answers.map((a: any, i: number) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join('\n\n')}

Write a comprehensive reflection essay (200-300 words in ENGLISH) that:
1. Summarizes key insights from their SWOT analysis
2. Highlights their strategic thinking process
3. Incorporates their answers to show personal understanding
4. Identifies growth opportunities and action plans
5. Ends with an encouraging and actionable conclusion

The essay should be written in first person, as if the user is reflecting on their own journey.

Return ONLY the reflection text in ENGLISH (no JSON, no markdown, just the text):`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response type');
    }

    const reflection = content.trim();

    return NextResponse.json({ reflection });
  } catch (error) {
    console.error('[Reflection Draft] Error:', error);
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
  }
}
