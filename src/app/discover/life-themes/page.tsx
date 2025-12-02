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
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { QUESTION_CONFIG, LIFE_THEMES_STEPS, QuestionNumber } from '@/lib/types/lifeThemes';

interface ModuleProgress {
  lifeThemes: {
    exists: boolean;
    currentStep: string;
    progress: number;
    completedQuestions: QuestionNumber[];
    hasPatterns: boolean;
    hasThemes: boolean;
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
  patterns: '/discover/life-themes/patterns',
  themes: '/discover/life-themes/themes',
  results: '/discover/life-themes/results',
};

export default function LifeThemesLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(null);
  const { startModule } = useModuleProgress('life-themes');

  useEffect(() => {
    startModule();
    fetchModuleProgress();
  }, [startModule]);

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
          hasPatterns: data.patterns?.length > 0,
          hasThemes: data.themes?.length > 0,
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
      patterns: 70,
      themes: 85,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading module status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Life Themes Discovery
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the recurring themes that shape your identity through 6 reflective questions
          </p>
        </div>

        {/* About This Module */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">About This Module</h2>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
            <p className="text-gray-700 leading-relaxed">
              Based on <strong>Mark Savickas&apos; Career Construction Interview</strong>, this module guides you through
              6 carefully designed questions that reveal your core life themes. By reflecting on your role models,
              interests, memories, and values, you&apos;ll uncover patterns that define who you are and what drives you.
            </p>
          </div>

          {/* 6 Questions Overview */}
          <h3 className="font-semibold text-gray-900 mb-4">The 6 Questions</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {([1, 2, 3, 4, 5, 6] as QuestionNumber[]).map((num) => {
              const config = QUESTION_CONFIG[num];
              const isCompleted = moduleProgress?.lifeThemes.completedQuestions.includes(num);

              return (
                <div
                  key={num}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isCompleted
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      isCompleted ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {QUESTION_ICONS[num]}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{config.title}</span>
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{config.prompt}</p>
                </div>
              );
            })}
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
                    ${isActive ? 'bg-indigo-600 text-white' :
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
              icon={<Brain className="w-8 h-8 text-indigo-600" />}
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
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
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
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
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
            className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:scale-105 transition-all duration-200 shadow-lg"
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
