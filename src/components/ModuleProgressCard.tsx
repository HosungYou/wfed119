'use client';

import React from 'react';
import Link from 'next/link';
import {
  Heart, Target, Eye, Grid3X3, User, Lightbulb, Zap,
  Lock, CheckCircle2, Clock, ArrowRight, AlertCircle
} from 'lucide-react';
import { ModuleId, ModuleStatus, MODULE_CONFIGS } from '@/lib/types/modules';

interface ModuleProgressCardProps {
  moduleId: ModuleId;
  status: ModuleStatus;
  completionPercentage: number;
  currentStage?: string;
  canStart: boolean;
  missingPrerequisites: ModuleId[];
  compact?: boolean;
}

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

const STATUS_COLORS: Record<ModuleStatus, { bg: string; text: string; border: string }> = {
  not_started: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

export function ModuleProgressCard({
  moduleId,
  status,
  completionPercentage,
  currentStage,
  canStart,
  missingPrerequisites,
  compact = false,
}: ModuleProgressCardProps) {
  const config = MODULE_CONFIGS[moduleId];
  const Icon = MODULE_ICONS[moduleId];
  const colors = STATUS_COLORS[status];

  const isLocked = !canStart && status === 'not_started';

  if (compact) {
    return (
      <Link
        href={isLocked ? '#' : config.route}
        className={`
          flex items-center gap-3 p-3 rounded-xl border transition-all
          ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5'}
          ${colors.bg} ${colors.border}
        `}
        onClick={e => isLocked && e.preventDefault()}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
          {isLocked ? (
            <Lock className="w-5 h-5 text-gray-400" />
          ) : status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Icon className={`w-5 h-5 ${colors.text}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{config.name}</div>
          <div className="text-xs text-gray-500">
            {status === 'completed' ? 'Completed' :
             status === 'in_progress' ? `${completionPercentage}% complete` :
             isLocked ? 'Locked' : 'Not started'}
          </div>
        </div>
        {!isLocked && status !== 'completed' && (
          <ArrowRight className="w-4 h-4 text-gray-400" />
        )}
      </Link>
    );
  }

  return (
    <div className={`
      relative rounded-2xl border-2 p-6 transition-all
      ${isLocked ? 'opacity-70' : 'hover:shadow-lg'}
      ${colors.border} ${colors.bg}
    `}>
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        {status === 'completed' ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Complete
          </span>
        ) : status === 'in_progress' ? (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        ) : isLocked ? (
          <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            <Lock className="w-3 h-3" />
            Locked
          </span>
        ) : null}
      </div>

      {/* Icon */}
      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center mb-4
        ${status === 'completed' ? 'bg-green-100' :
          status === 'in_progress' ? 'bg-blue-100' :
          'bg-gray-100'}
      `}>
        {isLocked ? (
          <Lock className="w-7 h-7 text-gray-400" />
        ) : (
          <Icon className={`w-7 h-7 ${colors.text}`} />
        )}
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{config.name}</h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{config.description}</p>

      {/* Progress Bar (for in_progress) */}
      {status === 'in_progress' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{currentStage || 'Starting...'}</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Prerequisites Warning */}
      {isLocked && missingPrerequisites.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-medium">Complete first: </span>
            {missingPrerequisites.map(id => MODULE_CONFIGS[id].name).join(', ')}
          </div>
        </div>
      )}

      {/* Action Button */}
      <Link
        href={isLocked ? '#' : config.route}
        onClick={e => isLocked && e.preventDefault()}
        className={`
          w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all
          ${isLocked
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : status === 'completed'
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : status === 'in_progress'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-900 text-white hover:bg-gray-800'
          }
        `}
      >
        {status === 'completed' ? (
          <>Review Results</>
        ) : status === 'in_progress' ? (
          <>Continue</>
        ) : isLocked ? (
          <>Locked</>
        ) : (
          <>Start Module</>
        )}
        {!isLocked && <ArrowRight className="w-4 h-4" />}
      </Link>
    </div>
  );
}

/**
 * Grid of all module progress cards
 */
interface ModuleProgressGridProps {
  modules: Record<ModuleId, {
    progress: {
      status: ModuleStatus;
      completionPercentage: number;
      currentStage?: string;
    } | null;
    canStart: boolean;
    missingPrerequisites: ModuleId[];
  }>;
  compact?: boolean;
}

export function ModuleProgressGrid({ modules, compact = false }: ModuleProgressGridProps) {
  // Updated to new 8-module linear order (dreams removed, integrated into vision)
  const moduleOrder: ModuleId[] = ['values', 'strengths', 'enneagram', 'life-themes', 'vision', 'swot', 'goals', 'errc'];

  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {moduleOrder.map(moduleId => {
        const data = modules[moduleId];
        if (!data) return null;

        return (
          <ModuleProgressCard
            key={moduleId}
            moduleId={moduleId}
            status={data.progress?.status || 'not_started'}
            completionPercentage={data.progress?.completionPercentage || 0}
            currentStage={data.progress?.currentStage}
            canStart={data.canStart}
            missingPrerequisites={data.missingPrerequisites}
            compact={compact}
          />
        );
      })}
    </div>
  );
}
