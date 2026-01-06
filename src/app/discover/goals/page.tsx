'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Home, CheckCircle, Circle, Target, Grid3X3, Users, Compass, ClipboardCheck, Sparkles } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton } from '@/components/modules';

interface GoalObjective {
  goal_key_results?: { id: string }[];
}

interface GoalRole {
  id: string;
  goal_objectives?: GoalObjective[];
}

interface ModuleStatus {
  swot: {
    completed: boolean;
    hasStrategies: boolean;
  };
  goals: {
    exists: boolean;
    status: string;
    rolesCount: number;
    objectivesCount: number;
    keyResultsCount: number;
    currentStage: number;
  };
}

const STAGES = [
  { id: 'roles', name: { ko: '역할 설정', en: 'Role Setup' }, icon: Users, desc: { ko: '2-7개 인생 역할 정의', en: 'Define 2-7 life roles' } },
  { id: 'objectives', name: { ko: '목표 설정', en: 'Objectives' }, icon: Target, desc: { ko: 'OKR 기반 목표 설정', en: 'Set OKR-based goals' } },
  { id: 'key-results', name: { ko: '핵심 결과', en: 'Key Results' }, icon: Compass, desc: { ko: '측정 가능한 결과 정의', en: 'Define measurable outcomes' } },
  { id: 'actions', name: { ko: '실행 계획', en: 'Action Plans' }, icon: ClipboardCheck, desc: { ko: '구체적 액션 아이템 생성', en: 'Create specific action items' } },
  { id: 'reflection', name: { ko: '3가지 원칙', en: '3 Principles' }, icon: Sparkles, desc: { ko: '핵심 목표 설정 원칙 성찰', en: 'Reflect on core goal-setting principles' } },
];

