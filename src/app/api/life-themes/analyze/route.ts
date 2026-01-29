import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type {
  GenerateAnalysisRequest,
  AnalyzePatternRequest,
  PatternSuggestion,
  ThemeSuggestion,
  AnalysisType,
  QuestionNumber,
  LifeThemesResponse,
  FindingsData,
  FindingEntry,
} from '@/lib/types/lifeThemes';
import { QUESTION_CONFIG } from '@/lib/types/lifeThemes';

/**
 * GET /api/life-themes/analyze
 *
 * Fetch existing analysis for user's session
 * Query params: type=pattern_summary|theme_suggestion|... (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const analysisType = searchParams.get('type') as AnalysisType | null;

    let query = supabase
      .from('life_themes_analysis')
      .select('*')
      .eq('session_id', ltSession.id);

    if (analysisType) {
      query = query.eq('analysis_type', analysisType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Life Themes Analyze] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
    }

    // If fetching specific type, return single object
    if (analysisType) {
      return NextResponse.json(data?.[0] || null);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[Life Themes Analyze] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/life-themes/analyze
 *
 * Generate AI analysis or pattern suggestions
 * Body: { action: 'patterns' | 'themes' | 'analysis', ... }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (action === 'patterns') {
      // Fetch all responses
      const { data: responses } = await supabase
        .from('life_themes_responses')
        .select('*')
        .eq('session_id', ltSession.id);

      if (!responses || responses.length === 0) {
        return NextResponse.json(
          { error: 'No responses found to analyze' },
          { status: 400 }
        );
      }

      // Generate pattern suggestions
      const suggestions = generatePatternSuggestions(responses);

      // Store patterns with AI source
      for (const suggestion of suggestions) {
        await supabase.from('life_themes_patterns').insert({
          session_id: ltSession.id,
          pattern_text: suggestion.pattern_text,
          pattern_description: suggestion.pattern_description,
          related_questions: suggestion.related_questions,
          evidence: suggestion.evidence,
          source: 'ai',
          confidence_score: suggestion.confidence_score,
        });
      }

      // Fetch all patterns (including user-created)
      const { data: allPatterns } = await supabase
        .from('life_themes_patterns')
        .select('*')
        .eq('session_id', ltSession.id)
        .order('created_at');

      return NextResponse.json({
        suggestions,
        allPatterns: allPatterns || [],
      });
    }

    if (action === 'themes') {
      // Fetch patterns
      const { data: patterns } = await supabase
        .from('life_themes_patterns')
        .select('*')
        .eq('session_id', ltSession.id);

      if (!patterns || patterns.length === 0) {
        return NextResponse.json(
          { error: 'No patterns found. Please identify patterns first.' },
          { status: 400 }
        );
      }

      // Generate theme suggestions
      const suggestions = generateThemeSuggestions(patterns);

      return NextResponse.json({ suggestions });
    }

    if (action === 'findings') {
      // Fetch all responses
      const { data: responses } = await supabase
        .from('life_themes_responses')
        .select('*')
        .eq('session_id', ltSession.id);

      if (!responses || responses.length === 0) {
        return NextResponse.json(
          { error: 'No responses found to analyze' },
          { status: 400 }
        );
      }

      // Generate findings (themes + stories mapping)
      const findingsEntries = generateFindings(responses);

      // Store findings in analysis table
      const findingsData: FindingsData = {
        findings: findingsEntries,
        aiGenerated: true,
        userEdited: false,
      };

      // Upsert findings
      const { data: existingFindings } = await supabase
        .from('life_themes_analysis')
        .select('id')
        .eq('session_id', ltSession.id)
        .eq('analysis_type', 'findings')
        .single();

      if (existingFindings) {
        await supabase
          .from('life_themes_analysis')
          .update({
            content: `${findingsEntries.length} themes identified`,
            structured_data: findingsData,
          })
          .eq('id', existingFindings.id);
      } else {
        await supabase
          .from('life_themes_analysis')
          .insert({
            session_id: ltSession.id,
            analysis_type: 'findings',
            content: `${findingsEntries.length} themes identified`,
            structured_data: findingsData,
          });
      }

      return NextResponse.json(findingsData);
    }

    if (action === 'analysis') {
      const { analysis_type, enneagram_type, enneagram_wing } = body as GenerateAnalysisRequest;

      if (!analysis_type) {
        return NextResponse.json(
          { error: 'analysis_type is required' },
          { status: 400 }
        );
      }

      // Fetch all data for analysis
      const [responsesResult, patternsResult, themesResult] = await Promise.all([
        supabase.from('life_themes_responses').select('*').eq('session_id', ltSession.id),
        supabase.from('life_themes_patterns').select('*').eq('session_id', ltSession.id),
        supabase.from('life_themes').select('*').eq('session_id', ltSession.id).order('priority_rank'),
      ]);

      // Generate analysis content
      const analysisContent = generateAnalysis(
        analysis_type,
        responsesResult.data || [],
        patternsResult.data || [],
        themesResult.data || [],
        enneagram_type,
        enneagram_wing
      );

      // Upsert analysis
      const { data: existingAnalysis } = await supabase
        .from('life_themes_analysis')
        .select('id')
        .eq('session_id', ltSession.id)
        .eq('analysis_type', analysis_type)
        .single();

      let result;
      if (existingAnalysis) {
        const { data, error } = await supabase
          .from('life_themes_analysis')
          .update({
            content: analysisContent.content,
            structured_data: analysisContent.structured_data,
          })
          .eq('id', existingAnalysis.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('life_themes_analysis')
          .insert({
            session_id: ltSession.id,
            analysis_type,
            content: analysisContent.content,
            structured_data: analysisContent.structured_data,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "patterns", "themes", or "analysis"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Life Themes Analyze] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate pattern suggestions from responses
 * In production, this would call Claude API for intelligent analysis
 */
