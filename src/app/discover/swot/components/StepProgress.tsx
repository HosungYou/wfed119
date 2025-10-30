'use client';

import React from 'react';
import { Check, Circle } from 'lucide-react';

interface StepProgressProps {
  currentStage: 'analysis' | 'strategy' | 'prioritization' | 'reflection' | 'completed';
}

export function StepProgress({ currentStage }: StepProgressProps) {
  const steps = [
    { id: 'analysis', label: 'SWOT Analysis', number: 1 },
    { id: 'strategy', label: 'Strategy Generation', number: 2 },
    { id: 'prioritization', label: 'Prioritization', number: 3 },
    { id: 'reflection', label: 'Reflection', number: 4 }
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStage);

    if (currentStage === 'completed') return 'completed';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        SWOT Analysis & Strategy Development
      </h3>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center justify-center w-full mb-2">
                  {/* Circle */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      transition-all duration-300
                      ${status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'current'
                        ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {status === 'completed' ? (
                      <Check className="w-5 h-5" />
                    ) : status === 'current' ? (
                      <Circle className="w-5 h-5 fill-current" />
                    ) : (
                      step.number
                    )}
                  </div>
                </div>

                {/* Label */}
                <div className="text-center">
                  <p
                    className={`
                      text-xs font-medium
                      ${status === 'completed' || status === 'current'
                        ? 'text-gray-900'
                        : 'text-gray-500'
                      }
                    `}
                  >
                    {step.label}
                  </p>
                  {status === 'completed' && (
                    <p className="text-xs text-green-600 mt-1">Completed ✓</p>
                  )}
                  {status === 'current' && (
                    <p className="text-xs text-blue-600 mt-1">In Progress</p>
                  )}
                  {status === 'pending' && (
                    <p className="text-xs text-gray-400 mt-1">Pending</p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 -mt-12">
                  <div
                    className={`
                      h-full transition-all duration-300
                      ${status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                      }
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
