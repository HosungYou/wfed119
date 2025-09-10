'use client';

import React from 'react';
import { SessionStage } from '@/lib/store/sessionStore';

interface ProgressIndicatorProps {
  currentStage: SessionStage;
  progressPercentage: number;
  className?: string;
}

const STAGE_CONFIG = {
  initial: {
    label: 'Initial Story',
    description: 'Share your meaningful work experience',
    icon: '📖',
    order: 1
  },
  exploration: {
    label: 'Exploration',
    description: 'Diving deeper into your story',
    icon: '🔍',
    order: 2
  },
  deepening: {
    label: 'Deepening',
    description: 'Uncovering insights and patterns',
    icon: '💭',
    order: 3
  },
  analysis: {
    label: 'Analysis',
    description: 'Identifying your strengths',
    icon: '⚡',
    order: 4
  },
  summary: {
    label: 'Summary',
    description: 'Your complete strength profile',
    icon: '🎯',
    order: 5
  }
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStage,
  progressPercentage,
  className = ''
}) => {
  const stages = Object.entries(STAGE_CONFIG).sort(([, a], [, b]) => a.order - b.order);
  const currentStageOrder = STAGE_CONFIG[currentStage].order;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Session Progress</h3>
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {progressPercentage}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stage Steps */}
      <div className="space-y-3">
        {stages.map(([stageKey, config]) => {
          const stage = stageKey as SessionStage;
          const isActive = stage === currentStage;
          const isCompleted = config.order < currentStageOrder;
          const isUpcoming = config.order > currentStageOrder;

          return (
            <div
              key={stage}
              className={`flex items-center space-x-3 p-2 rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 border border-blue-200'
                  : isCompleted
                  ? 'bg-green-50'
                  : 'bg-gray-50'
              }`}
            >
              {/* Step Icon */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isCompleted ? '✓' : config.order}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{config.icon}</span>
                  <p
                    className={`font-medium ${
                      isActive
                        ? 'text-blue-800'
                        : isCompleted
                        ? 'text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {config.label}
                  </p>
                </div>
                <p
                  className={`text-sm ${
                    isActive
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {config.description}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex-shrink-0">
                {isActive && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
                {isCompleted && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                )}
                {isUpcoming && (
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Stage Info */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-md">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{STAGE_CONFIG[currentStage].icon}</span>
          <div>
            <p className="font-medium text-gray-800">
              Current: {STAGE_CONFIG[currentStage].label}
            </p>
            <p className="text-sm text-gray-600">
              {STAGE_CONFIG[currentStage].description}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      {progressPercentage < 100 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            💡 Take your time to share detailed responses for better insights
          </p>
        </div>
      )}
    </div>
  );
};