function generatePatternSuggestions(responses: LifeThemesResponse[]): PatternSuggestion[] {
  const suggestions: PatternSuggestion[] = [];

  // Extract keywords from all responses
  const keywordsByQuestion: Record<QuestionNumber, string[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
  };

  responses.forEach(response => {
    const data = response.response_data;
    const q = response.question_number as QuestionNumber;

    // Extract text content based on question type
    if (Array.isArray(data)) {
      data.forEach((item: Record<string, unknown>) => {
        Object.values(item).forEach(value => {
          if (typeof value === 'string') {
            keywordsByQuestion[q].push(...value.toLowerCase().split(/\s+/));
          }
        });
      });
    } else if (typeof data === 'object' && data !== null) {
      // Q5: subjects
      const subjectsData = data as { liked?: Array<{ subject: string; reasons: string }>; disliked?: Array<{ subject: string; reasons: string }> };
      [...(subjectsData.liked || []), ...(subjectsData.disliked || [])].forEach(item => {
        keywordsByQuestion[q].push(...item.subject.toLowerCase().split(/\s+/));
        keywordsByQuestion[q].push(...item.reasons.toLowerCase().split(/\s+/));
      });
    }
  });

  // Common pattern templates
  const patternTemplates: PatternSuggestion[] = [
    {
      pattern_text: 'Growth and Learning',
      pattern_description: 'A recurring theme of personal development and continuous learning',
      related_questions: [1, 2, 3] as QuestionNumber[],
      evidence: ['Interest in educational content', 'Admiration for self-made individuals'],
      confidence_score: 0.75,
    },
    {
      pattern_text: 'Connection and Relationships',
      pattern_description: 'Value placed on meaningful relationships and community',
      related_questions: [1, 3, 6] as QuestionNumber[],
      evidence: ['Social activities in hobbies', 'Early memories involving others'],
      confidence_score: 0.70,
    },
    {
      pattern_text: 'Achievement and Recognition',
      pattern_description: 'Drive for accomplishment and being recognized for contributions',
      related_questions: [1, 4, 5] as QuestionNumber[],
      evidence: ['Mottos about success', 'Preference for challenging subjects'],
      confidence_score: 0.65,
    },
    {
      pattern_text: 'Creativity and Expression',
      pattern_description: 'Need for creative outlets and self-expression',
      related_questions: [2, 3, 5] as QuestionNumber[],
      evidence: ['Creative hobbies', 'Artistic interests'],
      confidence_score: 0.60,
    },
  ];

  // Return top suggestions that have enough related responses
  const completedQuestions = responses.filter(r => r.is_completed).map(r => r.question_number);

  return patternTemplates.filter(pattern =>
    pattern.related_questions.some(q => completedQuestions.includes(q))
  ).slice(0, 4);
}

