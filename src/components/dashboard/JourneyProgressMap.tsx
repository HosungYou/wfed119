'use client';

import React from 'react';
import Link from 'next/link';
import {
  Heart, Target, User, Lightbulb, Eye, Grid3X3, CheckCircle2, Zap,
  Lock, ArrowRight, Play, CheckCircle, Compass, Mountain, Leaf, Flag, Briefcase, Users
} from 'lucide-react';
import { useAllModulesProgress } from '@/hooks/useModuleProgress';
import {
  ModuleId, ModuleStatus, MODULE_ORDER, MODULE_CONFIGS,
  MODULE_PARTS, PART_NAMES, ModulePart,
  getOverallProgress, getNextModule
} from '@/lib/types/modules';
import { useTranslation } from '@/lib/i18n';

/* =============================================================================
 * Terra Editorial Design - Journey Progress Map
 * Warm earth tones with editorial typography
 * ============================================================================= */

// ============================================================================
// Module Icons Map (10 modules + 1 deprecated)
// New order: enneagram → life-themes → values → mission → life-roles → vision → swot → career-options → goals → errc
// ============================================================================

const MODULE_ICONS: Record<ModuleId, React.ElementType> = {
  enneagram: User,
  'life-themes': Lightbulb,
  values: Heart,
  mission: Flag,
  'life-roles': Users,
  vision: Eye,
  swot: Grid3X3,
  'career-options': Briefcase,
  goals: CheckCircle2,
  errc: Zap,
  strengths: Target, // DEPRECATED
};

