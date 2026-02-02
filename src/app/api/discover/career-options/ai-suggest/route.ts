import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Groq from 'groq-sdk';

/**
 * POST /api/discover/career-options/ai-suggest
 * Generate AI-powered career suggestions based on Holland code and profile
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      hollandCode,
      hollandScores,
      values,
      strengths,
      vision,
      mission,
      resumeAnalysis,
      selectedOnetCareers,
      enneagramType,
      enneagramWing,
    } = body;

    // Check for API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        suggestions: generateFallbackCareers(hollandCode),
        source: 'fallback',
        message: 'AI service not configured. Using template-based suggestions.',
      });
    }

    // Generate AI suggestions
    const groq = new Groq({ apiKey });
    const suggestions = await generateAICareerSuggestions(groq, {
      hollandCode,
      hollandScores,
      values,
      strengths,
      vision,
      mission,
      resumeAnalysis,
      selectedOnetCareers,
      enneagramType,
      enneagramWing,
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
  groq: Groq,
  data: {
    hollandCode: string;
    hollandScores: any;
    values?: any;
    strengths?: any;
    vision?: any;
    mission?: any;
    resumeAnalysis?: any;
    selectedOnetCareers?: any[];
    enneagramType?: number;
    enneagramWing?: number;
  }
) {
  const {
    hollandCode,
    hollandScores,
    values,
    strengths,
    vision,
    mission,
    resumeAnalysis,
    selectedOnetCareers,
    enneagramType,
    enneagramWing,
  } = data;

  // Build resume context if available
  let resumeContext = '';
  if (resumeAnalysis) {
    resumeContext = `
### Resume Analysis:
- Professional Summary: ${resumeAnalysis.professionalSummary || 'N/A'}
- Key Competencies: ${resumeAnalysis.keyCompetencies?.join(', ') || 'N/A'}
- Experience Level: ${resumeAnalysis.experienceLevel || 'N/A'}
- Overall Fit Score: ${resumeAnalysis.overallFit || 'N/A'}%`;
  }

  // Build selected O*NET careers context
  let onetContext = '';
  if (selectedOnetCareers && selectedOnetCareers.length > 0) {
    onetContext = `
### Selected O*NET Careers from Resume Analysis:
${selectedOnetCareers.map((c: any) => `- ${c.title} (${c.onetCode}) - ${c.fitScore}% fit`).join('\n')}

Consider these pre-identified careers and suggest similar or related paths.`;
  }

  const prompt = `You are a career counselor using Dr. Padilla's Workforce-Market Alignment Framework.
Provide comprehensive career suggestions based on the user's Holland Assessment and resume analysis.

## User Profile:

### Holland Code: ${hollandCode}
Scores: R=${hollandScores?.R || 0}, I=${hollandScores?.I || 0}, A=${hollandScores?.A || 0}, S=${hollandScores?.S || 0}, E=${hollandScores?.E || 0}, C=${hollandScores?.C || 0}

Holland types meaning:
- R (Realistic): Practical, hands-on, physical tasks
- I (Investigative): Analytical, intellectual, research-oriented
- A (Artistic): Creative, expressive, innovative
- S (Social): Helping, teaching, nurturing others
- E (Enterprising): Leading, persuading, business-oriented
- C (Conventional): Organized, detail-oriented, systematic
${resumeContext}
${onetContext}
${values ? `
### Core Values:
${formatValues(values)}` : ''}

${strengths ? `
### Key Strengths:
${strengths.map((s: any) => `- ${s.name || s}`).join('\n')}` : ''}

${vision?.statement ? `
### Vision Statement:
"${vision.statement}"` : ''}

${mission ? `
### Mission Statement:
"${mission}"` : ''}

${enneagramType ? `
### Enneagram Type: ${enneagramType}${enneagramWing ? `w${enneagramWing}` : ''}` : ''}

## Task:
Generate 8-10 career suggestions that comprehensively match this profile.
Prioritize careers that align with BOTH the Holland code AND the resume analysis (if provided).
For each career:
1. Use real O*NET occupation codes (format: XX-XXXX.XX like "11-3121.00")
2. Consider workforce market alignment and growth outlook
3. Match career requirements with demonstrated competencies

## Output Format:
Return ONLY a valid JSON array (no markdown, no code blocks):

[
  {
    "title": "Career Title",
    "titleKo": "경력 제목 (한국어)",
    "description": "Brief description of the role and responsibilities",
    "descriptionKo": "역할과 책임에 대한 간략한 설명 (한국어)",
    "hollandFit": "High",
    "personalityFit": "High",
    "valuesFit": "Aligns well with [specific values]",
    "strengthsFit": "Leverages [specific strengths]",
    "growthOutlook": "Growing (+X%)",
    "salaryRange": "$XX,XXX - $XXX,XXX",
    "matchScore": 85,
    "onetCode": "XX-XXXX.XX",
    "onetLink": "https://www.onetonline.org/link/summary/XX-XXXX.XX"
  }
]

Important:
- Use valid O*NET codes that match the career title
- Ensure O*NET links follow the format: https://www.onetonline.org/link/summary/[CODE]
- Include Korean translations for international users
- Match scores should reflect combined Holland + Resume + Values alignment`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response type');
    }

    // Parse JSON
    let cleanedText = content.trim();
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
