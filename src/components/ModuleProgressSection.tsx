'use client';

import React from 'react';
import Link from 'next/link';
import {
  Heart, Target, Eye, Grid3X3, Sparkles, User,
  CheckCircle2, Clock, ArrowRight, ChevronRight
} from 'lucide-react';
import { useAllModulesProgress } from '@/hooks/useModuleProgress';
import { ModuleId, MODULE_CONFIGS, MODULE_ORDER } from '@/lib/types/modules';

const MODULE_ICONS: Record<ModuleId, React.ElementType> = {
  values: Heart,
  strengths: Target,
  vision: Eye,
  swot: Grid3X3,
  dreams: Sparkles,
  enneagram: User,
};

const MODULE_COLORS: Record<ModuleId, { gradient: string; bg: string; text: string }> = {
  values: { gradient: 'from-pink-500 to-rose-600', bg: 'bg-pink-50', text: 'text-pink-700' },
  strengths: { gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50', text: 'text-blue-700' },
  vision: { gradient: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  swot: { gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-50', text: 'text-orange-700' },
  dreams: { gradient: 'from-purple-500 to-fuchsia-600', bg: 'bg-purple-50', text: 'text-purple-700' },
  enneagram: { gradient: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50', text: 'text-teal-700' },
};

/**
 * Horizontal module journey progress indicator
 */
export function ModuleJourneyProgress() {
  const { modules, completedModules, loading } = useAllModulesProgress();

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-2xl h-24" />
    );
  }

  const completedCount = completedModules.length;
  const totalCount = MODULE_ORDER.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Your Module Journey</h3>
          <p className="text-white/80 text-sm">
            {completedCount} of {totalCount} modules completed
          </p>
        </div>
        <div className="text-3xl font-bold">{Math.round(progressPercent)}%</div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1">
        {MODULE_ORDER.map((moduleId, index) => {
          const isCompleted = completedModules.includes(moduleId);
          const isInProgress = modules[moduleId]?.progress?.status === 'in_progress';
          const Icon = MODULE_ICONS[moduleId];

          return (
            <React.Fragment key={moduleId}>
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full transition-all
                  ${isCompleted ? 'bg-white text-primary-600' :
                    isInProgress ? 'bg-white/30 text-white ring-2 ring-white' :
                    'bg-white/20 text-white/60'}
                `}
                title={MODULE_CONFIGS[moduleId].name}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              {index < MODULE_ORDER.length - 1 && (
                <div className={`flex-1 h-1 rounded ${isCompleted ? 'bg-white' : 'bg-white/20'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Next recommended module card
 */
export function NextModuleCard() {
  const { modules, completedModules, loading } = useAllModulesProgress();

  if (loading) {
    return <div className="animate-pulse bg-gray-100 rounded-2xl h-40" />;
  }

  // Find the next module to work on
  const nextModule = MODULE_ORDER.find(moduleId => {
    const moduleData = modules[moduleId];
    return moduleData?.canStart && moduleData?.progress?.status !== 'completed';
  });

  if (!nextModule) {
    // All modules completed or none available
    const allCompleted = completedModules.length === MODULE_ORDER.length;

    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
          <h3 className="text-lg font-bold text-green-900">
            {allCompleted ? 'Journey Complete!' : 'Great Progress!'}
          </h3>
        </div>
        <p className="text-green-700 text-sm">
          {allCompleted
            ? 'You\'ve completed all modules. Review your insights in the dashboard.'
            : 'Continue working on your current modules to unlock more.'}
        </p>
      </div>
    );
  }

  const config = MODULE_CONFIGS[nextModule];
  const Icon = MODULE_ICONS[nextModule];
  const colors = MODULE_COLORS[nextModule];
  const moduleData = modules[nextModule];
  const isInProgress = moduleData?.progress?.status === 'in_progress';

  return (
    <Link
      href={config.route}
      className={`block ${colors.bg} rounded-2xl p-6 border-2 border-transparent hover:border-current transition-all hover:shadow-lg group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {isInProgress && (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        )}
      </div>

      <h3 className={`text-lg font-bold ${colors.text} mb-1`}>
        {isInProgress ? 'Continue: ' : 'Up Next: '}{config.name}
      </h3>
      <p className="text-gray-600 text-sm mb-4">{config.description}</p>

      {isInProgress && moduleData.progress && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{moduleData.progress.currentStage || 'Starting...'}</span>
            <span>{moduleData.progress.completionPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full`}
              style={{ width: `${moduleData.progress.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className={`flex items-center gap-2 ${colors.text} font-medium group-hover:gap-3 transition-all`}>
        {isInProgress ? 'Continue' : 'Start'} Module
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}

/**
 * Compact module list for sidebar or mobile
 */
export function CompactModuleList() {
  const { modules, loading } = useAllModulesProgress();

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-14" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {MODULE_ORDER.map(moduleId => {
        const moduleData = modules[moduleId];
        const config = MODULE_CONFIGS[moduleId];
        const Icon = MODULE_ICONS[moduleId];
        const colors = MODULE_COLORS[moduleId];

        const status = moduleData?.progress?.status || 'not_started';
        const canStart = moduleData?.canStart ?? false;
        const isLocked = !canStart && status === 'not_started';

        return (
          <Link
            key={moduleId}
            href={isLocked ? '#' : config.route}
            onClick={e => isLocked && e.preventDefault()}
            className={`
              flex items-center gap-3 p-3 rounded-xl border transition-all
              ${isLocked ? 'opacity-50 cursor-not-allowed bg-gray-50' :
                status === 'completed' ? 'bg-green-50 border-green-200 hover:shadow-md' :
                status === 'in_progress' ? `${colors.bg} border-current hover:shadow-md` :
                'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'}
            `}
          >
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${status === 'completed' ? 'bg-green-100' :
                status === 'in_progress' ? `bg-gradient-to-br ${colors.gradient}` :
                'bg-gray-100'}
            `}>
              {status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Icon className={`w-5 h-5 ${status === 'in_progress' ? 'text-white' : 'text-gray-500'}`} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate text-sm">{config.name}</div>
              <div className="text-xs text-gray-500">
                {status === 'completed' ? 'Completed' :
                 status === 'in_progress' ? `${moduleData?.progress?.completionPercentage || 0}% complete` :
                 isLocked ? 'Complete prerequisites first' : 'Not started'}
              </div>
            </div>

            {!isLocked && (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Full module progress section for dashboard
 */
export function ModuleProgressSection() {
  return (
    <div className="space-y-6">
      <ModuleJourneyProgress />

      <div className="grid md:grid-cols-2 gap-6">
        <NextModuleCard />

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">All Modules</h3>
          <CompactModuleList />
        </div>
      </div>
    </div>
  );
}
