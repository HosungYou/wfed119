import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/discover/career-options/ai-suggest
 * Generate AI-powered career suggestions based on Holland code and profile
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { hollandCode, hollandScores, values, strengths, vision, mission } = body;

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        suggestions: generateFallbackCareers(hollandCode),
        source: 'fallback',
        message: 'AI service not configured. Using template-based suggestions.',
      });
    }

    // Generate AI suggestions
    const anthropic = new Anthropic({ apiKey });
    const suggestions = await generateAICareerSuggestions(anthropic, {
      hollandCode,
      hollandScores,
      values,
      strengths,
      vision,
      mission,
    });

    return NextResponse.json({
      suggestions,
      source: 'ai',
    });
  } catch (error) {
    console.error('[Career Options AI Suggest] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

async function generateAICareerSuggestions(
  anthropic: Anthropic,
  data: {
    hollandCode: string;
    hollandScores: any;
    values?: any;
    strengths?: any;
    vision?: any;
    mission?: any;
  }
) {
  const { hollandCode, hollandScores, values, strengths, vision, mission } = data;

  const prompt = `You are a career counselor helping someone explore career options based on their profile.

## User Profile:

### Holland Code: ${hollandCode}
Scores: R=${hollandScores?.R || 0}, I=${hollandScores?.I || 0}, A=${hollandScores?.A || 0}, S=${hollandScores?.S || 0}, E=${hollandScores?.E || 0}, C=${hollandScores?.C || 0}

${values ? `### Core Values:
${formatValues(values)}` : ''}

${strengths ? `### Key Strengths:
${strengths.map((s: any) => `- ${s.name || s}`).join('\n')}` : ''}

${vision?.statement ? `### Vision Statement:
"${vision.statement}"` : ''}

${mission ? `### Mission Statement:
"${mission}"` : ''}

## Task:
Generate 8-10 career suggestions that match this profile. For each career, provide:
1. Title - Job title
2. Description - Brief description (1-2 sentences)
3. Holland Fit - How well it matches their Holland code (High/Medium/Low)
4. Values Fit - How it aligns with their values
5. Growth Outlook - Job market outlook
6. Salary Range - Approximate annual salary range

## Output Format:
Return ONLY a valid JSON array with this structure (no markdown, no code blocks):

[
  {
    "title": "Career Title",
    "description": "Brief description of the role and responsibilities",
    "hollandFit": "High",
    "valuesFit": "Aligns well with [specific values]",
    "strengthsFit": "Leverages [specific strengths]",
    "growthOutlook": "Growing/Stable/Declining",
    "salaryRange": "$XX,XXX - $XX,XXX",
    "matchScore": 85
  }
]

Ensure diverse suggestions across different industries and levels of specialization.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON
    let cleanedText = content.text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('[Career Options AI Suggest] AI error:', error);
    return generateFallbackCareers(data.hollandCode);
  }
}

function formatValues(values: any): string {
  if (!values) return 'No values provided';

  const parts: string[] = [];

  if (values.terminal?.length > 0) {
    parts.push(`Terminal: ${values.terminal.map((v: any) => v.name || v).join(', ')}`);
  }
  if (values.instrumental?.length > 0) {
    parts.push(`Instrumental: ${values.instrumental.map((v: any) => v.name || v).join(', ')}`);
  }
  if (values.work?.length > 0) {
    parts.push(`Work: ${values.work.map((v: any) => v.name || v).join(', ')}`);
  }

  return parts.join('\n') || 'No values provided';
}

function generateFallbackCareers(hollandCode: string): any[] {
  const careersByType: Record<string, any[]> = {
    R: [
      { title: 'Civil Engineer', description: 'Design and oversee construction of infrastructure projects', hollandFit: 'High', matchScore: 85 },
      { title: 'Electrician', description: 'Install and maintain electrical systems', hollandFit: 'High', matchScore: 82 },
      { title: 'Mechanical Engineer', description: 'Design mechanical systems and machinery', hollandFit: 'High', matchScore: 80 },
    ],
    I: [
      { title: 'Data Scientist', description: 'Analyze complex data to derive insights and predictions', hollandFit: 'High', matchScore: 88 },
      { title: 'Research Scientist', description: 'Conduct research to advance scientific knowledge', hollandFit: 'High', matchScore: 85 },
      { title: 'Medical Researcher', description: 'Study diseases and develop treatments', hollandFit: 'High', matchScore: 82 },
    ],
    A: [
      { title: 'UX Designer', description: 'Design user experiences for digital products', hollandFit: 'High', matchScore: 87 },
      { title: 'Content Creator', description: 'Create engaging content for various platforms', hollandFit: 'High', matchScore: 84 },
      { title: 'Graphic Designer', description: 'Create visual concepts and designs', hollandFit: 'High', matchScore: 82 },
    ],
    S: [
      { title: 'Career Counselor', description: 'Help individuals with career planning and development', hollandFit: 'High', matchScore: 88 },
      { title: 'Teacher', description: 'Educate and inspire students', hollandFit: 'High', matchScore: 85 },
      { title: 'Social Worker', description: 'Help individuals and communities overcome challenges', hollandFit: 'High', matchScore: 83 },
    ],
    E: [
      { title: 'Product Manager', description: 'Lead product development and strategy', hollandFit: 'High', matchScore: 87 },
      { title: 'Entrepreneur', description: 'Start and run your own business', hollandFit: 'High', matchScore: 85 },
      { title: 'Marketing Manager', description: 'Lead marketing strategies and campaigns', hollandFit: 'High', matchScore: 82 },
    ],
    C: [
      { title: 'Financial Analyst', description: 'Analyze financial data and provide recommendations', hollandFit: 'High', matchScore: 86 },
      { title: 'Accountant', description: 'Manage financial records and reporting', hollandFit: 'High', matchScore: 84 },
      { title: 'Project Manager', description: 'Plan and coordinate project activities', hollandFit: 'High', matchScore: 82 },
    ],
  };

  // Get careers for primary type
  const primaryType = hollandCode?.[0] || 'S';
  const secondaryType = hollandCode?.[1] || 'E';
  const tertiaryType = hollandCode?.[2] || 'I';

  const careers = [
    ...(careersByType[primaryType] || []),
    ...(careersByType[secondaryType] || []).slice(0, 2),
    ...(careersByType[tertiaryType] || []).slice(0, 2),
  ];

  return careers.map(c => ({
    ...c,
    valuesFit: 'Review alignment with your values',
    strengthsFit: 'Consider how your strengths apply',
    growthOutlook: 'Stable',
    salaryRange: '$50,000 - $100,000',
  }));
}