/**
 * Generate theme suggestions from patterns
 */
function generateThemeSuggestions(patterns: Array<{ pattern_text: string; pattern_description: string | null }>): ThemeSuggestion[] {
  const suggestions: ThemeSuggestion[] = [];

  // Group patterns into potential themes
  const themeTemplates = [
    {
      theme_name: 'Continuous Growth',
      theme_description: 'The pursuit of personal development and lifelong learning defines your journey',
      keywords: ['growth', 'learning', 'development', 'improvement'],
    },
    {
      theme_name: 'Meaningful Connection',
      theme_description: 'Deep relationships and community belonging are central to your fulfillment',
      keywords: ['connection', 'relationship', 'community', 'belonging'],
    },
    {
      theme_name: 'Creative Expression',
      theme_description: 'You seek outlets for creativity and authentic self-expression',
      keywords: ['creativity', 'expression', 'artistic', 'creative'],
    },
    {
      theme_name: 'Purpose-Driven Achievement',
      theme_description: 'You are motivated by meaningful accomplishments that align with your values',
      keywords: ['achievement', 'purpose', 'accomplishment', 'success'],
    },
    {
      theme_name: 'Independence and Autonomy',
      theme_description: 'Freedom to make your own choices and chart your own path is essential',
      keywords: ['independence', 'autonomy', 'freedom', 'self'],
    },
  ];

  // Match patterns to theme templates
  themeTemplates.forEach(template => {
    const relatedPatterns = patterns.filter(p =>
      template.keywords.some(keyword =>
        p.pattern_text.toLowerCase().includes(keyword) ||
        (p.pattern_description && p.pattern_description.toLowerCase().includes(keyword))
      )
    );

    if (relatedPatterns.length > 0) {
      suggestions.push({
        theme_name: template.theme_name,
        theme_description: template.theme_description,
        related_patterns: relatedPatterns.map(p => p.pattern_text),
        rationale: `Based on ${relatedPatterns.length} identified pattern(s): ${relatedPatterns.map(p => p.pattern_text).join(', ')}`,
      });
    }
  });

  return suggestions.slice(0, 5);
}

/**
 * Generate findings (themes + relevant stories) from responses
 * This replaces the patterns+themes two-step workflow with a single step
 */
function generateFindings(responses: LifeThemesResponse[]): FindingEntry[] {
  const findings: FindingEntry[] = [];

  // Extract stories/content from each response
  const stories: { question: QuestionNumber; text: string }[] = [];

  responses.forEach(response => {
    const q = response.question_number as QuestionNumber;
    const data = response.response_data;

    if (q === 6) {
      // MemoriesData - fixed 3 fields
      const memories = data as { memory1?: string; memory2?: string; memory3?: string };
      if (memories.memory1) stories.push({ question: q, text: memories.memory1 });
      if (memories.memory2) stories.push({ question: q, text: memories.memory2 });
      if (memories.memory3) stories.push({ question: q, text: memories.memory3 });
    } else if (q === 5) {
      // SubjectsResponse
      const subjects = data as { liked?: Array<{ subject: string; reasons: string }>; disliked?: Array<{ subject: string; reasons: string }> };
      subjects.liked?.forEach(s => stories.push({ question: q, text: `${s.subject}: ${s.reasons}` }));
      subjects.disliked?.forEach(s => stories.push({ question: q, text: `${s.subject}: ${s.reasons}` }));
    } else if (Array.isArray(data)) {
      data.forEach((item: Record<string, unknown>) => {
        const values = Object.values(item).filter(v => typeof v === 'string').join(' - ');
        if (values) stories.push({ question: q, text: values });
      });
    }
  });

  // Theme templates with keywords to match
  const themeTemplates = [
    { theme: 'Growth & Learning', keywords: ['learn', 'grow', 'develop', 'improve', 'education', 'study', 'knowledge'] },
    { theme: 'Connection & Relationships', keywords: ['people', 'friend', 'family', 'community', 'together', 'social', 'help'] },
    { theme: 'Achievement & Success', keywords: ['achieve', 'goal', 'success', 'accomplish', 'win', 'challenge', 'result'] },
    { theme: 'Creativity & Expression', keywords: ['create', 'art', 'design', 'music', 'write', 'express', 'imagine'] },
    { theme: 'Independence & Freedom', keywords: ['freedom', 'independent', 'own', 'self', 'choice', 'decide', 'control'] },
    { theme: 'Security & Stability', keywords: ['safe', 'secure', 'stable', 'protect', 'comfort', 'trust', 'reliable'] },
  ];

  // Match stories to themes
  themeTemplates.forEach(template => {
    const matchedStories = stories.filter(story =>
      template.keywords.some(kw => story.text.toLowerCase().includes(kw))
    );

    if (matchedStories.length > 0) {
      findings.push({
        theme: template.theme,
        relevantStories: matchedStories.slice(0, 3).map(s => s.text.substring(0, 100)),
      });
    }
  });

  // Ensure we return at least 3 themes with placeholders if needed
  if (findings.length < 3) {
    const defaultThemes = ['Core Value', 'Life Pattern', 'Future Aspiration'];
    for (let i = findings.length; i < 3; i++) {
      findings.push({
        theme: defaultThemes[i] || `Theme ${i + 1}`,
        relevantStories: ['(Add relevant stories from your responses)'],
      });
    }
  }

  return findings.slice(0, 6); // Max 6 themes
}

