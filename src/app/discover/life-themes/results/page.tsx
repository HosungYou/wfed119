'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Star,
  Target,
  Sparkles,
  Users,
  Tv,
  Palette,
  Quote,
  BookOpen,
  Brain,
  CheckCircle2,
  Home,
  Download,
  Share2,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import {
  LifeThemesSessionFull,
  LifeTheme,
  LifeThemesPattern,
  LifeThemesAnalysis,
  FindingsData,
  FollowUpData,
  QUESTION_CONFIG,
  QuestionNumber,
  ANALYSIS_TYPE_LABELS,
  AnalysisType,
} from '@/lib/types/lifeThemes';

const QUESTION_ICONS: Record<QuestionNumber, React.ReactNode> = {
  1: <Users className="w-5 h-5" />,
  2: <Tv className="w-5 h-5" />,
  3: <Palette className="w-5 h-5" />,
  4: <Quote className="w-5 h-5" />,
  5: <BookOpen className="w-5 h-5" />,
  6: <Brain className="w-5 h-5" />,
};

export default function LifeThemesResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<LifeThemesSessionFull | null>(null);

  const { completeModule } = useModuleProgress('life-themes');

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/life-themes/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);

        // Mark module as complete
        if (data.status === 'completed') {
          await completeModule();
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('[Life Themes Results] Error:', err);
      setLoading(false);
    }
  }, [completeModule]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const getAnalysis = (type: AnalysisType): LifeThemesAnalysis | undefined => {
    return session?.analysis?.find(a => a.analysis_type === type);
  };

  const getCompletedQuestionsCount = () => {
    return session?.responses?.filter(r => r.is_completed).length || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mb-6 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Life Themes Discovered!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            You&apos;ve completed the Career Construction Interview and uncovered your core life themes
          </p>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Journey Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-xl">
              <div className="text-3xl font-bold text-primary-600">
                {getCompletedQuestionsCount()}
              </div>
              <div className="text-sm text-gray-500">Questions Answered</div>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-xl">
              <div className="text-3xl font-bold text-secondary-600">
                {session?.findings?.findings?.length || session?.themes?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Life Themes</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-xl">
              <div className="text-3xl font-bold text-pink-600">
                {session?.followup?.themePriorities?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Priorities Set</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
        </div>

        {/* Your Life Themes (from Findings) */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-semibold text-gray-900">Your Core Life Themes</h2>
          </div>

          {session?.findings?.findings && session.findings.findings.length > 0 ? (
            <div className="space-y-4">
              {session.findings.findings.map((finding, idx) => {
                // Use followup priorities for ordering if available
                const priorityIdx = session.followup?.themePriorities?.indexOf(finding.theme) ?? -1;
                const displayIdx = priorityIdx >= 0 ? priorityIdx : idx;

                return (
                  <div
                    key={`finding-${idx}`}
                    className={`p-5 rounded-xl border-2 ${
                      displayIdx === 0 ? 'border-amber-300 bg-amber-50' :
                      displayIdx === 1 ? 'border-gray-300 bg-gray-50' :
                      displayIdx === 2 ? 'border-orange-200 bg-orange-50' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        displayIdx === 0 ? 'bg-amber-500' :
                        displayIdx === 1 ? 'bg-gray-400' :
                        displayIdx === 2 ? 'bg-orange-400' :
                        'bg-primary-500'
                      }`}>
                        {displayIdx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{finding.theme}</h3>
                        {finding.relevantStories && finding.relevantStories.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-500 mb-1">Related Stories:</p>
                            <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                              {finding.relevantStories.map((story, sIdx) => (
                                <li key={sIdx}>{story}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : session?.themes && session.themes.length > 0 ? (
            // Fallback to old themes format
            <div className="space-y-4">
              {session.themes
                .sort((a, b) => a.priority_rank - b.priority_rank)
                .map((theme, idx) => (
                  <div
                    key={theme.id}
                    className={`p-5 rounded-xl border-2 ${
                      idx === 0 ? 'border-amber-300 bg-amber-50' :
                      idx === 1 ? 'border-gray-300 bg-gray-50' :
                      idx === 2 ? 'border-orange-200 bg-orange-50' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        idx === 0 ? 'bg-amber-500' :
                        idx === 1 ? 'bg-gray-400' :
                        idx === 2 ? 'bg-orange-400' :
                        'bg-primary-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{theme.theme_name}</h3>
                        {theme.theme_description && (
                          <p className="text-gray-600 mt-1">{theme.theme_description}</p>
                        )}
                        {theme.personal_reflection && (
                          <p className="text-primary-600 mt-3 italic text-sm">
                            &quot;{theme.personal_reflection}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No themes identified yet.</p>
          )}
        </div>

        {/* Your Reflections (from Follow-up) */}
        {session?.followup && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Your Reflections</h2>
            </div>

            <div className="space-y-6">
              {session.followup.enneagramConnection && (
                <div className="p-4 bg-primary-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">Enneagram Connection</h4>
                  <p className="text-gray-700">{session.followup.enneagramConnection}</p>
                </div>
              )}

              {session.followup.careerGuidance && (
                <div className="p-4 bg-secondary-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">Career Guidance</h4>
                  <p className="text-gray-700">{session.followup.careerGuidance}</p>
                </div>
              )}

              {session.followup.selfLearning && (
                <div className="p-4 bg-pink-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">What You Learned About Yourself</h4>
                  <p className="text-gray-700">{session.followup.selfLearning}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fallback: Patterns Overview (for backward compatibility) */}
        {!session?.followup && session?.patterns && session.patterns.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Identified Patterns</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {session.patterns.map(pattern => (
                <div
                  key={pattern.id}
                  className="p-4 border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{pattern.pattern_text}</h4>
                    {pattern.source === 'ai' && (
                      <span className="px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded text-xs">AI</span>
                    )}
                  </div>
                  {pattern.pattern_description && (
                    <p className="text-sm text-gray-600 mb-2">{pattern.pattern_description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {pattern.related_questions.map(q => (
                      <span
                        key={q}
                        className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs"
                      >
                        {QUESTION_ICONS[q]}
                        Q{q}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Synthesis */}
        {getAnalysis('final_synthesis') && (
          <div className="bg-gradient-to-r from-primary-500 to-secondary-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-semibold">Final Synthesis</h2>
            </div>
            <p className="text-lg leading-relaxed opacity-95">
              {getAnalysis('final_synthesis')?.content}
            </p>
          </div>
        )}

        {/* Questions Completed */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions Completed</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {([1, 2, 3, 4, 5, 6] as QuestionNumber[]).map(q => {
              const response = session?.responses?.find(r => r.question_number === q);
              const isCompleted = response?.is_completed;

              return (
                <div
                  key={q}
                  className={`p-3 rounded-xl flex items-center gap-3 ${
                    isCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {QUESTION_ICONS[q]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Q{q}: {QUESTION_CONFIG[q].title}</p>
                    {isCompleted && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Takeaways</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-gray-700">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                Your top life theme is <strong>{
                  session?.followup?.themePriorities?.[0] ||
                  session?.findings?.findings?.[0]?.theme ||
                  session?.themes?.[0]?.theme_name ||
                  'yet to be discovered'
                }</strong>,
                which represents a core part of your identity.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                You identified {session?.findings?.findings?.length || session?.themes?.length || 0} life themes across your responses,
                revealing recurring patterns in your life experiences.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                Your life themes provide insight into what drives you and what brings meaning to your life.
              </span>
            </li>
            <li className="flex items-start gap-3 text-gray-700">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                Consider how these themes align with your career goals and life decisions.
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What&apos;s Next?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/discover/life-themes/findings')}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
            >
              <Star className="w-6 h-6 text-primary-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Review Findings</h3>
              <p className="text-sm text-gray-600">Edit themes and stories</p>
            </button>

            <button
              onClick={() => router.push('/discover/errc')}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
            >
              <Target className="w-6 h-6 text-primary-600 mb-2" />
              <h3 className="font-semibold text-gray-900">ERRC Action Plan</h3>
              <p className="text-sm text-gray-600">Create behavior change actions</p>
            </button>

            <button
              onClick={() => router.push('/discover')}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
            >
              <Home className="w-6 h-6 text-primary-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Explore More</h3>
              <p className="text-sm text-gray-600">Discover other modules</p>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/life-themes/followup')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Follow-up
          </button>

          <button
            onClick={() => router.push('/discover')}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Continue to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
