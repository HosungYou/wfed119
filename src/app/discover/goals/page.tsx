'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Circle, ArrowRight, Target, Users, Compass, ClipboardCheck, Sparkles } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';

interface GoalObjective {
  goal_key_results?: { id: string }[];
}

interface GoalRole {
  id: string;
  goal_objectives?: GoalObjective[];
}

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
  { id: 'roles', name: 'Role Setup', icon: Users, description: 'Define 5-7 life roles' },
  { id: 'objectives', name: 'Objectives', icon: Target, description: 'Set OKR-based goals' },
  { id: 'key-results', name: 'Key Results', icon: Compass, description: 'Define measurable outcomes' },
  { id: 'actions', name: 'Action Plans', icon: ClipboardCheck, description: 'Create specific action items' },
  { id: 'reflection', name: '7 Principles', icon: Sparkles, description: 'Reflect on goal-setting principles' },
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
          objectivesCount: goalsData?.goal_roles?.reduce((sum: number, r: GoalRole) =>
            sum + (r.goal_objectives?.length || 0), 0) || 0,
          keyResultsCount: goalsData?.goal_roles?.reduce((sum: number, r: GoalRole) =>
            sum + (r.goal_objectives?.reduce((s: number, o: GoalObjective) =>
              s + (o.goal_key_results?.length || 0), 0) || 0), 0) || 0,
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
        alert('Please complete SWOT Analysis first.');
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
            Goal Setting Module (OKR-Based)
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Role-Based Goal Setting
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Based on your SWOT analysis, use the OKR (Objectives & Key Results) framework
            to establish systematic goals for each life role.
          </p>
        </div>

        {/* Prerequisites Check */}
        {!canStart && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">SWOT Analysis Required</h3>
                <p className="text-sm text-amber-600 mt-1">
                  Please complete SWOT Analysis before starting Goal Setting.
                </p>
                <button
                  onClick={() => router.push('/discover/swot')}
                  className="mt-2 text-sm text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
                >
                  Go to SWOT Analysis <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stage Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Goal Setting Stages</h2>

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
                      Done
                    </span>
                  )}
                  {isCurrent && progress?.goals.exists && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      In Progress
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 7 Principles Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <h2 className="text-lg font-semibold mb-4">7 Principles of Goal Setting</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Identity',
              'Deliberation',
              'Incompleteness',
              'Diversity',
              'Connection',
              'Feasibility',
              'Ease of Execution',
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
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all"
              >
                Start Goal Setting
                <ArrowRight className="w-5 h-5" />
              </button>
            )
          ) : (
            <button
              disabled
              className="bg-gray-300 text-gray-500 font-semibold px-8 py-3 rounded-full shadow-lg flex items-center gap-2 cursor-not-allowed"
            >
              Complete SWOT Analysis to Start
            </button>
          )}
        </div>

        {/* Stats */}
        {progress?.goals.exists && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl font-bold text-purple-600">{progress.goals.rolesCount}</div>
              <div className="text-sm text-gray-500">Roles</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl font-bold text-purple-600">{progress.goals.objectivesCount}</div>
              <div className="text-sm text-gray-500">Objectives</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <div className="text-2xl font-bold text-purple-600">{progress.goals.keyResultsCount}</div>
              <div className="text-sm text-gray-500">Key Results</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
