'use client';

import React from 'react';
import Link from 'next/link';
import {
  Heart, Target, User, Lightbulb, Eye, Grid3X3, CheckCircle2, Zap,
  Lock, ArrowRight, Play, CheckCircle
} from 'lucide-react';
import { useAllModulesProgress } from '@/hooks/useModuleProgress';
import {
  ModuleId, ModuleStatus, MODULE_ORDER, MODULE_CONFIGS,
  MODULE_PARTS, PART_NAMES, ModulePart,
  getOverallProgress, getNextModule
} from '@/lib/types/modules';

// ============================================================================
// Module Icons Map (8 modules)
// ============================================================================

const MODULE_ICONS: Record<ModuleId, React.ElementType> = {
  values: Heart,
  strengths: Target,
  enneagram: User,
  'life-themes': Lightbulb,
  vision: Eye,
  swot: Grid3X3,
  goals: CheckCircle2,
  errc: Zap,
};

// Module colors for visual distinction
const MODULE_COLORS: Record<ModuleId, { bg: string; bgLight: string; text: string; border: string }> = {
  values: { bg: 'bg-rose-500', bgLight: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  strengths: { bg: 'bg-blue-500', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  enneagram: { bg: 'bg-teal-500', bgLight: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  'life-themes': { bg: 'bg-amber-500', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  vision: { bg: 'bg-purple-500', bgLight: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  swot: { bg: 'bg-orange-500', bgLight: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  goals: { bg: 'bg-indigo-500', bgLight: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  errc: { bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
};

// Part colors
const PART_COLORS: Record<ModulePart, { bg: string; text: string; accent: string }> = {
  'self-discovery': { bg: 'bg-blue-50', text: 'text-blue-800', accent: 'bg-blue-500' },
  'vision-mission': { bg: 'bg-purple-50', text: 'text-purple-800', accent: 'bg-purple-500' },
  'strategic-analysis': { bg: 'bg-orange-50', text: 'text-orange-800', accent: 'bg-orange-500' },
  'goal-setting': { bg: 'bg-emerald-50', text: 'text-emerald-800', accent: 'bg-emerald-500' },
};

// ============================================================================
// Types
// ============================================================================

interface ModuleNodeProps {
  moduleId: ModuleId;
  order: number;
  status: ModuleStatus;
  isLocked: boolean;
  isNext: boolean;
  completionPercentage: number;
}

interface JourneyProgressMapProps {
  variant?: 'full' | 'compact' | 'minimal';
  showPartLabels?: boolean;
}

// ============================================================================
// Module Node Component
// ============================================================================

function ModuleNode({
  moduleId,
  order,
  status,
  isLocked,
  isNext,
  completionPercentage,
}: ModuleNodeProps) {
  const config = MODULE_CONFIGS[moduleId];
  const Icon = MODULE_ICONS[moduleId];
  const colors = MODULE_COLORS[moduleId];

  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  return (
    <Link
      href={isLocked ? '#' : config.route}
      onClick={(e) => isLocked && e.preventDefault()}
      className={`
        group relative flex flex-col items-center
        ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Module Circle */}
      <div
        className={`
          relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center
          transition-all duration-300
          ${isCompleted
            ? 'bg-green-500 text-white shadow-lg shadow-green-200'
            : isInProgress
              ? `${colors.bg} text-white shadow-lg ${colors.text.replace('text-', 'shadow-')}/30 ring-4 ring-white`
              : isLocked
                ? 'bg-gray-100 text-gray-400'
                : `${colors.bgLight} ${colors.text} border-2 ${colors.border}`
          }
          ${!isLocked && !isCompleted && 'group-hover:scale-110 group-hover:shadow-lg'}
          ${isNext && !isInProgress && 'animate-pulse'}
        `}
      >
        {isCompleted ? (
          <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        ) : isLocked ? (
          <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : isNext && !isInProgress ? (
          <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
        ) : (
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        )}

        {/* Order badge */}
        <div
          className={`
            absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold
            flex items-center justify-center
            ${isCompleted
              ? 'bg-green-600 text-white'
              : isInProgress
                ? `${colors.bg} text-white`
                : isLocked
                  ? 'bg-gray-300 text-gray-600'
                  : `${colors.bg} text-white`
            }
          `}
        >
          {order}
        </div>

        {/* Progress ring for in-progress */}
        {isInProgress && completionPercentage > 0 && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 56 56"
          >
            <circle
              className="text-white/30"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r="24"
              cx="28"
              cy="28"
            />
            <circle
              className="text-white"
              strokeWidth="3"
              strokeDasharray={150}
              strokeDashoffset={150 - (150 * completionPercentage) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="24"
              cx="28"
              cy="28"
            />
          </svg>
        )}
      </div>

      {/* Module Name */}
      <span
        className={`
          mt-2 text-xs sm:text-sm font-medium text-center max-w-[80px] sm:max-w-[100px] leading-tight
          ${isCompleted
            ? 'text-green-700'
            : isInProgress
              ? colors.text
              : isLocked
                ? 'text-gray-400'
                : 'text-gray-700'
          }
        `}
      >
        {config.nameKo}
      </span>

      {/* Status label */}
      {isInProgress && (
        <span className="mt-1 text-[10px] sm:text-xs text-gray-500">
          {completionPercentage}% 완료
        </span>
      )}
      {isNext && !isInProgress && !isLocked && (
        <span className={`mt-1 text-[10px] sm:text-xs ${colors.text} font-medium`}>
          다음 단계
        </span>
      )}
    </Link>
  );
}

// ============================================================================
// Connector Line Component
// ============================================================================

function ConnectorLine({
  isCompleted,
  isActive,
}: {
  isCompleted: boolean;
  isActive: boolean;
}) {
  return (
    <div
      className={`
        flex-1 h-1 mx-1 sm:mx-2 rounded-full transition-all duration-500
        ${isCompleted
          ? 'bg-green-400'
          : isActive
            ? 'bg-gradient-to-r from-green-400 to-gray-200'
            : 'bg-gray-200'
        }
      `}
    />
  );
}

// ============================================================================
// Part Label Component
// ============================================================================

function PartLabel({
  part,
  moduleIds,
  completedCount,
}: {
  part: ModulePart;
  moduleIds: ModuleId[];
  completedCount: number;
}) {
  const colors = PART_COLORS[part];
  const partName = PART_NAMES[part];
  const totalCount = moduleIds.length;
  const isComplete = completedCount === totalCount;
  const isStarted = completedCount > 0;

  return (
    <div
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium
        ${isComplete
          ? 'bg-green-100 text-green-700'
          : isStarted
            ? `${colors.bg} ${colors.text}`
            : 'bg-gray-100 text-gray-500'
        }
      `}
    >
      {partName.ko} ({completedCount}/{totalCount})
    </div>
  );
}

// ============================================================================
// Main JourneyProgressMap Component
// ============================================================================

export function JourneyProgressMap({
  variant = 'full',
  showPartLabels = true,
}: JourneyProgressMapProps) {
  const { modules, completedModules, loading } = useAllModulesProgress();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded-full w-48 mb-6 mx-auto" />
        <div className="flex justify-center items-center gap-2">
          {[...Array(8)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              {i < 7 && <div className="w-8 h-1 bg-gray-200 rounded" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  const completedSet = new Set(completedModules);
  const overallProgress = getOverallProgress(completedSet);
  const nextModuleId = getNextModule(completedSet);

  // Group modules by part
  const modulesByPart: Record<ModulePart, ModuleId[]> = {
    'self-discovery': [],
    'vision-mission': [],
    'strategic-analysis': [],
    'goal-setting': [],
  };

  MODULE_ORDER.forEach((moduleId) => {
    const part = MODULE_PARTS[moduleId];
    modulesByPart[part].push(moduleId);
  });

  // Minimal variant - just the progress bar
  if (variant === 'minimal') {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            여정 진행률
          </span>
          <span className="text-sm font-bold text-primary-600">
            {overallProgress}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{completedModules.length}개 완료</span>
          <span>{MODULE_ORDER.length - completedModules.length}개 남음</span>
        </div>
      </div>
    );
  }

  // Compact variant - horizontal nodes without part labels
  if (variant === 'compact') {
    return (
      <div className="w-full py-4">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">나의 여정</h3>
            <p className="text-sm text-gray-500">
              {completedModules.length}개 모듈 완료 / {MODULE_ORDER.length}개 중
            </p>
          </div>
          <div className="text-3xl font-bold text-primary-600">{overallProgress}%</div>
        </div>

        {/* Module Nodes */}
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {MODULE_ORDER.map((moduleId, index) => {
            const moduleData = modules[moduleId];
            const status = moduleData?.progress?.status || 'not_started';
            const isLocked = !moduleData?.canStart && status === 'not_started';
            const isNext = nextModuleId === moduleId;
            const completionPercentage = moduleData?.progress?.completionPercentage || 0;
            const isCompleted = status === 'completed';
            const isInProgress = status === 'in_progress';

            return (
              <React.Fragment key={moduleId}>
                <ModuleNode
                  moduleId={moduleId}
                  order={index + 1}
                  status={status}
                  isLocked={isLocked}
                  isNext={isNext}
                  completionPercentage={completionPercentage}
                />
                {index < MODULE_ORDER.length - 1 && (
                  <ConnectorLine
                    isCompleted={isCompleted}
                    isActive={isInProgress}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Full variant - with part labels and detailed info
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">LifeCraft 여정</h2>
          <p className="text-sm text-gray-500 mt-1">
            8개의 모듈을 순서대로 완료하세요
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary-600">{overallProgress}%</div>
          <p className="text-sm text-gray-500">전체 진행률</p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-8">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Part Labels */}
      {showPartLabels && (
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {(Object.keys(modulesByPart) as ModulePart[]).map((part) => {
            const partModules = modulesByPart[part];
            const completedCount = partModules.filter((m) =>
              completedSet.has(m)
            ).length;
            return (
              <PartLabel
                key={part}
                part={part}
                moduleIds={partModules}
                completedCount={completedCount}
              />
            );
          })}
        </div>
      )}

      {/* Module Journey Map */}
      <div className="overflow-x-auto">
        <div className="flex items-center justify-center min-w-[640px] gap-2 px-4 py-4">
          {MODULE_ORDER.map((moduleId, index) => {
            const moduleData = modules[moduleId];
            const status = moduleData?.progress?.status || 'not_started';
            const isLocked = !moduleData?.canStart && status === 'not_started';
            const isNext = nextModuleId === moduleId;
            const completionPercentage = moduleData?.progress?.completionPercentage || 0;
            const isCompleted = status === 'completed';
            const isInProgress = status === 'in_progress';

            return (
              <React.Fragment key={moduleId}>
                <ModuleNode
                  moduleId={moduleId}
                  order={index + 1}
                  status={status}
                  isLocked={isLocked}
                  isNext={isNext}
                  completionPercentage={completionPercentage}
                />
                {index < MODULE_ORDER.length - 1 && (
                  <ConnectorLine
                    isCompleted={isCompleted}
                    isActive={isInProgress}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Next Step CTA */}
      {nextModuleId && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <NextStepCTA moduleId={nextModuleId} />
        </div>
      )}

      {/* All Completed */}
      {!nextModuleId && completedModules.length === MODULE_ORDER.length && (
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">모든 모듈을 완료했습니다!</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            대시보드에서 통합 프로필과 인사이트를 확인하세요.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Next Step CTA Component
// ============================================================================

function NextStepCTA({ moduleId }: { moduleId: ModuleId }) {
  const config = MODULE_CONFIGS[moduleId];
  const colors = MODULE_COLORS[moduleId];
  const Icon = MODULE_ICONS[moduleId];
  const { modules } = useAllModulesProgress();

  const moduleData = modules[moduleId];
  const isInProgress = moduleData?.progress?.status === 'in_progress';
  const completionPercentage = moduleData?.progress?.completionPercentage || 0;

  return (
    <Link
      href={config.route}
      className={`
        flex items-center gap-4 p-4 rounded-xl border-2 transition-all
        ${colors.bgLight} ${colors.border} hover:shadow-md group
      `}
    >
      <div
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${colors.bg} text-white
        `}
      >
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${colors.text}`}>
            {isInProgress ? '계속하기' : '다음 단계'}
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900">{config.nameKo}</h3>
        <p className="text-sm text-gray-600">{config.descriptionKo}</p>

        {isInProgress && completionPercentage > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>진행률</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.bg} rounded-full`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <ArrowRight className={`w-5 h-5 ${colors.text} group-hover:translate-x-1 transition-transform`} />
    </Link>
  );
}

// ============================================================================
// Export Additional Components
// ============================================================================

export { NextStepCTA, ModuleNode, PartLabel };
