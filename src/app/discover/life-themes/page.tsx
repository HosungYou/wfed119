'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Users,
  Tv,
  Palette,
  Quote,
  BookOpen,
  Brain,
  Sparkles,
  Target,
  Home,
  LayoutDashboard,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useModuleProgress, useAllModulesProgress } from '@/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n';
import { QUESTION_CONFIG, LIFE_THEMES_STEPS, QuestionNumber } from '@/lib/types/lifeThemes';
import { SessionResetButton } from '@/components/modules/SessionResetButton';
import { AlertTriangle } from 'lucide-react';

interface ModuleProgress {
  lifeThemes: {
    exists: boolean;
    currentStep: string;
    progress: number;
    completedQuestions: QuestionNumber[];
    hasFindings: boolean;
    hasFollowUp: boolean;
  };
}

const QUESTION_ICONS: Record<QuestionNumber, React.ReactNode> = {
  1: <Users className="w-6 h-6" />,
  2: <Tv className="w-6 h-6" />,
  3: <Palette className="w-6 h-6" />,
  4: <Quote className="w-6 h-6" />,
  5: <BookOpen className="w-6 h-6" />,
  6: <Brain className="w-6 h-6" />,
};

const STEP_ROUTES: Record<string, string> = {
  role_models: '/discover/life-themes/questions/1',
  media: '/discover/life-themes/questions/2',
  hobbies: '/discover/life-themes/questions/3',
  mottos: '/discover/life-themes/questions/4',
  subjects: '/discover/life-themes/questions/5',
  memories: '/discover/life-themes/questions/6',
  findings: '/discover/life-themes/findings',
  followup: '/discover/life-themes/followup',
  results: '/discover/life-themes/results',
};