export default function GoalSettingModuleLanding() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ModuleStatus | null>(null);
  const [durationMonths, setDurationMonths] = useState<3 | 6 | 12>(6);
  const { startModule, canStartModule } = useModuleProgress('goals');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      // Check SWOT completion
      const swotRes = await fetch('/api/swot/session');
      const swotData = swotRes.ok ? await swotRes.json() : {};

      // Check Goal Setting session
      const goalsRes = await fetch('/api/goals/session');
      const goalsData = goalsRes.ok ? await goalsRes.json() : null;

      const goalProgress: ModuleStatus = {
        swot: {
          completed: swotData.is_completed || false,
          hasStrategies: !!(swotData.so_strategies?.length || swotData.wo_strategies?.length),
        },
        goals: {
          exists: !!goalsData?.id,
          status: goalsData?.status || 'not_started',
          rolesCount: goalsData?.goal_roles?.length || 0,
          objectivesCount: goalsData?.goal_roles?.reduce((sum: number, r: GoalRole) =>
            sum + (r.goal_objectives?.length || 0), 0) || 0,
          keyResultsCount: goalsData?.goal_roles?.reduce((sum: number, r: GoalRole) =>
            sum + (r.goal_objectives?.reduce((s: number, o: GoalObjective) =>
              s + (o.goal_key_results?.length || 0), 0) || 0), 0) || 0,
          currentStage: getStageProgress(goalsData),
        },
      };

      setStatus(goalProgress);
      if (goalsData?.duration_months === 3 || goalsData?.duration_months === 6 || goalsData?.duration_months === 12) {
        setDurationMonths(goalsData.duration_months);
      }
      setLoading(false);
    } catch (error) {
      console.error('[Goal Setting] Error fetching progress:', error);
      setLoading(false);
    }
  }

  function getStageProgress(goalsData: { goal_roles?: GoalRole[] } | null): number {
    if (!goalsData?.goal_roles) return 0;
    const { goal_roles } = goalsData;
    const rolesCount = goal_roles.length;
    const objectivesCount = goal_roles.reduce((sum: number, r: GoalRole) => sum + (r.goal_objectives?.length || 0), 0);
    const keyResultsCount = goal_roles.reduce((sum: number, r: GoalRole) =>
      sum + (r.goal_objectives?.reduce((s: number, o: GoalObjective) => s + (o.goal_key_results?.length || 0), 0) || 0), 0);

    if (keyResultsCount > 0) return 4;
    if (objectivesCount > 0) return 3;
    if (rolesCount > 0) return 2;
    return 1;
  }

  async function handleStart() {
    try {
      // Get SWOT analysis ID first
      const swotRes = await fetch('/api/swot/session');
      const swotData = await swotRes.json();

      if (!swotData?.id) {
        alert(language === 'ko' ? 'SWOT 분석을 먼저 완료하세요.' : 'Please complete SWOT Analysis first.');
        router.push('/discover/swot');
        return;
      }

      // Create or get goal session
      const res = await fetch('/api/goals/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swot_analysis_id: swotData.id, duration_months: durationMonths }),
      });

      if (res.ok) {
        await startModule();
        router.push('/discover/goals/roles');
      }
    } catch (error) {
      console.error('[Goal Setting] Error starting:', error);
    }
  }

  async function handleContinue() {
    const currentStage = status?.goals.currentStage || 0;
    const routes = ['roles', 'objectives', 'key-results', 'actions', 'reflection'];
    await fetch('/api/goals/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_months: durationMonths }),
    });
    router.push(`/discover/goals/${routes[Math.min(currentStage, routes.length - 1)]}`);
  }

  async function handleRestart() {
    if (!confirm(language === 'ko'
      ? '새로 시작하시겠습니까? 현재 진행 상황이 초기화됩니다.'
      : 'Start fresh? Your current progress will be reset.')) {
      return;
    }
    try {
      await fetch('/api/goals/session', { method: 'DELETE' });
      setDurationMonths(6);
      await checkStatus();
    } catch (error) {
      console.error('[Goal Setting] Error resetting:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'ko' ? '로딩 중...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const hasStarted = status?.goals.exists;
  const currentStage = status?.goals.currentStage || 0;
  const canStart = status?.swot.completed || status?.swot.hasStrategies;

  return (
    <ModuleShell moduleId="goals" showProgress={false}>
      <div className="max-w-3xl mx-auto">
        {/* Module Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '목표 설정 (OKR)' : 'Goal Setting (OKR)'}
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            {language === 'ko'
              ? 'SWOT 분석을 바탕으로 역할별 OKR(목표 및 핵심 결과)를 설정합니다.'
              : 'Set OKR (Objectives & Key Results) for each life role based on your SWOT analysis.'}
          </p>
        </div>

        {/* Prerequisites */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '선수 모듈 상태' : 'Prerequisites Status'}
          </h2>

          <div className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
            status?.swot.completed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              status?.swot.completed ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              <Grid3X3 className={`w-6 h-6 ${status?.swot.completed ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {language === 'ko' ? 'SWOT 분석' : 'SWOT Analysis'}
              </p>
              <p className="text-sm text-gray-500">
                {status?.swot.completed
                  ? (language === 'ko' ? '완료됨' : 'Completed')
                  : (language === 'ko' ? '먼저 완료해주세요' : 'Please complete first')}
              </p>
            </div>
            {status?.swot.completed ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <button
                onClick={() => router.push('/discover/swot')}
                className="px-4 py-2 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
              >
                {language === 'ko' ? '이동' : 'Go'}
              </button>
            )}
          </div>
        </ModuleCard>

        {/* Duration Selector */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'ko' ? '목표 기간' : 'Goal Horizon'}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {language === 'ko' ? 'OKR 사이클 기간을 선택하세요.' : 'Choose a time frame for this OKR cycle.'}
          </p>
          <div className="flex gap-3">
            {[3, 6, 12].map((months) => (
              <button
                key={months}
                onClick={() => setDurationMonths(months as 3 | 6 | 12)}
                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  durationMonths === months
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-cyan-400'
                }`}
              >
                {months} {language === 'ko' ? '개월' : 'months'}
              </button>
            ))}
          </div>
        </ModuleCard>

        {/* Steps Overview */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '5단계 과정' : '5-Step Process'}
          </h2>

          <div className="space-y-3">
            {STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const isCompleted = index < currentStage;
              const isCurrent = index === currentStage;

              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    isCompleted || isCurrent
                      ? 'bg-cyan-50 border border-cyan-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isCompleted
                      ? 'bg-cyan-500 text-white'
                      : isCurrent
                      ? 'bg-cyan-100 text-cyan-700 border-2 border-cyan-500'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {language === 'ko' ? stage.name.ko : stage.name.en}
                    </p>
                    <p className="text-sm text-gray-500">
                      {language === 'ko' ? stage.desc.ko : stage.desc.en}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ModuleCard>

        {/* Stats (if started) */}
        {hasStarted && (
          <ModuleCard className="mb-6" padding="normal">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'ko' ? '현재 진행 상황' : 'Current Progress'}
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-600">{status?.goals.rolesCount || 0}</div>
                <div className="text-xs text-gray-500">{language === 'ko' ? '역할' : 'Roles'}</div>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-600">{status?.goals.objectivesCount || 0}</div>
                <div className="text-xs text-gray-500">{language === 'ko' ? '목표' : 'Objectives'}</div>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-600">{status?.goals.keyResultsCount || 0}</div>
                <div className="text-xs text-gray-500">{language === 'ko' ? '핵심결과' : 'Key Results'}</div>
              </div>
            </div>
          </ModuleCard>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {canStart ? (
            hasStarted ? (
              <>
                <ModuleButton
                  onClick={handleContinue}
                  size="large"
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
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
                className="w-full bg-cyan-600 hover:bg-cyan-700"
                disabled={!canStartModule}
              >
                {language === 'ko' ? '목표 설정 시작' : 'Start Goal Setting'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </ModuleButton>
            )
          ) : (
            <ModuleButton
              onClick={() => router.push('/discover/swot')}
              size="large"
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {language === 'ko' ? 'SWOT 분석 먼저 완료하기' : 'Complete SWOT Analysis First'}
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
