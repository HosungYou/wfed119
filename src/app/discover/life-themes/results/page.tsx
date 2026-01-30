'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
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
  LayoutDashboard,
  ChevronRight,
  Camera,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n';
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

// Confetti colors matching Terra Editorial Design
const CONFETTI_COLORS = ['#e26b42', '#889c5c', '#f5b89d', '#cbba96', '#d04f2a'];

export default function LifeThemesResultsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<LifeThemesSessionFull | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { completeModule } = useModuleProgress('life-themes');

  // Confetti celebration effect on page load
  useEffect(() => {
    if (!loading && session) {
      setShowConfetti(true);

      // Create confetti particles
      const confettiCount = 50;
      const confettiElements: HTMLDivElement[] = [];

      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-particle';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        confetti.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        document.body.appendChild(confetti);
        confettiElements.push(confetti);
      }

      // Clean up confetti after animation
      const timeout = setTimeout(() => {
        confettiElements.forEach(el => el.remove());
        setShowConfetti(false);
      }, 3000);

      return () => {
        clearTimeout(timeout);
        confettiElements.forEach(el => el.remove());
      };
    }
  }, [loading, session]);

  async function downloadAsImage() {
    if (!resultsRef.current) return;
    setDownloading(true);

    try {
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2,
        backgroundColor: '#f8fafc',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `life-themes-results-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('[Life Themes Results] Download error:', err);
    } finally {
      setDownloading(false);
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-lg transition-all"
            >
              <Home className="w-4 h-4" />
              <span>{language === 'en' ? 'Home' : '홈'}</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => router.push('/discover')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-lg transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{language === 'en' ? 'Dashboard' : '대시보드'}</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => router.push('/discover/life-themes')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{language === 'en' ? 'Life Themes' : '생애 주제'}</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg font-medium">
              {language === 'en' ? 'Results' : '결과'}
            </span>
          </div>

          {/* Export Button */}
          <button
            onClick={downloadAsImage}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium text-gray-700">
                  {language === 'en' ? 'Saving...' : '저장 중...'}
                </span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {language === 'en' ? 'Save as Image' : '이미지로 저장'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Results Content - Wrapped for Image Export */}
        <div ref={resultsRef} className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 rounded-2xl p-4">
          {/* Header with VS Diverge Celebration Animation */}
          <div className="text-center mb-12">
            {/* Animated Trophy with Pulsing Rings */}
            <div className="relative inline-flex items-center justify-center mb-6">
              {/* Pulsing rings */}
              <div className="absolute w-20 h-20 rounded-full bg-amber-400/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-amber-400/10 animate-pulse-ring" />

              {/* Trophy */}
              <div className="relative w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-2xl flex items-center justify-center animate-bounce-slow">
                <Trophy className="w-10 h-10 text-white animate-wiggle" />

                {/* Sparkles */}
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-300 rounded-full animate-ping" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping animation-delay-500" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up-stagger">
              {language === 'en' ? 'Your Life Themes Discovered!' : '당신의 생애 주제가 발견되었습니다!'}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up-stagger animation-delay-200">
              {language === 'en'
                ? 'You\'ve completed the Career Construction Interview and uncovered your core life themes'
                : '커리어 구성 인터뷰를 완료하고 핵심 생애 주제를 발견했습니다'}
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
            <h2 className="text-2xl font-semibold text-gray-900">
              {language === 'en' ? 'Your Core Life Themes' : '핵심 생애 주제'}
            </h2>
          </div>

          {/* VS Diverge Design: Orbital Theme Visualization */}
          {session?.findings?.findings && session.findings.findings.length > 0 && (
            <div className="relative h-80 mb-8 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 rounded-2xl overflow-hidden">
              {/* Ambient floating elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 right-20 w-20 h-20 bg-primary-200/30 rounded-full blur-2xl animate-float" />
                <div className="absolute bottom-10 left-20 w-24 h-24 bg-secondary-200/30 rounded-full blur-2xl animate-float-delayed" />
              </div>

              {/* Center core - YOU */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white font-bold shadow-lg z-10">
                  <span className="text-lg">{language === 'en' ? 'YOU' : '나'}</span>
                </div>
              </div>

              {/* Orbiting themes */}
              {session.findings.findings.slice(0, 5).map((finding, idx) => {
                const priorityIdx = session.followup?.themePriorities?.indexOf(finding.theme) ?? idx;
                const themeCount = Math.min(session.findings!.findings.length, 5);
                const radius = 120; // Fixed radius for cleaner layout
                const angle = (360 / themeCount) * idx - 90; // Start from top
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                // Larger sizes for better text visibility
                const size = priorityIdx === 0 ? 'w-20 h-20' :
                            priorityIdx === 1 ? 'w-18 h-18' :
                            'w-16 h-16';
                const color = priorityIdx === 0 ? 'from-amber-400 to-amber-600' :
                              priorityIdx === 1 ? 'from-gray-400 to-gray-600' :
                              'from-primary-400 to-primary-600';
                // Extract short name (first word or abbreviation)
                const shortName = finding.theme.split(' ')[0].replace('&', '');

                return (
                  <div
                    key={finding.theme}
                    className={`absolute ${size} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold shadow-xl hover:scale-110 transition-transform duration-300 cursor-pointer group z-20`}
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  >
                    <span className="text-center text-xs px-1 leading-tight">{shortName}</span>

                    {/* Tooltip on hover - shows full theme name */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg z-30">
                      <div className="font-semibold">{finding.theme}</div>
                      <div className="text-gray-300">{language === 'en' ? 'Priority' : '우선순위'}: {priorityIdx + 1}</div>
                    </div>
                  </div>
                );
              })}

              {/* Connection lines (decorative) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {session.findings.findings.slice(0, 5).map((finding, idx) => {
                  const themeCount = Math.min(session.findings!.findings.length, 5);
                  const angle = (360 / themeCount) * idx - 90;
                  return (
                    <div
                      key={`line-${idx}`}
                      className="absolute w-24 h-0.5 bg-gradient-to-r from-primary-300/50 to-transparent origin-left"
                      style={{
                        transform: `rotate(${angle}deg)`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

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

        {/* Key Takeaways End - Close resultsRef wrapper */}
        </div>

        {/* Action Buttons - Outside of image export */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {language === 'en' ? 'What\'s Next?' : '다음 단계는?'}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/discover/life-themes/findings')}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
            >
              <Star className="w-6 h-6 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900">
                {language === 'en' ? 'Review Findings' : '결과 검토'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'Edit themes and stories' : '주제와 이야기 수정'}
              </p>
            </button>

            <button
              onClick={() => router.push('/discover/errc')}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
            >
              <Target className="w-6 h-6 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900">
                {language === 'en' ? 'ERRC Action Plan' : 'ERRC 실행 계획'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'Create behavior change actions' : '행동 변화 계획 수립'}
              </p>
            </button>

            <button
              onClick={() => router.push('/discover')}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
            >
              <Home className="w-6 h-6 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900">
                {language === 'en' ? 'Explore More' : '더 탐색하기'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'Discover other modules' : '다른 모듈 알아보기'}
              </p>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/life-themes/followup')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-white/50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {language === 'en' ? 'Back to Follow-up' : '후속 질문으로'}
          </button>

          <button
            onClick={() => router.push('/discover')}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
          >
            {language === 'en' ? 'Continue to Dashboard' : '대시보드로 이동'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
