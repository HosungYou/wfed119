'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Home, CheckCircle, Circle, Heart, Target, Compass, Brain } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton } from '@/components/modules';

interface ModuleStatus {
  enneagram: boolean;
  lifeThemes: boolean;
  values: boolean;
  mission: {
    started: boolean;
    currentStep: number;
    completed: boolean;
  };
}

export default function MissionModuleLanding() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ModuleStatus | null>(null);
  const { startModule, canStartModule } = useModuleProgress('mission');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      // Check prerequisites
      const prereqRes = await fetch('/api/discover/mission/check-prerequisites');
      const prereqData = await prereqRes.json();

      // Check mission session
      const sessionRes = await fetch('/api/discover/mission/session');
      const sessionData = await sessionRes.json();

      setStatus({
        enneagram: prereqData.enneagram || false,
        lifeThemes: prereqData.lifeThemes || false,
        values: prereqData.values || false,
        mission: {
          started: sessionData.current_step > 0,
          currentStep: sessionData.current_step || 0,
          completed: sessionData.status === 'completed',
        },
      });

      setLoading(false);
    } catch (error) {
      console.error('[Mission Landing] Error:', error);
      setLoading(false);
    }
  }

  async function handleStart() {
    if (!canStartModule) {
      alert(language === 'ko'
        ? '이전 모듈을 먼저 완료해주세요.'
        : 'Please complete previous modules first.');
      return;
    }

    await startModule();
    router.push('/discover/mission/step1');
  }

  async function handleContinue() {
    const step = status?.mission.currentStep || 1;
    router.push(`/discover/mission/step${step}`);
  }

  async function handleRestart() {
    if (!confirm(language === 'ko'
      ? '새로 시작하시겠습니까? 현재 진행 상황이 초기화됩니다.'
      : 'Start fresh? Your current progress will be reset.')) {
      return;
    }

    try {
      await fetch('/api/discover/mission/session', { method: 'DELETE' });
      await startModule();
      router.push('/discover/mission/step1');
    } catch (error) {
      console.error('[Mission Landing] Reset error:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'ko' ? '로딩 중...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const canProceed = status?.enneagram && status?.lifeThemes && status?.values;
  const hasStarted = status?.mission.started;

  return (
    <ModuleShell moduleId="mission" showProgress={false}>
      <div className="max-w-3xl mx-auto">
        {/* Module Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '사명 선언문' : 'Mission Statement'}
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            {language === 'ko'
              ? '당신의 가치와 비전을 바탕으로 삶의 목적을 정의하는 사명 선언문을 작성합니다.'
              : 'Craft a personal mission statement that defines your life purpose based on your values and vision.'}
          </p>
        </div>

        {/* Prerequisites Card */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '선수 모듈 상태' : 'Prerequisites Status'}
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 ${status?.enneagram ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Brain className={`w-5 h-5 ${status?.enneagram ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">
                  {language === 'ko' ? '에니어그램' : 'Enneagram'}
                </span>
              </div>
              {status?.enneagram ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${status?.lifeThemes ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Compass className={`w-5 h-5 ${status?.lifeThemes ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">
                  {language === 'ko' ? '삶의 테마' : 'Life Themes'}
                </span>
              </div>
              {status?.lifeThemes ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${status?.values ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Heart className={`w-5 h-5 ${status?.values ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">
                  {language === 'ko' ? '가치관' : 'Values'}
                </span>
              </div>
              {status?.values ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>
          </div>

          {!canProceed && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {language === 'ko'
                  ? '💡 에니어그램, 삶의 테마, 가치관 모듈을 먼저 완료하면 사명 선언문을 작성할 수 있습니다.'
                  : '💡 Complete Enneagram, Life Themes, and Values modules first to start your mission statement.'}
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
              { step: 1, title: language === 'ko' ? '가치관 검토' : 'Values Review', desc: language === 'ko' ? '핵심 가치관을 검토하고 선택합니다' : 'Review and select your core values' },
              { step: 2, title: language === 'ko' ? '삶의 역할 탐색' : 'Life Roles Mapping', desc: language === 'ko' ? '나를 중심으로 삶의 관계와 역할을 매핑합니다' : 'Map relationships and roles around yourself' },
              { step: 3, title: language === 'ko' ? '자기 역할 성찰' : 'Self-Role Reflection', desc: language === 'ko' ? 'Sharpen the Saw: 5가지 웰빙 차원 성찰' : 'Sharpen the Saw: Reflect on 5 wellbeing dimensions' },
              { step: 4, title: language === 'ko' ? '역할과 헌신' : 'Roles & Commitment', desc: language === 'ko' ? 'Life Rainbow와 R&C 테이블 작성' : 'Complete Life Rainbow and R&C Table' },
              { step: 5, title: language === 'ko' ? '사명 선언문' : 'Mission Statement', desc: language === 'ko' ? 'AI와 함께 사명 선언문을 작성합니다' : 'Draft and finalize your mission statement with AI' },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  status?.mission.currentStep >= item.step
                    ? 'bg-teal-50 border border-teal-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  status?.mission.currentStep > item.step
                    ? 'bg-teal-500 text-white'
                    : status?.mission.currentStep === item.step
                    ? 'bg-teal-100 text-teal-700 border-2 border-teal-500'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {status?.mission.currentStep > item.step ? '✓' : item.step}
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
                className="w-full"
              >
                {language === 'ko' ? `계속하기 (${status?.mission.currentStep}단계)` : `Continue (Step ${status?.mission.currentStep})`}
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
              className="w-full"
              disabled={!canStartModule}
            >
              {language === 'ko' ? '사명 선언문 작성 시작' : 'Start Mission Statement'}
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
