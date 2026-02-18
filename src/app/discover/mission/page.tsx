'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Home, CheckCircle, Circle, Heart, Target, Sparkles } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton } from '@/components/modules';

interface ModuleStatus {
  values: boolean;
  enneagram: boolean;
  lifeThemes: boolean;
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
        values: prereqData.values || false,
        enneagram: prereqData.enneagram || false,
        lifeThemes: prereqData.lifeThemes || false,
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

  const canProceed = status?.values && status?.enneagram && status?.lifeThemes;
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
              ? '가치관, 기여대상, 행동동사를 조합하여 나만의 사명 선언문을 직접 만들어갑니다.'
              : 'Build your personal mission statement by assembling values, contribution targets, and action verbs.'}
          </p>
        </div>

        {/* Prerequisites Card */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '선수 모듈 상태' : 'Prerequisites Status'}
          </h2>

          <div className="grid grid-cols-3 gap-4">
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

            <div className={`p-4 rounded-lg border-2 ${status?.enneagram ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`w-5 h-5 ${status?.enneagram ? 'text-green-600' : 'text-gray-400'}`} />
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
                <Target className={`w-5 h-5 ${status?.lifeThemes ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">
                  {language === 'ko' ? '생애 주제' : 'Life Themes'}
                </span>
              </div>
              {status?.lifeThemes ? (
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
                  ? '가치관, 에니어그램, 생애 주제 모듈을 먼저 완료해주세요.'
                  : 'Please complete the Values, Enneagram, and Life Themes modules first.'}
              </p>
            </div>
          )}
        </ModuleCard>

        {/* Steps Overview */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '4단계 과정' : '4-Step Process'}
          </h2>

          <div className="space-y-3">
            {[
              { step: 1, title: language === 'ko' ? '가치관 요약 및 선택' : 'Values Summary & Selection', desc: language === 'ko' ? '핵심 가치관을 검토하고 사명과 연결되는 가치를 선택합니다' : 'Review core values and select ones most connected to your mission' },
              { step: 2, title: language === 'ko' ? '사명 구성요소' : 'Mission Components', desc: language === 'ko' ? '기여 대상과 행동 동사를 선택합니다' : 'Select contribution targets and action verbs' },
              { step: 3, title: language === 'ko' ? '사명 작성 (3라운드)' : 'Mission Drafting (3 Rounds)', desc: language === 'ko' ? '구성요소를 조합하여 사명 선언문을 작성합니다' : 'Assemble components into your mission statement through 3 rounds' },
              { step: 4, title: language === 'ko' ? '성찰' : 'Reflection', desc: language === 'ko' ? '완성된 사명 선언문에 대해 성찰합니다' : 'Reflect on your completed mission statement' },
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
