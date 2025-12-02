'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Circle, ArrowRight, Target, Users, Compass, ClipboardCheck, Sparkles } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';

interface GoalProgress {
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
  };
}

const STAGES = [
  { id: 'roles', name: '역할 설정', icon: Users, description: '5-7개의 인생 역할 정의' },
  { id: 'objectives', name: '목표 수립', icon: Target, description: 'OKR 기반 목표 설정' },
  { id: 'key-results', name: '핵심 결과', icon: Compass, description: '측정 가능한 결과 정의' },
  { id: 'actions', name: '실행 계획', icon: ClipboardCheck, description: '구체적인 행동 계획' },
  { id: 'reflection', name: '7가지 원칙', icon: Sparkles, description: '목표 설정 7원칙 성찰' },
];

export default function GoalSettingModuleLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [canStart, setCanStart] = useState(false);
  const { startModule } = useModuleProgress('goals');

  useEffect(() => {
    startModule();
    fetchProgress();
  }, [startModule]);

  async function fetchProgress() {
    try {
      // Check SWOT completion
      const swotRes = await fetch('/api/swot/session');
      const swotData = swotRes.ok ? await swotRes.json() : {};

      // Check Goal Setting session
      const goalsRes = await fetch('/api/goals/session');
      const goalsData = goalsRes.ok ? await goalsRes.json() : null;

      const goalProgress: GoalProgress = {
        swot: {
          completed: swotData.is_completed || false,
          hasStrategies: !!(swotData.so_strategies?.length || swotData.wo_strategies?.length),
        },
        goals: {
          exists: !!goalsData?.id,
          status: goalsData?.status || 'not_started',
          rolesCount: goalsData?.goal_roles?.length || 0,
          objectivesCount: goalsData?.goal_roles?.reduce((sum: number, r: any) =>
            sum + (r.goal_objectives?.length || 0), 0) || 0,
          keyResultsCount: goalsData?.goal_roles?.reduce((sum: number, r: any) =>
            sum + r.goal_objectives?.reduce((s: number, o: any) =>
              s + (o.goal_key_results?.length || 0), 0) || 0, 0) || 0,
        },
      };

      setProgress(goalProgress);
      // SWOT must be completed to start Goal Setting
      setCanStart(goalProgress.swot.completed || goalProgress.swot.hasStrategies);
      setLoading(false);
    } catch (error) {
      console.error('[Goal Setting] Error fetching progress:', error);
      setCanStart(true);
      setLoading(false);
    }
  }

  function getStageProgress() {
    if (!progress?.goals.exists) return 0;
    const { rolesCount, objectivesCount, keyResultsCount } = progress.goals;
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
        alert('SWOT 분석을 먼저 완료해주세요.');
        router.push('/discover/swot');
        return;
      }

      // Create or get goal session
      const res = await fetch('/api/goals/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swot_analysis_id: swotData.id }),
      });

      if (res.ok) {
        router.push('/discover/goals/roles');
      }
    } catch (error) {
      console.error('[Goal Setting] Error starting:', error);
    }
  }

  function handleContinue() {
    const currentStage = getStageProgress();
    const routes = ['roles', 'objectives', 'key-results', 'actions', 'reflection'];
    router.push(`/discover/goals/${routes[Math.min(currentStage, routes.length - 1)]}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const currentStage = getStageProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Target className="w-4 h-4" />
            목표 설정 모듈 (OKR 기반)
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            인생의 역할별 목표 설정
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            SWOT 분석 결과를 바탕으로 OKR(Objectives & Key Results) 프레임워크를 활용해
            체계적인 목표를 수립합니다.
          </p>
        </div>

        {/* Prerequisites Check */}
        {!canStart && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">SWOT 분석 필요</h3>
                <p className="text-sm text-amber-600 mt-1">
                  목표 설정을 시작하려면 SWOT 분석을 먼저 완료해주세요.
                </p>
                <button
                  onClick={() => router.push('/discover/swot')}
                  className="mt-2 text-sm text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
                >
                  SWOT 분석으로 이동 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stage Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">목표 설정 단계</h2>

          <div className="space-y-4">
            {STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const isCompleted = index < currentStage;
              const isCurrent = index === currentStage;

              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isCompleted
                      ? 'bg-green-50 border border-green-200'
                      : isCurrent
                        ? 'bg-purple-50 border border-purple-200'
                        : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-300 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      isCompleted ? 'text-green-700' : isCurrent ? 'text-purple-700' : 'text-gray-500'
                    }`}>
                      {stage.name}
                    </h3>
                    <p className="text-sm text-gray-500">{stage.description}</p>
                  </div>

                  {isCompleted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      완료
                    </span>
                  )}
                  {isCurrent && progress?.goals.exists && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      진행 중
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 7 Principles Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <h2 className="text-lg font-semibold mb-4">목표 설정의 7가지 원칙</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              '정체성 반영',
              '충분한 숙고',
              '미완성 수용',
              '다양성',
              '연계성',
              '실현 가능성',
              '실행 용이성',
            ].map((principle, i) => (
              <div key={i} className="bg-white/20 rounded-lg px-3 py-2 text-sm text-center">
                {i + 1}. {principle}
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          {canStart ? (
            progress?.goals.exists ? (
              <button
                onClick={handleContinue}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all"
              >
                이어서 진행하기
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all"
              >
                목표 설정 시작하기
                <ArrowRight className="w-5 h-5" />
              </button>
            )
          ) : (
            <button
              disabled
              className="bg-gray-300 text-gray-500 font-semibold px-8 py-3 rounded-full shadow-lg flex items-center gap-2 cursor-not-allowed"
            >
              SWOT 분석 완료 후 시작 가능
            </button>
          )}
        </div>

        {/* Stats */}
        {progress?.goals.exists && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl font-bold text-purple-600">{progress.goals.rolesCount}</div>
              <div className="text-sm text-gray-500">역할</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl font-bold text-purple-600">{progress.goals.objectivesCount}</div>
              <div className="text-sm text-gray-500">목표</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl font-bold text-purple-600">{progress.goals.keyResultsCount}</div>
              <div className="text-sm text-gray-500">핵심 결과</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
