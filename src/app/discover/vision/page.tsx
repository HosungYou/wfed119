'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Home, CheckCircle, Circle, Eye, Heart, Target, Sparkles } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton } from '@/components/modules';

interface ModuleStatus {
  values: boolean;
  strengths: boolean;
  enneagram: boolean;
  lifeThemes: boolean;
  vision: {
    started: boolean;
    currentStep: number;
    completed: boolean;
  };
}

export default function VisionModuleLanding() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ModuleStatus | null>(null);
  const { startModule, canStartModule } = useModuleProgress('vision');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const prereqRes = await fetch('/api/discover/vision/check-prerequisites');
      const prereqData = await prereqRes.json();

      const sessionRes = await fetch('/api/discover/vision/session');
      const sessionData = await sessionRes.json();

      setStatus({
        values: prereqData.values || false,
        strengths: prereqData.strengths || false,
        enneagram: prereqData.enneagram || false,
        lifeThemes: prereqData.lifeThemes || false,
        vision: {
          started: sessionData.current_step > 0,
          currentStep: sessionData.current_step || 0,
          completed: sessionData.is_completed || false,
        },
      });
      setLoading(false);
    } catch (error) {
      console.error('[Vision Landing] Error:', error);
      setLoading(false);
    }
  }

  async function handleStart() {
    await startModule();
    router.push('/discover/vision/time-horizon');
  }

  async function handleContinue() {
    const step = status?.vision.currentStep || 1;
    const routes = ['time-horizon', 'future-imagery', 'core-aspirations', 'step4-dreams', 'vision-statement'];
    router.push(`/discover/vision/${routes[step - 1] || routes[0]}`);
  }

  async function handleRestart() {
    if (!confirm(language === 'ko'
      ? '새로 시작하시겠습니까? 현재 진행 상황이 초기화됩니다.'
      : 'Start fresh? Your current progress will be reset.')) {
      return;
    }
    try {
      await fetch('/api/discover/vision/session', { method: 'DELETE' });
      await startModule();
      router.push('/discover/vision/time-horizon');
    } catch (error) {
      console.error('[Vision Landing] Reset error:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'ko' ? '로딩 중...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const hasStarted = status?.vision.started;

  return (
    <ModuleShell moduleId="vision" showProgress={false}>
      <div className="max-w-3xl mx-auto">
        {/* Module Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Eye className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '비전 & 꿈' : 'Vision & Dreams'}
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            {language === 'ko'
              ? '당신의 가치관과 강점을 바탕으로 미래 비전과 꿈의 매트릭스를 작성합니다.'
              : 'Craft your future vision and dreams matrix based on your values and strengths.'}
          </p>
        </div>

        {/* Prerequisites Card */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '선수 모듈 상태' : 'Prerequisites Status'}
          </h2>

          <div className="grid grid-cols-4 gap-3">
            {[
              { key: 'values', icon: Heart, label: language === 'ko' ? '가치관' : 'Values', done: status?.values },
              { key: 'strengths', icon: Target, label: language === 'ko' ? '강점' : 'Strengths', done: status?.strengths },
              { key: 'enneagram', icon: Sparkles, label: language === 'ko' ? '에니어그램' : 'Enneagram', done: status?.enneagram },
              { key: 'life-themes', icon: Sparkles, label: language === 'ko' ? '생애주제' : 'Life Themes', done: status?.lifeThemes },
            ].map((item) => (
              <div
                key={item.key}
                className={`p-3 rounded-lg border-2 text-center ${
                  item.done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.done ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-xs font-medium block truncate">{item.label}</span>
                {item.done ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>

          {!status?.lifeThemes && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {language === 'ko'
                  ? '💡 이전 모듈을 완료하면 더 개인화된 비전을 작성할 수 있습니다.'
                  : '💡 Complete previous modules for a more personalized vision experience.'}
              </p>
            </div>
          )}
        </ModuleCard>

        {/* Steps Overview */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '5단계 과정' : '5-Step Process'}
          </h2>

          <div className="space-y-3">
            {[
              { step: 1, title: language === 'ko' ? '시간 지평선' : 'Time Horizon', desc: language === 'ko' ? '3년, 5년, 10년 중 선택' : 'Choose 3, 5, or 10 years' },
              { step: 2, title: language === 'ko' ? '미래 이미지' : 'Future Imagery', desc: language === 'ko' ? '미래의 당신을 상상합니다' : 'Visualize your future self' },
              { step: 3, title: language === 'ko' ? '핵심 열망' : 'Core Aspirations', desc: language === 'ko' ? '가장 중요한 열망을 정의합니다' : 'Define your most important aspirations' },
              { step: 4, title: language === 'ko' ? '꿈 매트릭스' : 'Dreams Matrix', desc: language === 'ko' ? '7가지 웰빙 영역별 꿈 작성' : 'Map dreams across 7 wellbeing dimensions' },
              { step: 5, title: language === 'ko' ? '비전 선언문' : 'Vision Statement', desc: language === 'ko' ? 'AI와 함께 비전 선언문 작성' : 'Craft your vision statement with AI' },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  status?.vision.currentStep >= item.step
                    ? 'bg-purple-50 border border-purple-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  status?.vision.currentStep > item.step
                    ? 'bg-purple-500 text-white'
                    : status?.vision.currentStep === item.step
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {status?.vision.currentStep > item.step ? '✓' : item.step}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </ModuleCard>

        {/* Actions */}
        <div className="space-y-3">
          {hasStarted ? (
            <>
              <ModuleButton
                onClick={handleContinue}
                size="large"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {language === 'ko' ? `계속하기 (${status?.vision.currentStep}단계)` : `Continue (Step ${status?.vision.currentStep})`}
                <ArrowRight className="w-5 h-5 ml-2" />
              </ModuleButton>
              <ModuleButton
                onClick={handleRestart}
                variant="secondary"
                className="w-full"
              >
                {language === 'ko' ? '새로 시작' : 'Start Fresh'}
              </ModuleButton>
            </>
          ) : (
            <ModuleButton
              onClick={handleStart}
              size="large"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={!canStartModule}
            >
              {language === 'ko' ? '비전 작성 시작' : 'Start Vision Journey'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </ModuleButton>
          )}

          <ModuleButton
            onClick={() => router.push('/')}
            variant="ghost"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            {language === 'ko' ? '홈으로' : 'Back to Home'}
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
