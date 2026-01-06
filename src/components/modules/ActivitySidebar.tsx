'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';

export type ActivityStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export interface Activity {
  id: string;
  label: string;
  labelKo?: string;
  href: string;
  status: ActivityStatus;
  description?: string;
  descriptionKo?: string;
}

interface ActivitySidebarProps {
  activities: Activity[];
  title?: string;
  titleKo?: string;
  showCompletionStats?: boolean;
}

const statusIcons: Record<ActivityStatus, React.ReactNode> = {
  locked: (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  available: (
    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
  ),
  'in-progress': (
    <div className="w-4 h-4 rounded-full border-2 border-teal-500 bg-teal-100 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-teal-500" />
    </div>
  ),
  completed: (
    <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ),
};

const statusColors: Record<ActivityStatus, string> = {
  locked: 'text-gray-400',
  available: 'text-gray-700 hover:text-gray-900',
  'in-progress': 'text-teal-700 font-medium',
  completed: 'text-gray-600',
};

export default function ActivitySidebar({
  activities,
  title = 'Steps',
  titleKo = '단계',
  showCompletionStats = true,
}: ActivitySidebarProps) {
  const pathname = usePathname();
  const { language } = useLanguage();

  const completedCount = activities.filter(a => a.status === 'completed').length;
  const totalCount = activities.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const displayTitle = language === 'ko' ? titleKo : title;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{displayTitle}</h3>
        {showCompletionStats && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{completedCount} / {totalCount} {language === 'ko' ? '완료' : 'completed'}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Activity List */}
      <nav className="py-2">
        <ul className="space-y-0.5">
          {activities.map((activity, index) => {
            const isCurrentPage = pathname === activity.href;
            const isLocked = activity.status === 'locked';
            const displayLabel = language === 'ko' && activity.labelKo ? activity.labelKo : activity.label;
            const displayDescription = language === 'ko' && activity.descriptionKo ? activity.descriptionKo : activity.description;

            const content = (
              <div className={`
                flex items-start gap-3 px-4 py-2.5 transition-colors
                ${isCurrentPage ? 'bg-teal-50 border-l-2 border-teal-500' : 'hover:bg-gray-50'}
                ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}>
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {statusIcons[activity.status]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${statusColors[activity.status]} ${isCurrentPage ? 'font-medium text-teal-700' : ''}`}>
                    <span className="text-gray-400 mr-1.5">{index + 1}.</span>
                    {displayLabel}
                  </div>
                  {displayDescription && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {displayDescription}
                    </p>
                  )}
                </div>

                {/* Arrow for current/available */}
                {!isLocked && (
                  <svg
                    className={`w-4 h-4 flex-shrink-0 ${isCurrentPage ? 'text-teal-500' : 'text-gray-300'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            );

            if (isLocked) {
              return (
                <li key={activity.id} className="cursor-not-allowed">
                  {content}
                </li>
              );
            }

            return (
              <li key={activity.id}>
                <Link href={activity.href} className="block">
                  {content}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

// Helper function to create activities from step data
export function createActivitiesFromSteps(
  steps: Array<{
    id: string;
    label: string;
    labelKo?: string;
    description?: string;
    descriptionKo?: string;
  }>,
  baseHref: string,
  currentStep: number,
  completedSteps: number[]
): Activity[] {
  return steps.map((step, index) => {
    const stepNumber = index + 1;
    let status: ActivityStatus = 'locked';

    if (completedSteps.includes(stepNumber)) {
      status = 'completed';
    } else if (stepNumber === currentStep) {
      status = 'in-progress';
    } else if (stepNumber <= Math.max(...completedSteps, 0) + 1) {
      status = 'available';
    }

    return {
      id: step.id,
      label: step.label,
      labelKo: step.labelKo,
      description: step.description,
      descriptionKo: step.descriptionKo,
      href: `${baseHref}/step${stepNumber}`,
      status,
    };
  });
}