export default function LifeThemesLanding() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(null);
  const { startModule } = useModuleProgress('life-themes');
  const { completedModules, loading: prerequisiteLoading } = useAllModulesProgress();
  const [refreshKey, setRefreshKey] = useState(0);
  const [prerequisiteMet, setPrerequisiteMet] = useState<boolean | null>(null);

  // Check prerequisite: Enneagram must be completed first
  useEffect(() => {
    if (prerequisiteLoading) return;

    const completedSet = new Set(completedModules);
    const hasEnneagram = completedSet.has('enneagram');
    setPrerequisiteMet(hasEnneagram);

    if (!hasEnneagram) {
      // Don't redirect immediately - show a message first
      setLoading(false);
      return;
    }

    // Prerequisite met - start module and fetch progress
    startModule();
    fetchModuleProgress();
  }, [completedModules, prerequisiteLoading, refreshKey, startModule]);

  async function fetchModuleProgress() {
    try {
      const res = await fetch('/api/life-themes/session');
      const data = res.ok ? await res.json() : {};

      const completedQuestions: QuestionNumber[] = [];
      if (data.responses) {
        data.responses.forEach((r: { question_number: QuestionNumber; is_completed: boolean }) => {
          if (r.is_completed) {
            completedQuestions.push(r.question_number);
          }
        });
      }

      const progress: ModuleProgress = {
        lifeThemes: {
          exists: !!data.id,
          currentStep: data.current_step || 'role_models',
          progress: calculateProgress(data.current_step, completedQuestions),
          completedQuestions,
          hasFindings: data.findings?.findings?.length > 0,
          hasFollowUp: !!data.followup,
        },
      };

      setModuleProgress(progress);
      setLoading(false);
    } catch (error) {
      console.error('[Life Themes Landing] Error:', error);
      setLoading(false);
    }
  }

  function calculateProgress(step: string, completedQuestions: QuestionNumber[]): number {
    const questionProgress = (completedQuestions.length / 6) * 60;
    const stepProgress = {
      findings: 70,
      followup: 85,
      results: 100,
    };
    if (step in stepProgress) {
      return stepProgress[step as keyof typeof stepProgress];
    }
    return questionProgress;
  }

  function handleStartOrContinue() {
    if (moduleProgress?.lifeThemes.exists) {
      const step = moduleProgress.lifeThemes.currentStep;
      router.push(STEP_ROUTES[step] || '/discover/life-themes/questions/1');
    } else {
      router.push('/discover/life-themes/questions/1');
    }
  }

  // Show loading state
  if (loading || prerequisiteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading module status...</p>
        </div>
      </div>
    );
  }

  // Show prerequisite not met message
  if (prerequisiteMet === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {language === 'en' ? 'Complete Enneagram First' : '에니어그램을 먼저 완료하세요'}
            </h1>
            <p className="text-gray-600 mb-6">
              {language === 'en'
                ? 'You need to complete the Enneagram assessment before starting Life Themes. This ensures a better personalized experience.'
                : 'Life Themes를 시작하기 전에 에니어그램 진단을 완료해야 합니다. 이를 통해 더 나은 맞춤형 경험을 제공할 수 있습니다.'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/discover/enneagram')}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                {language === 'en' ? 'Go to Enneagram' : '에니어그램으로 이동'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center justify-center px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl font-medium transition-all"
              >
                <LayoutDashboard className="mr-2 w-5 h-5" />
                {language === 'en' ? 'Back to Dashboard' : '대시보드로 돌아가기'}
              </button>
            </div>
          </div>
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
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-lg transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{language === 'en' ? 'Dashboard' : '대시보드'}</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg font-medium">
              {language === 'en' ? 'Life Themes' : '생애 주제'}
            </span>
          </div>

          {/* Session Reset Button */}
          {moduleProgress?.lifeThemes.exists && (
            <SessionResetButton
              moduleId="life-themes"
              moduleName={{ ko: '생애 주제', en: 'Life Themes' }}
              apiEndpoint="/api/life-themes/session"
              onReset={() => setRefreshKey(k => k + 1)}
            />
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl mb-6 shadow-lg transform hover:scale-105 transition-transform">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {language === 'en' ? 'Life Themes Discovery' : '생애 주제 발견'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Discover the recurring themes that shape your identity through 6 reflective questions'
              : '6가지 성찰적 질문을 통해 당신의 정체성을 형성하는 반복적인 주제를 발견하세요'}
          </p>
        </div>

        {/* About This Module */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">About This Module</h2>

          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 mb-6">
            <p className="text-gray-700 leading-relaxed">
              Based on <strong>Mark Savickas&apos; Career Construction Interview</strong>, this module guides you through
              6 carefully designed questions that reveal your core life themes. By reflecting on your role models,
              interests, memories, and values, you&apos;ll uncover patterns that define who you are and what drives you.
            </p>
          </div>

          {/* 6 Questions Overview - VS Diverge Design with Parallax Depth */}
          <h3 className="font-semibold text-gray-900 mb-4">
            {language === 'en' ? 'The 6 Questions' : '6가지 질문'}
          </h3>
          <div className="relative mb-6">
            {/* Parallax depth layers - Ambient floating elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-10 right-10 w-32 h-32 bg-primary-200/20 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-secondary-200/20 rounded-full blur-3xl animate-float-delayed" />
            </div>

            {/* Asymmetric masonry-style grid */}
            <div className="grid grid-cols-12 gap-4 relative">
              {([1, 2, 3, 4, 5, 6] as QuestionNumber[]).map((num, idx) => {
                const config = QUESTION_CONFIG[num];
                const isCompleted = moduleProgress?.lifeThemes.completedQuestions.includes(num);

                // Asymmetric column spans: 1,2 = 6 cols, 3,4 = 4 cols, 5,6 = 6 cols
                const colSpan = idx === 2 || idx === 3 ? 'col-span-12 md:col-span-4' : 'col-span-12 md:col-span-6';

                return (
                  <div
                    key={num}
                    className={`${colSpan} group relative animate-fade-in-up-stagger`}
                    style={{
                      animationDelay: `${idx * 100}ms`,
                    }}
                  >
                    <div className={`
                      relative p-5 rounded-2xl border-2 transition-all duration-500
                      hover:scale-[1.02] hover:rotate-[-0.5deg]
                      ${isCompleted
                        ? 'border-green-300 bg-green-50 shadow-[0_8px_30px_rgba(74,222,128,0.15)]'
                        : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50 hover:shadow-[0_8px_30px_rgba(226,107,66,0.1)]'
                      }
                    `}>
                      {/* Ambient glow on hover */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-200/0 to-secondary-200/0 group-hover:from-primary-200/20 group-hover:to-secondary-200/10 transition-all duration-500 pointer-events-none" />

                      <div className="relative flex items-start gap-4">
                        {/* Icon with micro-interaction */}
                        <div className={`
                          p-3 rounded-xl transition-all duration-300
                          group-hover:rotate-[-8deg] group-hover:scale-110
                          ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'}
                        `}>
                          {QUESTION_ICONS[num]}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 text-lg">{config.title}</span>
                            {isCompleted && (
                              <CheckCircle2 className="w-5 h-5 text-green-600 animate-scale-in" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{config.prompt}</p>
                        </div>
                      </div>

                      {/* Progress indicator dot */}
                      <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Journey Steps */}
          <h3 className="font-semibold text-gray-900 mb-4">Your Journey</h3>
          <div className="flex flex-wrap items-center gap-2">
            {LIFE_THEMES_STEPS.map((stepConfig, idx) => {
              const isActive = moduleProgress?.lifeThemes.currentStep === stepConfig.step;
              const isCompleted = idx < LIFE_THEMES_STEPS.findIndex(
                s => s.step === moduleProgress?.lifeThemes.currentStep
              );

              return (
                <div key={stepConfig.step} className="flex items-center">
                  <div className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${isActive ? 'bg-primary-600 text-white' :
                      isCompleted ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-500'}
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 inline mr-1" /> : null}
                    {stepConfig.title}
                  </div>
                  {idx < LIFE_THEMES_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 mx-1 text-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Module Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">What You&apos;ll Discover</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <OverviewCard
              icon={<Brain className="w-8 h-8 text-primary-600" />}
              title="Deep Self-Reflection"
              description="Explore your admired figures, interests, memories, and values through guided questions"
            />
            <OverviewCard
              icon={<Target className="w-8 h-8 text-purple-600" />}
              title="Pattern Recognition"
              description="Identify recurring themes that appear across different aspects of your life"
            />
            <OverviewCard
              icon={<Sparkles className="w-8 h-8 text-pink-600" />}
              title="Life Themes"
              description="Synthesize your patterns into core themes that define your identity and purpose"
            />
          </div>

          {/* Learning Objectives */}
          <div className="mt-8 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Learning Objectives</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Reflect deeply on formative experiences, interests, and values</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Identify patterns that connect different areas of your life</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Articulate your core life themes and how they guide your decisions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Progress Indicator */}
        {moduleProgress?.lifeThemes.exists && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Progress</h2>
            <div className="relative">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-600 transition-all duration-500"
                  style={{ width: `${moduleProgress.lifeThemes.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {moduleProgress.lifeThemes.progress}% Complete •
                {moduleProgress.lifeThemes.completedQuestions.length} of 6 questions answered
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {([1, 2, 3, 4, 5, 6] as QuestionNumber[]).map((num) => {
                  const isCompleted = moduleProgress.lifeThemes.completedQuestions.includes(num);
                  return (
                    <span
                      key={num}
                      className={`px-3 py-1 rounded-full text-sm ${
                        isCompleted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isCompleted ? '✓' : '○'} Q{num}: {QUESTION_CONFIG[num].title}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={handleStartOrContinue}
            className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-primary-500 to-secondary-600 text-white hover:shadow-xl hover:scale-105 transition-all duration-200 shadow-lg"
          >
            {moduleProgress?.lifeThemes.exists ? 'Continue Discovery' : 'Start Discovery'}
            <ArrowRight className="ml-2 w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface OverviewCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function OverviewCard({ icon, title, description }: OverviewCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
