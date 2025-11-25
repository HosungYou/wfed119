'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Circle, ArrowRight, Target, Lightbulb, TrendingUp, ShieldAlert } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';

interface ModuleProgress {
  values: {
    completed: boolean;
    progress: number;
  };
  strengths: {
    completed: boolean;
    progress: number;
  };
  vision: {
    completed: boolean;
    progress: number;
    finalStatement?: string;
  };
  swot: {
    exists: boolean;
    currentStage: string;
    progress: number;
  };
}

export default function SWOTModuleLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(null);
  const [canStart, setCanStart] = useState(false);
  const { startModule } = useModuleProgress('swot');

  useEffect(() => {
    startModule();
    fetchModuleProgress();
  }, [startModule]);

  async function fetchModuleProgress() {
    try {
      // Check SWOT session status (optional API calls for prerequisites)
      const swotRes = await fetch('/api/swot/session');
      const swotData = swotRes.ok ? await swotRes.json() : {};

      // Try to fetch prerequisites (optional - won't block if APIs don't exist)
      let strengthsData = { is_completed: false };
      let visionData = { is_completed: false, final_statement: '' };

      try {
        const strengthsRes = await fetch('/api/discover/strengths/results');
        if (strengthsRes.ok) strengthsData = await strengthsRes.json();
      } catch (e) {
        console.log('[SWOT] Strengths API not available, skipping prerequisite check');
      }

      try {
        const visionRes = await fetch('/api/discover/vision/session');
        if (visionRes.ok) visionData = await visionRes.json();
      } catch (e) {
        console.log('[SWOT] Vision API not available, skipping prerequisite check');
      }

      const progress: ModuleProgress = {
        values: {
          completed: true, // Values는 선택사항
          progress: 100
        },
        strengths: {
          completed: strengthsData.is_completed || false,
          progress: strengthsData.is_completed ? 100 : 0
        },
        vision: {
          completed: visionData.is_completed || false,
          progress: visionData.is_completed ? 100 : 0,
          finalStatement: visionData.final_statement
        },
        swot: {
          exists: !!swotData.id,
          currentStage: swotData.current_stage || 'discovery',
          progress: calculateSWOTProgress(swotData.current_stage)
        }
      };

      setModuleProgress(progress);

      // Always allow starting SWOT (no Prerequisites required)
      setCanStart(true);

      setLoading(false);
    } catch (error) {
      console.error('[SWOT Landing] Error fetching progress:', error);
      // Even on error, allow user to proceed
      setCanStart(true);
      setLoading(false);
    }
  }

  function calculateSWOTProgress(stage: string): number {
    const stages = {
      'discovery': 20,
      'strategy': 40,
      'goals': 60,
      'action': 80,
      'reflection': 90,
      'completed': 100
    };
    return stages[stage as keyof typeof stages] || 0;
  }

  function handleStartOrContinue() {
    if (moduleProgress?.swot.exists) {
      // Continue from where user left off
      const stage = moduleProgress.swot.currentStage;
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
    } else {
      // Start fresh
      router.push('/discover/swot/analysis');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading module status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-lg">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SWOT Analysis & Goal Setting
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your vision into actionable strategies through comprehensive SWOT analysis
          </p>
        </div>

        {/* Related Modules (Optional) */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Related Modules (Optional)</h2>
          <div className="space-y-4">
            <PrerequisiteCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Strengths Discovery"
              status={moduleProgress?.strengths.completed ? 'completed' : 'incomplete'}
              description="Identify your core strengths through storytelling"
              onNavigate={() => router.push('/discover/strengths')}
            />
            <PrerequisiteCard
              icon={<Lightbulb className="w-6 h-6" />}
              title="Vision Statement"
              status={moduleProgress?.vision.completed ? 'completed' : 'incomplete'}
              description="Define your long-term vision and aspirations"
              onNavigate={() => router.push('/discover/vision')}
            />
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              <strong>Tip:</strong> Completing Strengths or Vision modules first will provide richer context for your SWOT analysis, but you can start SWOT directly if you prefer.
            </p>
          </div>
        </div>

        {/* SWOT Module Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Module Overview</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <OverviewCard
              icon={<Target className="w-8 h-8 text-amber-600" />}
              title="SWOT Analysis"
              description="Identify internal strengths & weaknesses, external opportunities & threats"
            />
            <OverviewCard
              icon={<TrendingUp className="w-8 h-8 text-green-600" />}
              title="Strategy Development"
              description="Create SO, WO, ST, WT strategies and prioritize by impact vs difficulty"
            />
            <OverviewCard
              icon={<CheckCircle2 className="w-8 h-8 text-blue-600" />}
              title="Goal Setting"
              description="Set 7 SMART goals across different life roles (6-12 month timeline)"
            />
            <OverviewCard
              icon={<ShieldAlert className="w-8 h-8 text-purple-600" />}
              title="ERRC Action Plan"
              description="Define what to Eliminate, Reduce, Reinforce, and Create in daily life"
            />
          </div>

          {/* Learning Objectives */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Learning Objectives</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Identify your strengths, weaknesses, opportunities, and threats considering your mission and vision</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Develop strategies based on combinations of SWOT elements</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Set SMART goals based on different life roles and domains</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Progress Indicator (if SWOT exists) */}
        {moduleProgress?.swot.exists && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Progress</h2>
            <div className="relative">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
                  style={{ width: `${moduleProgress.swot.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {moduleProgress.swot.progress}% Complete • Current Stage: {formatStage(moduleProgress.swot.currentStage)}
              </p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={handleStartOrContinue}
            disabled={!canStart}
            className={`
              inline-flex items-center px-8 py-4 rounded-xl font-semibold text-lg
              transition-all duration-200 shadow-lg
              ${canStart
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {moduleProgress?.swot.exists ? 'Continue SWOT Analysis' : 'Start SWOT Analysis'}
            <ArrowRight className="ml-2 w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface PrerequisiteCardProps {
  icon: React.ReactNode;
  title: string;
  status: 'completed' | 'incomplete';
  description: string;
  onNavigate: () => void;
}

function PrerequisiteCard({ icon, title, status, description, onNavigate }: PrerequisiteCardProps) {
  const isCompleted = status === 'completed';

  return (
    <div className={`
      flex items-center p-4 rounded-xl border-2 transition-all
      ${isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}
    `}>
      <div className={`
        flex items-center justify-center w-12 h-12 rounded-lg mr-4
        ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}
      `}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      {!isCompleted && (
        <button
          onClick={onNavigate}
          className="ml-4 px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
        >
          Complete
        </button>
      )}
    </div>
  );
}

interface OverviewCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function OverviewCard({ icon, title, description }: OverviewCardProps) {
  return (
    <div className="flex items-start p-4 bg-gray-50 rounded-xl">
      <div className="mr-4 flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function formatStage(stage: string): string {
  const stageNames: Record<string, string> = {
    discovery: 'SWOT Discovery',
    strategy: 'Strategy Development',
    goals: 'Goal Setting',
    action: 'Action Planning (ERRC)',
    reflection: 'Reflection',
    completed: 'Completed'
  };
  return stageNames[stage] || stage;
}
