'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Home, CheckCircle, Circle, Grid3X3, Eye, Target, Lightbulb } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton } from '@/components/modules';

interface ModuleStatus {
  vision: boolean;
  mission: boolean;
  careerOptions: boolean;
  swot: {
    started: boolean;
    currentStage: string;
    completed: boolean;
  };
}

export default function SWOTModuleLanding() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ModuleStatus | null>(null);
  const { startModule, canStartModule } = useModuleProgress('swot');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      // Check SWOT session
      const swotRes = await fetch('/api/swot/session');
      const swotData = swotRes.ok ? await swotRes.json() : {};

      // Check prerequisites
      let visionDone = false;
      let missionDone = false;
      let careerDone = false;

      try {
        const visionRes = await fetch('/api/discover/vision/session');
        if (visionRes.ok) {
          const visionData = await visionRes.json();
          visionDone = visionData.is_completed || false;
        }
      } catch {}

      try {
        const missionRes = await fetch('/api/discover/mission/session');
        if (missionRes.ok) {
          const missionData = await missionRes.json();
          missionDone = missionData.status === 'completed';
        }
      } catch {}

      try {
        const careerRes = await fetch('/api/discover/career-options/session');
        if (careerRes.ok) {
          const careerData = await careerRes.json();
          careerDone = careerData.status === 'completed';
        }
      } catch {}

      setStatus({
        vision: visionDone,
        mission: missionDone,
        careerOptions: careerDone,
        swot: {
          started: !!swotData.id,
          currentStage: swotData.current_stage || 'discovery',
          completed: swotData.is_completed || false,
        },
      });
      setLoading(false);
    } catch (error) {
      console.error('[SWOT Landing] Error:', error);
      setLoading(false);
    }
  }

  async function handleStart() {
    await startModule();
    router.push('/discover/swot/analysis');
  }

  async function handleContinue() {
    const stage = status?.swot.currentStage;
    if (stage === 'completed') {
      router.push('/discover/swot/reflection');
    } else if (stage === 'action') {
      router.push('/discover/swot/action');
    } else if (stage === 'goals') {
      router.push('/discover/swot/goals');
    } else if (stage === 'strategy') {
      router.push('/discover/swot/strategy');
    } else {
      router.push('/discover/swot/analysis');
    }
  }

  async function handleRestart() {
    if (!confirm(language === 'ko'
      ? '새로 시작하시겠습니까? 현재 진행 상황이 초기화됩니다.'
      : 'Start fresh? Your current progress will be reset.')) {
      return;
    }
    try {
      await fetch('/api/swot/session', { method: 'DELETE' });
      await startModule();
      router.push('/discover/swot/analysis');
    } catch (error) {
      console.error('[SWOT Landing] Reset error:', error);
    }
  }

  function getStageIndex(stage: string): number {
    const stages = ['discovery', 'strategy', 'goals', 'action', 'reflection'];
    return stages.indexOf(stage);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'ko' ? '로딩 중...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const hasStarted = status?.swot.started;
  const currentStageIndex = getStageIndex(status?.swot.currentStage || 'discovery');

  return (
    <ModuleShell moduleId="swot" showProgress={false}>
      <div className="max-w-3xl mx-auto">
        {/* Module Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Grid3X3 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? 'SWOT 분석' : 'SWOT Analysis'}
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            {language === 'ko'
              ? '비전을 바탕으로 강점, 약점, 기회, 위협을 분석하고 전략을 수립합니다.'
              : 'Analyze your strengths, weaknesses, opportunities, and threats based on your vision.'}
          </p>
        </div>

        {/* Prerequisites Card */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '선수 모듈 상태' : 'Prerequisites Status'}
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'vision', icon: Eye, label: language === 'ko' ? '비전' : 'Vision', done: status?.vision },
              { key: 'mission', icon: Target, label: language === 'ko' ? '사명' : 'Mission', done: status?.mission },
              { key: 'career', icon: Lightbulb, label: language === 'ko' ? '경력탐색' : 'Career', done: status?.careerOptions },
            ].map((item) => (
              <div
                key={item.key}
                className={`p-3 rounded-lg border-2 text-center ${
                  item.done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.done ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-xs font-medium">{item.label}</span>
                {item.done ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {language === 'ko'
                ? '💡 선수 모듈을 먼저 완료하면 더 정확한 SWOT 분석이 가능합니다.'
                : '💡 Complete previous modules for more accurate SWOT analysis.'}
            </p>
          </div>
        </ModuleCard>

        {/* Steps Overview */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '4단계 과정' : '4-Step Process'}
          </h2>

          <div className="space-y-3">
            {[
              { step: 0, title: language === 'ko' ? 'SWOT 분석' : 'SWOT Analysis', desc: language === 'ko' ? '강점, 약점, 기회, 위협 식별' : 'Identify strengths, weaknesses, opportunities, threats' },
              { step: 1, title: language === 'ko' ? '전략 수립' : 'Strategy Development', desc: language === 'ko' ? 'SO, WO, ST, WT 전략 도출' : 'Develop SO, WO, ST, WT strategies' },
              { step: 2, title: language === 'ko' ? '목표 설정' : 'Goal Setting', desc: language === 'ko' ? 'SMART 목표 설정' : 'Set SMART goals' },
              { step: 3, title: language === 'ko' ? '실행 계획' : 'Action Plan', desc: language === 'ko' ? 'ERRC 액션 플랜 작성' : 'Create ERRC action plan' },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  currentStageIndex >= item.step
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  currentStageIndex > item.step
                    ? 'bg-orange-500 text-white'
                    : currentStageIndex === item.step
                    ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStageIndex > item.step ? '✓' : item.step + 1}
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
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {language === 'ko' ? '계속하기' : 'Continue'}
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
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={!canStartModule}
            >
              {language === 'ko' ? 'SWOT 분석 시작' : 'Start SWOT Analysis'}
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