// Terra Editorial colors for modules
const MODULE_COLORS: Record<ModuleId, { bg: string; bgLight: string; text: string; border: string }> = {
  enneagram: { bg: 'bg-primary-500', bgLight: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200' },
  'life-themes': { bg: 'bg-amber-500', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  values: { bg: 'bg-rose-500', bgLight: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  mission: { bg: 'bg-fuchsia-500', bgLight: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-200' },
  'life-roles': { bg: 'bg-violet-500', bgLight: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  vision: { bg: 'bg-purple-500', bgLight: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  swot: { bg: 'bg-orange-500', bgLight: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  'career-options': { bg: 'bg-secondary-500', bgLight: 'bg-secondary-50', text: 'text-secondary-600', border: 'border-secondary-200' },
  goals: { bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  errc: { bg: 'bg-teal-500', bgLight: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  strengths: { bg: 'bg-accent-500', bgLight: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-200' }, // DEPRECATED
};

// Terra Editorial part colors
const PART_COLORS: Record<ModulePart, { bg: string; text: string; accent: string; icon: React.ElementType }> = {
  'self-discovery': { bg: 'bg-primary-50', text: 'text-primary-800', accent: 'bg-primary-500', icon: Compass },
  'mission-roles': { bg: 'bg-secondary-50', text: 'text-secondary-800', accent: 'bg-secondary-500', icon: Flag },
  'vision-options': { bg: 'bg-orange-50', text: 'text-orange-800', accent: 'bg-orange-500', icon: Mountain },
  'goal-setting': { bg: 'bg-emerald-50', text: 'text-emerald-800', accent: 'bg-emerald-500', icon: Leaf },
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
  language: string;
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
  language,
}: ModuleNodeProps) {
  const config = MODULE_CONFIGS[moduleId];
  const Icon = MODULE_ICONS[moduleId];
  const colors = MODULE_COLORS[moduleId];

  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  const moduleName = language === 'ko' ? config.nameKo : config.name;

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
          relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center
          transition-all duration-300 ease-out-expo
          ${isCompleted
            ? 'bg-emerald-500 text-white shadow-elevated'
            : isInProgress
              ? `${colors.bg} text-white shadow-elevated ring-4 ring-white`
              : isLocked
                ? 'bg-neutral-100 text-neutral-400'
                : `${colors.bgLight} ${colors.text} border-2 ${colors.border}`
          }
          ${!isLocked && !isCompleted && 'group-hover:scale-110 group-hover:shadow-elevated'}
          ${isNext && !isInProgress && 'animate-pulse'}
        `}
      >
        {isCompleted ? (
          <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8" />
        ) : isLocked ? (
          <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : isNext && !isInProgress ? (
          <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
        ) : (
          <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
        )}

        {/* Order badge */}
        <div
          className={`
            absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full text-xs font-bold
            flex items-center justify-center font-display shadow-soft
            ${isCompleted
              ? 'bg-emerald-600 text-white'
              : isInProgress
                ? `${colors.bg} text-white`
                : isLocked
                  ? 'bg-neutral-300 text-neutral-600'
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
            viewBox="0 0 64 64"
          >
            <circle
              className="text-white/30"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r="28"
              cx="32"
              cy="32"
            />
            <circle
              className="text-white"
              strokeWidth="3"
              strokeDasharray={175}
              strokeDashoffset={175 - (175 * completionPercentage) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="28"
              cx="32"
              cy="32"
            />
          </svg>
        )}
      </div>

      {/* Module Name */}
      <span
        className={`
          mt-3 text-body-sm font-medium text-center max-w-[80px] sm:max-w-[100px] leading-tight
          ${isCompleted
            ? 'text-emerald-700'
            : isInProgress
              ? colors.text
              : isLocked
                ? 'text-neutral-400'
                : 'text-neutral-700'
          }
        `}
      >
        {moduleName}
      </span>

      {/* Status label */}
      {isInProgress && (
        <span className="mt-1 text-caption text-neutral-500">
          {completionPercentage}% {language === 'ko' ? '완료' : 'complete'}
        </span>
      )}
      {isNext && !isInProgress && !isLocked && (
        <span className={`mt-1 text-caption ${colors.text} font-medium`}>
          {language === 'ko' ? '다음 단계' : 'Next Step'}
        </span>
      )}
    </Link>
  );
}

// ============================================================================
// Connection Line Component
// ============================================================================

function ConnectionLine({
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
          ? 'bg-emerald-400'
          : isActive
            ? 'bg-gradient-to-r from-emerald-400 to-neutral-200'
            : 'bg-neutral-200'
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
  language,
}: {
  part: ModulePart;
  moduleIds: ModuleId[];
  completedCount: number;
  language: string;
}) {
  const colors = PART_COLORS[part];
  const partName = PART_NAMES[part];
  const totalCount = moduleIds.length;
  const isComplete = completedCount === totalCount;
  const isStarted = completedCount > 0;
  const PartIcon = colors.icon;

  const displayName = language === 'ko' ? partName.ko : partName.en;

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-medium
        transition-all duration-300
        ${isComplete
          ? 'bg-emerald-100 text-emerald-700'
          : isStarted
            ? `${colors.bg} ${colors.text}`
            : 'bg-neutral-100 text-neutral-500'
        }
      `}
    >
      <PartIcon className="w-4 h-4" />
      <span>{displayName}</span>
      <span className="text-caption opacity-70">({completedCount}/{totalCount})</span>
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
  const { language } = useTranslation();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-neutral-200 rounded-full w-48 mb-6 mx-auto" />
        <div className="flex justify-center items-center gap-2">
          {[...Array(10)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="w-14 h-14 bg-neutral-200 rounded-2xl" />
              {i < 9 && <div className="w-8 h-1 bg-neutral-200 rounded" />}
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
    'mission-roles': [],
    'vision-options': [],
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
        <div className="flex justify-between items-center mb-3">
          <span className="text-body-sm font-medium text-neutral-700">
            {language === 'ko' ? '여정 진행률' : 'Journey Progress'}
          </span>
          <span className="font-display text-lg font-bold text-primary-600">
            {overallProgress}%
          </span>
        </div>
        <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500 ease-out-expo"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-caption text-neutral-500">
          <span>
            {completedModules.length} {language === 'ko' ? '개 완료' : 'completed'}
          </span>
          <span>
            {MODULE_ORDER.length - completedModules.length} {language === 'ko' ? '개 남음' : 'remaining'}
          </span>
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
            <h3 className="font-display text-lg font-bold text-neutral-900">
              {language === 'ko' ? '나의 여정' : 'My Journey'}
            </h3>
            <p className="text-body-sm text-neutral-500 mt-1">
              {completedModules.length} {language === 'ko' ? '개 모듈 완료' : 'modules completed'} / {MODULE_ORDER.length} {language === 'ko' ? '개 중' : 'total'}
            </p>
          </div>
          <div className="font-display text-display-sm font-bold text-primary-600">{overallProgress}%</div>
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
            const prevCompleted = index > 0 && completedSet.has(MODULE_ORDER[index - 1]);

            return (
              <React.Fragment key={moduleId}>
                <ModuleNode
                  moduleId={moduleId}
                  order={index + 1}
                  status={status}
                  isLocked={isLocked}
                  isNext={isNext}
                  completionPercentage={completionPercentage}
                  language={language}
                />
                {index < MODULE_ORDER.length - 1 && (
                  <ConnectionLine
                    isCompleted={isCompleted}
                    isActive={prevCompleted && !isCompleted}
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
    <div className="w-full card p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-label text-primary-600 uppercase tracking-wider">Progress</span>
          <h2 className="font-display text-xl font-bold text-neutral-900 mt-1">
            {language === 'ko' ? 'LifeCraft 여정' : 'LifeCraft Journey'}
          </h2>
          <p className="text-body-sm text-neutral-500 mt-1">
            {language === 'ko'
              ? '10개의 모듈을 순서대로 완료하세요'
              : 'Complete 10 modules in sequence'}
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-display-md font-bold text-primary-600">{overallProgress}%</div>
          <p className="text-caption text-neutral-500">
            {language === 'ko' ? '전체 진행률' : 'Overall Progress'}
          </p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-8">
        <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-emerald-500 rounded-full transition-all duration-500 ease-out-expo"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Part Labels */}
      {showPartLabels && (
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
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
                language={language}
              />
            );
          })}
        </div>
      )}

      {/* Module Journey Map */}
      <div className="overflow-x-auto">
        <div className="flex items-center justify-center min-w-[700px] gap-2 px-4 py-6">
          {MODULE_ORDER.map((moduleId, index) => {
            const moduleData = modules[moduleId];
            const status = moduleData?.progress?.status || 'not_started';
            const isLocked = !moduleData?.canStart && status === 'not_started';
            const isNext = nextModuleId === moduleId;
            const completionPercentage = moduleData?.progress?.completionPercentage || 0;
            const isCompleted = status === 'completed';
            const prevCompleted = index > 0 && completedSet.has(MODULE_ORDER[index - 1]);

            return (
              <React.Fragment key={moduleId}>
                <ModuleNode
                  moduleId={moduleId}
                  order={index + 1}
                  status={status}
                  isLocked={isLocked}
                  isNext={isNext}
                  completionPercentage={completionPercentage}
                  language={language}
                />
                {index < MODULE_ORDER.length - 1 && (
                  <ConnectionLine
                    isCompleted={isCompleted}
                    isActive={prevCompleted && !isCompleted}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Next Step CTA */}
      {nextModuleId && (
        <div className="mt-8 pt-8 border-t border-neutral-100">
          <NextStepCTA moduleId={nextModuleId} language={language} />
        </div>
      )}

      {/* All Completed */}
      {!nextModuleId && completedModules.length === MODULE_ORDER.length && (
        <div className="mt-8 pt-8 border-t border-neutral-100 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-display font-semibold">
              {language === 'ko'
                ? '모든 모듈을 완료했습니다!'
                : 'All modules completed!'}
            </span>
          </div>
          <p className="text-body-sm text-neutral-500 mt-3">
            {language === 'ko'
              ? '대시보드에서 통합 프로필과 인사이트를 확인하세요.'
              : 'Check your integrated profile and insights on the dashboard.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Next Step CTA Component
// ============================================================================

function NextStepCTA({ moduleId, language }: { moduleId: ModuleId; language: string }) {
  const { modules } = useAllModulesProgress();
  const moduleData = modules[moduleId];
  const config = MODULE_CONFIGS[moduleId];
  const Icon = MODULE_ICONS[moduleId];
  const colors = MODULE_COLORS[moduleId];

  const isInProgress = moduleData?.progress?.status === 'in_progress';
  const completionPercentage = moduleData?.progress?.completionPercentage || 0;

  const moduleName = language === 'ko' ? config.nameKo : config.name;
  const moduleDescription = language === 'ko' ? config.descriptionKo : config.description;

  return (
    <Link
      href={config.route}
      className={`
        flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-300
        ${colors.bgLight} ${colors.border} hover:shadow-medium group
      `}
    >
      <div
        className={`
          w-14 h-14 rounded-xl flex items-center justify-center shadow-soft
          ${colors.bg} text-white
        `}
      >
        <Icon className="w-7 h-7" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-caption font-medium ${colors.text}`}>
            {isInProgress
              ? (language === 'ko' ? '계속하기' : 'Continue')
              : (language === 'ko' ? '다음 단계' : 'Next Step')}
          </span>
        </div>
        <h3 className="font-display text-lg font-bold text-neutral-900">{moduleName}</h3>
        <p className="text-body-sm text-neutral-600 mt-0.5">{moduleDescription}</p>

        {isInProgress && completionPercentage > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-caption text-neutral-500 mb-1">
              <span>{language === 'ko' ? '진행률' : 'Progress'}</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.bg} rounded-full transition-all duration-300`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <ArrowRight className={`w-6 h-6 ${colors.text} group-hover:translate-x-1 transition-transform duration-200`} />
    </Link>
  );
}

// ============================================================================
// Export Additional Components
// ============================================================================

export { ModuleNode, ConnectionLine, PartLabel };
