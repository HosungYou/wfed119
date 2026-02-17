'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Home, CheckCircle, Circle, Heart, Target, Sparkles, Users } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton } from '@/components/modules';

const STEPS = [
  { id: 'step1', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step2', label: 'Life Rainbow', labelKo: '인생 무지개' },
  { id: 'step3', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step4', label: 'Reflection', labelKo: '성찰' },
];

interface LifeRolesStatus {
  prerequisites: {
    canStart: boolean;
    hasMission: boolean;
    hasValues: boolean;
    hasEnneagram: boolean;
    hasLifeThemes: boolean;
  };
  session: {
    started: boolean;
    currentStep: number;
    completed: boolean;
  };
}

export default function LifeRolesModuleLanding() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<LifeRolesStatus | null>(null);
  const { startModule, canStartModule } = useModuleProgress('life-roles');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      // Check prerequisites
      const prereqRes = await fetch('/api/discover/life-roles/check-prerequisites');
      const prereqData = await prereqRes.json();

      // Check life-roles session
      const sessionRes = await fetch('/api/discover/life-roles/session');
      const sessionData = await sessionRes.json();

      setStatus({
        prerequisites: {
          canStart: prereqData.canStart || false,
          hasMission: prereqData.hasMission || false,
          hasValues: prereqData.hasValues || false,
          hasEnneagram: prereqData.hasEnneagram || false,
          hasLifeThemes: prereqData.hasLifeThemes || false,
        },
        session: {
          started: sessionData.current_step > 0,
          currentStep: sessionData.current_step || 0,
          completed: sessionData.status === 'completed',
        },
      });

      setLoading(false);
    } catch (error) {
      console.error('[Life Roles Landing] Error:', error);
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
    router.push('/discover/life-roles/step1');
  }

  async function handleContinue() {
    const step = status?.session.currentStep || 1;
    router.push(`/discover/life-roles/step${step}`);
  }

  async function handleRestart() {
    if (!confirm(language === 'ko'
      ? '새로 시작하시겠습니까? 현재 진행 상황이 초기화됩니다.'
      : 'Start fresh? Your current progress will be reset.')) {
      return;
    }

    try {
      await fetch('/api/discover/life-roles/session', { method: 'DELETE' });
      await startModule();
      router.push('/discover/life-roles/step1');
    } catch (error) {
      console.error('[Life Roles Landing] Reset error:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'ko' ? '로딩 중...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const canProceed = status?.prerequisites.canStart;
  const hasStarted = status?.session.started;

  return (
    <ModuleShell moduleId="life-roles" showProgress={false}>
      <div className="max-w-3xl mx-auto">
        {/* Module Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '생애 역할 & 헌신' : 'Life Roles & Commitment'}
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            {language === 'ko'
              ? '삶의 역할을 탐색하고, 인생 무지개를 시각화하며, 사명과 가치에 맞는 헌신을 작성합니다.'
              : 'Explore your life roles, visualize your life rainbow, and create commitments aligned with your mission and values.'}
          </p>
        </div>

        {/* Prerequisites Card */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '선수 모듈 상태' : 'Prerequisites Status'}
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className={`p-4 rounded-lg border-2 ${status?.prerequisites.hasValues ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Heart className={`w-5 h-5 ${status?.prerequisites.hasValues ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">
                  {language === 'ko' ? '가치관' : 'Values'}
                </span>
              </div>
              {status?.prerequisites.hasValues ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${status?.prerequisites.hasEnneagram ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`w-5 h-5 ${status?.prerequisites.hasEnneagram ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">
                  {language === 'ko' ? '에니어그램' : 'Enneagram'}
                </span>
              </div>
              {status?.prerequisites.hasEnneagram ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${status?.prerequisites.hasLifeThemes ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`w-5 h-5 ${status?.prerequisites.hasLifeThemes ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">
                  {language === 'ko' ? '생애 주제' : 'Life Themes'}
                </span>
              </div>
              {status?.prerequisites.hasLifeThemes ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${status?.prerequisites.hasMission ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className={`w-5 h-5 ${status?.prerequisites.hasMission ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">
                  {language === 'ko' ? '사명' : 'Mission'}
                </span>
              </div>
              {status?.prerequisites.hasMission ? (
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
                  ? '💡 이전 모듈을 완료하면 더 맞춤화된 생애 역할 탐색을 할 수 있습니다.'
                  : '💡 Complete previous modules first for a more personalized life roles exploration.'}
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
              { step: 1, title: language === 'ko' ? STEPS[0].labelKo : STEPS[0].label, desc: language === 'ko' ? '관계 대상과 역할을 매핑합니다' : 'Map your relationship entities and roles' },
              { step: 2, title: language === 'ko' ? STEPS[1].labelKo : STEPS[1].label, desc: language === 'ko' ? '생애 단계에 걸쳐 역할을 시각화합니다' : 'Visualize your life roles across life stages' },
              { step: 3, title: language === 'ko' ? STEPS[2].labelKo : STEPS[2].label, desc: language === 'ko' ? '역할과 헌신(R&C) 테이블을 작성합니다' : 'Complete the Roles & Commitment table' },
              { step: 4, title: language === 'ko' ? STEPS[3].labelKo : STEPS[3].label, desc: language === 'ko' ? 'AI 균형 평가를 받고 성찰합니다' : 'Reflect and receive AI balance assessment' },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  (status?.session.currentStep ?? 0) >= item.step
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  (status?.session.currentStep ?? 0) > item.step
                    ? 'bg-amber-500 text-white'
                    : (status?.session.currentStep ?? 0) === item.step
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {(status?.session.currentStep ?? 0) > item.step ? '✓' : item.step}
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
                {language === 'ko' ? `계속하기 (${status?.session.currentStep}단계)` : `Continue (Step ${status?.session.currentStep})`}
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
              {language === 'ko' ? '생애 역할 탐색 시작' : 'Start Life Roles & Commitment'}
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