/**
 * Generate analysis content
 */
function generateAnalysis(
  analysisType: AnalysisType,
  responses: LifeThemesResponse[],
  patterns: Array<{ pattern_text: string }>,
  themes: Array<{ theme_name: string; priority_rank: number }>,
  enneagramType?: number,
  enneagramWing?: number
): { content: string; structured_data: Record<string, unknown> | null } {
  switch (analysisType) {
    case 'pattern_summary':
      return {
        content: `Based on your responses across ${responses.length} questions, ${patterns.length} recurring patterns have been identified. These patterns represent themes that appear consistently throughout your life experiences and preferences.`,
        structured_data: {
          total_patterns: patterns.length,
          patterns: patterns.map(p => p.pattern_text),
        },
      };

    case 'theme_suggestion':
      return {
        content: `Your identified patterns suggest ${themes.length} core life themes. These themes represent the underlying motivations and values that guide your decisions and bring meaning to your life.`,
        structured_data: {
          themes: themes.map(t => ({ name: t.theme_name, rank: t.priority_rank })),
        },
      };

    case 'enneagram_insight':
      if (enneagramType) {
        return {
          content: `As an Enneagram Type ${enneagramType}${enneagramWing ? ` with a ${enneagramWing} wing` : ''}, your life themes align with your core motivations. Your top themes reflect the characteristic drives of your type while your unique experiences have shaped how these manifest in your life.`,
          structured_data: {
            enneagram_type: enneagramType,
            enneagram_wing: enneagramWing,
          },
        };
      }
      return {
        content: 'Complete your Enneagram assessment to see how your life themes connect to your personality type.',
        structured_data: null,
      };

    case 'career_implication':
      return {
        content: `Your life themes suggest you would thrive in environments that allow for ${themes.slice(0, 3).map(t => t.theme_name.toLowerCase()).join(', ')}. Consider roles and industries that align with these core motivations for greater career satisfaction.`,
        structured_data: {
          top_themes: themes.slice(0, 3).map(t => t.theme_name),
        },
      };

    case 'final_synthesis':
      return {
        content: `Your Life Themes Discovery journey has revealed a rich tapestry of motivations, values, and aspirations. Through ${responses.length} reflective questions, you've uncovered ${patterns.length} patterns that connect to ${themes.length} core themes. These themes - ${themes.map(t => t.theme_name).join(', ')} - represent the essence of who you are and what drives you forward.`,
        structured_data: {
          questions_answered: responses.length,
          patterns_identified: patterns.length,
          themes_ranked: themes.length,
          top_theme: themes[0]?.theme_name,
        },
      };

    default:
      return {
        content: 'Analysis not available.',
        structured_data: null,
      };
  }
}
