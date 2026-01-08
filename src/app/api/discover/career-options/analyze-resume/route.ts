import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';

interface ONetCareer {
  onetCode: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  fitScore: number;
  keySkillsMatch: string[];
  salaryRange: string;
  growthOutlook: string;
  link: string;
}

interface ResumeAnalysis {
  professionalSummary: string;
  professionalSummaryKo: string;
  keyCompetencies: string[];
  keyCompetenciesKo: string[];
  experienceLevel: string;
  suggestedCareers: ONetCareer[];
  overallFit: number;
}

/**
 * POST /api/discover/career-options/analyze-resume
 * Analyze resume and suggest O*NET careers
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const hollandCode = formData.get('hollandCode') as string || '';
    const hollandScoresStr = formData.get('hollandScores') as string || '{}';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let hollandScores = {};
    try {
      hollandScores = JSON.parse(hollandScoresStr);
    } catch {
      hollandScores = {};
    }

    // Extract text from file
    let resumeContent = '';
    let isPdf = false;
    let pdfBase64 = '';

    const fileType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (fileType === 'application/pdf') {
      // For PDF, we'll send it directly to Claude as a document
      isPdf = true;
      pdfBase64 = buffer.toString('base64');
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      // Parse Word document
      try {
        const result = await mammoth.extractRawText({ buffer });
        resumeContent = result.value;
      } catch (error) {
        console.error('[Analyze Resume] Word parsing error:', error);
        return NextResponse.json({ error: 'Failed to parse Word document' }, { status: 400 });
      }
    } else if (fileType === 'text/plain') {
      resumeContent = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
      return NextResponse.json({
        analysis: generateFallbackAnalysis(hollandCode),
        source: 'fallback',
        message: 'AI service not configured. Using template-based analysis.',
      });
    }

    // Analyze with AI
    const anthropic = new Anthropic({ apiKey });
    const analysis = await analyzeResumeWithAI(
      anthropic,
      isPdf ? '' : resumeContent,
      isPdf ? pdfBase64 : undefined,
      hollandCode,
      hollandScores
    );

    return NextResponse.json({
      analysis,
      source: 'ai',
    });
  } catch (error) {
    console.error('[Analyze Resume] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}

async function analyzeResumeWithAI(
  anthropic: Anthropic,
  resumeText: string,
  pdfBase64: string | undefined,
  hollandCode: string,
  hollandScores: any
): Promise<ResumeAnalysis> {
  const prompt = `You are a career counselor using Dr. Padilla's Workforce-Market Alignment Framework to analyze resumes.
Analyze the uploaded resume and provide career suggestions aligned with the O*NET occupational database.

${hollandCode ? `## User's Holland Code: ${hollandCode}
Holland Scores: R=${hollandScores?.R || 0}, I=${hollandScores?.I || 0}, A=${hollandScores?.A || 0}, S=${hollandScores?.S || 0}, E=${hollandScores?.E || 0}, C=${hollandScores?.C || 0}

Consider this Holland profile when suggesting careers.` : ''}

## Task:
1. Analyze the resume to identify key competencies, experience level, and professional strengths
2. Match the candidate with 3-5 O*NET occupations that best fit their profile
3. For each occupation, provide the exact O*NET code (format: XX-XXXX.XX like "11-3121.00")
4. Generate O*NET links using the format: https://www.onetonline.org/link/summary/[CODE]

## Output Format:
Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:

{
  "professionalSummary": "Brief 2-3 sentence summary of the candidate's professional profile and value proposition",
  "professionalSummaryKo": "한국어로 전문 역량 요약 (2-3문장)",
  "keyCompetencies": ["Competency 1", "Competency 2", "Competency 3", "Competency 4", "Competency 5"],
  "keyCompetenciesKo": ["역량 1", "역량 2", "역량 3", "역량 4", "역량 5"],
  "experienceLevel": "Entry-Level / Mid-Level / Senior / Executive",
  "overallFit": 85,
  "suggestedCareers": [
    {
      "onetCode": "11-3121.00",
      "title": "Human Resources Manager",
      "titleKo": "인사 관리자",
      "description": "Plan, direct, and coordinate human resource activities",
      "descriptionKo": "인사 활동을 계획, 지시 및 조정",
      "fitScore": 92,
      "keySkillsMatch": ["Leadership", "Communication", "Strategic Planning"],
      "salaryRange": "$80,000 - $130,000",
      "growthOutlook": "Growing (+7%)",
      "link": "https://www.onetonline.org/link/summary/11-3121.00"
    }
  ]
}

Important:
- Use real, valid O*NET codes (verify the format XX-XXXX.XX)
- Suggest 3-5 careers that truly match the resume content
- Match scores should reflect actual alignment between resume and occupation requirements
- Include diverse career paths across different levels if appropriate
- Ensure all links follow the exact O*NET format`;

  try {
    let messages: any[];

    if (pdfBase64) {
      // Send PDF as document
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ];
    } else {
      // Send text content
      messages = [
        {
          role: 'user',
          content: `${prompt}\n\n## Resume Content:\n${resumeText}`,
        },
      ];
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages,
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    let cleanedText = content.text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(cleanedText);

    // Validate and fix O*NET links
    if (analysis.suggestedCareers) {
      analysis.suggestedCareers = analysis.suggestedCareers.map((career: any) => ({
        ...career,
        link: `https://www.onetonline.org/link/summary/${career.onetCode}`,
      }));
    }

    return analysis;
  } catch (error) {
    console.error('[Analyze Resume] AI error:', error);
    throw error;
  }
}

function generateFallbackAnalysis(hollandCode: string): ResumeAnalysis {
  // Generate fallback based on Holland code if available
  const fallbackCareers: Record<string, ONetCareer[]> = {
    R: [
      {
        onetCode: '17-2051.00',
        title: 'Civil Engineer',
        titleKo: '토목 기사',
        description: 'Plan, design, and oversee construction and maintenance of structures',
        descriptionKo: '구조물의 건설 및 유지 관리를 계획, 설계 및 감독',
        fitScore: 80,
        keySkillsMatch: ['Engineering', 'Problem Solving', 'Project Management'],
        salaryRange: '$70,000 - $110,000',
        growthOutlook: 'Stable (+2%)',
        link: 'https://www.onetonline.org/link/summary/17-2051.00',
      },
    ],
    I: [
      {
        onetCode: '15-2051.00',
        title: 'Data Scientist',
        titleKo: '데이터 과학자',
        description: 'Develop and apply data science techniques to solve complex problems',
        descriptionKo: '복잡한 문제를 해결하기 위한 데이터 과학 기법 개발 및 적용',
        fitScore: 85,
        keySkillsMatch: ['Data Analysis', 'Machine Learning', 'Statistics'],
        salaryRange: '$90,000 - $150,000',
        growthOutlook: 'Growing (+36%)',
        link: 'https://www.onetonline.org/link/summary/15-2051.00',
      },
    ],
    A: [
      {
        onetCode: '27-1024.00',
        title: 'Graphic Designer',
        titleKo: '그래픽 디자이너',
        description: 'Design or create graphics to meet specific commercial or promotional needs',
        descriptionKo: '특정 상업적 또는 홍보 요구를 충족하는 그래픽 디자인 또는 제작',
        fitScore: 82,
        keySkillsMatch: ['Creativity', 'Visual Design', 'Adobe Creative Suite'],
        salaryRange: '$45,000 - $85,000',
        growthOutlook: 'Stable (+3%)',
        link: 'https://www.onetonline.org/link/summary/27-1024.00',
      },
    ],
    S: [
      {
        onetCode: '21-1012.00',
        title: 'Educational, Guidance, and Career Counselor',
        titleKo: '교육/진로 상담사',
        description: 'Advise students and provide academic and career guidance',
        descriptionKo: '학생들에게 학업 및 진로 지도 제공',
        fitScore: 88,
        keySkillsMatch: ['Counseling', 'Communication', 'Empathy'],
        salaryRange: '$50,000 - $80,000',
        growthOutlook: 'Growing (+10%)',
        link: 'https://www.onetonline.org/link/summary/21-1012.00',
      },
    ],
    E: [
      {
        onetCode: '11-2021.00',
        title: 'Marketing Manager',
        titleKo: '마케팅 관리자',
        description: 'Plan, direct, or coordinate marketing policies and programs',
        descriptionKo: '마케팅 정책 및 프로그램을 계획, 지시 또는 조정',
        fitScore: 84,
        keySkillsMatch: ['Leadership', 'Strategy', 'Marketing'],
        salaryRange: '$80,000 - $140,000',
        growthOutlook: 'Growing (+10%)',
        link: 'https://www.onetonline.org/link/summary/11-2021.00',
      },
    ],
    C: [
      {
        onetCode: '13-2011.00',
        title: 'Accountant',
        titleKo: '회계사',
        description: 'Analyze financial information and prepare financial reports',
        descriptionKo: '재무 정보를 분석하고 재무 보고서를 작성',
        fitScore: 86,
        keySkillsMatch: ['Accounting', 'Analysis', 'Attention to Detail'],
        salaryRange: '$55,000 - $95,000',
        growthOutlook: 'Stable (+4%)',
        link: 'https://www.onetonline.org/link/summary/13-2011.00',
      },
    ],
  };

  const primaryType = hollandCode?.[0] || 'S';
  const secondaryType = hollandCode?.[1] || 'E';

  const careers = [
    ...(fallbackCareers[primaryType] || fallbackCareers['S']),
    ...(fallbackCareers[secondaryType] || fallbackCareers['E']),
    // Add a general career
    {
      onetCode: '11-1021.00',
      title: 'General and Operations Manager',
      titleKo: '일반/운영 관리자',
      description: 'Plan, direct, or coordinate operations of public or private sector organizations',
      descriptionKo: '공공 또는 민간 부문 조직의 운영을 계획, 지시 또는 조정',
      fitScore: 75,
      keySkillsMatch: ['Management', 'Leadership', 'Operations'],
      salaryRange: '$70,000 - $130,000',
      growthOutlook: 'Stable (+6%)',
      link: 'https://www.onetonline.org/link/summary/11-1021.00',
    },
  ];

  return {
    professionalSummary: 'Based on your profile, you demonstrate a diverse skill set with potential in multiple career paths. Further resume analysis would provide more specific insights.',
    professionalSummaryKo: '귀하의 프로필을 바탕으로, 여러 경력 경로에서 잠재력을 보이는 다양한 역량을 갖추고 있습니다. 추가 이력서 분석을 통해 더 구체적인 인사이트를 제공받을 수 있습니다.',
    keyCompetencies: ['Communication', 'Problem Solving', 'Teamwork', 'Adaptability', 'Time Management'],
    keyCompetenciesKo: ['의사소통', '문제 해결', '팀워크', '적응력', '시간 관리'],
    experienceLevel: 'Mid-Level',
    suggestedCareers: careers,
    overallFit: 78,
  };
}
