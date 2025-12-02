'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Target,
  Minus,
  ChevronDown,
  ChevronUp,
  Plus,
  Heart,
  BookOpen,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { ERRC_SESSION_STEPS, ERRC_CATEGORY_LABELS } from '@/lib/types/errc';

interface ModuleProgress {
  swot: {
    completed: boolean;
    progress: number;
  };
  errc: {
    exists: boolean;
    currentStep: string;
    progress: number;
    hasWellbeingBefore: boolean;
    hasWellbeingAfter: boolean;
    itemsCount: number;
  };
}

export default function ERRCModuleLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(null);
  const [canStart, setCanStart] = useState(false);
  const { startModule } = useModuleProgress('errc');

  useEffect(() => {
    startModule();
    fetchModuleProgress();
  }, [startModule]);

  async function fetchModuleProgress() {
    try {
      // Check ERRC session status
      const errcRes = await fetch('/api/errc/session');
      const errcData = errcRes.ok ? await errcRes.json() : {};

      // Try to fetch SWOT as prerequisite
      let swotData = { status: 'not_started' };
      try {
        const swotRes = await fetch('/api/swot/session');
        if (swotRes.ok) swotData = await swotRes.json();
      } catch (e) {
        console.log('[ERRC] SWOT API not available, skipping prerequisite check');
      }

      const progress: ModuleProgress = {
        swot: {
          completed: swotData.status === 'completed',
          progress: swotData.status === 'completed' ? 100 : 0,
        },
        errc: {
          exists: !!errcData.id,
          currentStep: errcData.current_step || 'wellbeing_before',
          progress: calculateERRCProgress(errcData.current_step),
          hasWellbeingBefore: !!errcData.wellbeing_before,
          hasWellbeingAfter: !!errcData.wellbeing_after,
          itemsCount: errcData.items?.length || 0,
        },
      };

      setModuleProgress(progress);
      setCanStart(true);
      setLoading(false);
    } catch (error) {
      console.error('[ERRC Landing] Error fetching progress:', error);
      setCanStart(true);
      setLoading(false);
    }
  }

  function calculateERRCProgress(step: string): number {
    const stepIndex = ERRC_SESSION_STEPS.indexOf(step as typeof ERRC_SESSION_STEPS[number]);
    if (stepIndex === -1) return 0;
    return Math.round(((stepIndex + 1) / ERRC_SESSION_STEPS.length) * 100);
  }

  function handleStartOrContinue() {
    if (moduleProgress?.errc.exists) {
      const step = moduleProgress.errc.currentStep;
      const stepRoutes: Record<string, string> = {
        wellbeing_before: '/discover/errc/wellbeing',
        canvas: '/discover/errc/canvas',
        action_steps: '/discover/errc/actions',
        progress_tracking: '/discover/errc/progress',
        reflection: '/discover/errc/journal',
        wellbeing_after: '/discover/errc/wellbeing?mode=after',
        completed: '/discover/errc/results',
      };
      router.push(stepRoutes[step] || '/discover/errc/wellbeing');
    } else {
      router.push('/discover/errc/wellbeing');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading module status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl mb-6 shadow-lg">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ERRC Action Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your wellbeing through strategic behavior changes using the Eliminate-Reduce-Raise-Create framework
          </p>
        </div>

        {/* Related Modules (Optional) */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Related Modules (Optional)</h2>
          <div className="space-y-4">
            <PrerequisiteCard
              icon={<Target className="w-6 h-6" />}
              title="SWOT Analysis"
              status={moduleProgress?.swot.completed ? 'completed' : 'incomplete'}
              description="Identify strategies and goals through comprehensive SWOT analysis"
              onNavigate={() => router.push('/discover/swot')}
            />
          </div>

          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <p className="text-rose-800">
              <strong>Tip:</strong> Completing SWOT Analysis first will help identify which behaviors to focus on in your ERRC plan, but you can start directly if you prefer.
            </p>
          </div>
        </div>

        {/* ERRC Module Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Module Overview</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <OverviewCard
              icon={<Heart className="w-8 h-8 text-rose-600" />}
              title="Wellbeing Assessment"
              description="Evaluate your current satisfaction across 6 life dimensions"
            />
            <OverviewCard
              icon={<div className="flex items-center space-x-1">
                <Minus className="w-6 h-6 text-red-600" />
                <ChevronDown className="w-6 h-6 text-orange-600" />
                <ChevronUp className="w-6 h-6 text-blue-600" />
                <Plus className="w-6 h-6 text-green-600" />
              </div>}
              title="ERRC Canvas"
              description="Identify behaviors to Eliminate, Reduce, Raise, and Create"
            />
            <OverviewCard
              icon={<CheckCircle2 className="w-8 h-8 text-blue-600" />}
              title="Action Steps"
              description="Break down each ERRC item into concrete, achievable steps"
            />
            <OverviewCard
              icon={<BookOpen className="w-8 h-8 text-purple-600" />}
              title="Reflection Journal"
              description="Track your progress and insights through regular reflections"
            />
          </div>

          {/* ERRC Categories Explanation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(ERRC_CATEGORY_LABELS).map(([key, label]) => (
              <div
                key={key}
                className={`p-4 rounded-xl text-center ${
                  key === 'eliminate' ? 'bg-red-50 border-2 border-red-200' :
                  key === 'reduce' ? 'bg-orange-50 border-2 border-orange-200' :
                  key === 'raise' ? 'bg-blue-50 border-2 border-blue-200' :
                  'bg-green-50 border-2 border-green-200'
                }`}
              >
                <div className="mb-2">
                  {key === 'eliminate' && <Minus className="w-8 h-8 mx-auto text-red-600" />}
                  {key === 'reduce' && <ChevronDown className="w-8 h-8 mx-auto text-orange-600" />}
                  {key === 'raise' && <ChevronUp className="w-8 h-8 mx-auto text-blue-600" />}
                  {key === 'create' && <Plus className="w-8 h-8 mx-auto text-green-600" />}
                </div>
                <h4 className="font-semibold text-gray-900">{label}</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {key === 'eliminate' && 'Remove harmful habits completely'}
                  {key === 'reduce' && 'Minimize negative behaviors'}
                  {key === 'raise' && 'Increase beneficial activities'}
                  {key === 'create' && 'Start new positive habits'}
                </p>
              </div>
            ))}
          </div>

          {/* Learning Objectives */}
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Learning Objectives</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Assess your current wellbeing across career, relationships, health, finances, personal growth, and leisure</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Identify specific behaviors to eliminate, reduce, raise, and create for improved life satisfaction</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span>Create actionable steps and track your progress toward meaningful behavior change</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Progress Indicator (if ERRC exists) */}
        {moduleProgress?.errc.exists && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Progress</h2>
            <div className="relative">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-600 transition-all duration-500"
                  style={{ width: `${moduleProgress.errc.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {moduleProgress.errc.progress}% Complete • Current Step: {formatStep(moduleProgress.errc.currentStep)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className={`px-3 py-1 rounded-full ${moduleProgress.errc.hasWellbeingBefore ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {moduleProgress.errc.hasWellbeingBefore ? '✓' : '○'} Initial Assessment
                </span>
                <span className={`px-3 py-1 rounded-full ${moduleProgress.errc.itemsCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {moduleProgress.errc.itemsCount > 0 ? '✓' : '○'} {moduleProgress.errc.itemsCount} ERRC Items
                </span>
                <span className={`px-3 py-1 rounded-full ${moduleProgress.errc.hasWellbeingAfter ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {moduleProgress.errc.hasWellbeingAfter ? '✓' : '○'} Final Assessment
                </span>
              </div>
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
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {moduleProgress?.errc.exists ? 'Continue ERRC Plan' : 'Start ERRC Plan'}
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
          className="ml-4 px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
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

function formatStep(step: string): string {
  const stepNames: Record<string, string> = {
    wellbeing_before: 'Initial Wellbeing Assessment',
    canvas: 'ERRC Canvas',
    action_steps: 'Action Steps',
    progress_tracking: 'Progress Tracking',
    reflection: 'Reflection Journal',
    wellbeing_after: 'Final Wellbeing Assessment',
    completed: 'Completed',
  };
  return stepNames[step] || step;
}
