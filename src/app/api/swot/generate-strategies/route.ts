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
    const { strengths, weaknesses, opportunities, threats } = body;

    // Validate input
    if (!strengths?.length || !weaknesses?.length || !opportunities?.length || !threats?.length) {
      return NextResponse.json(
        { error: 'All SWOT categories must have at least one item' },
        { status: 400 }
      );
    }

    // Create prompt for Claude
    const prompt = `You are a strategic planning expert. Based on the following SWOT analysis, generate exactly 4 strategies for each of the 4 SWOT strategy categories (SO, WO, ST, WT). Total of 16 strategies.

SWOT Analysis:

Strengths (강점):
${strengths.map((s: any, i: number) => `${i + 1}. ${s.text}`).join('\n')}

Weaknesses (약점):
${weaknesses.map((w: any, i: number) => `${i + 1}. ${w.text}`).join('\n')}

Opportunities (기회):
${opportunities.map((o: any, i: number) => `${i + 1}. ${o.text}`).join('\n')}

Threats (위협):
${threats.map((t: any, i: number) => `${i + 1}. ${t.text}`).join('\n')}

Generate strategies following this framework:

1. SO Strategies (Strengths-Opportunities): Use strengths to take advantage of opportunities
2. WO Strategies (Weaknesses-Opportunities): Overcome weaknesses by taking advantage of opportunities
3. ST Strategies (Strengths-Threats): Use strengths to avoid or minimize threats
4. WT Strategies (Weaknesses-Threats): Minimize weaknesses and avoid threats

Requirements:
- Generate EXACTLY 4 strategies for each category
- Each strategy should be clear, specific, and actionable
- Write in ENGLISH only
- Each strategy should be 1-2 sentences
- Format as JSON

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "SO": ["Strategy 1", "Strategy 2", "Strategy 3", "Strategy 4"],
  "WO": ["Strategy 1", "Strategy 2", "Strategy 3", "Strategy 4"],
  "ST": ["Strategy 1", "Strategy 2", "Strategy 3", "Strategy 4"],
  "WT": ["Strategy 1", "Strategy 2", "Strategy 3", "Strategy 4"]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response type from Groq');
    }

    // Parse Groq's response
    let strategiesJSON;
    try {
      // Remove any markdown code blocks if present
      let cleanedText = content.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }
      strategiesJSON = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content.text);
      throw new Error('Failed to parse AI response');
    }

    // Transform to our format with IDs
    const strategies = {
      so_strategies: strategiesJSON.SO.map((text: string, i: number) => ({
        id: `SO${i + 1}`,
        text,
      })),
      wo_strategies: strategiesJSON.WO.map((text: string, i: number) => ({
        id: `WO${i + 1}`,
        text,
      })),
      st_strategies: strategiesJSON.ST.map((text: string, i: number) => ({
        id: `ST${i + 1}`,
        text,
      })),
      wt_strategies: strategiesJSON.WT.map((text: string, i: number) => ({
        id: `WT${i + 1}`,
        text,
      })),
    };

    return NextResponse.json({ strategies });
  } catch (error) {
    console.error('[Generate Strategies] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate strategies' },
      { status: 500 }
    );
  }
}
