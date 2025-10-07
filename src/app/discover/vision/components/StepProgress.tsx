'use client';

import React from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface Step {
  number: number;
  title: string;
  description: string;
  path: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Imagine Future',
    description: 'Visualize your ideal self in 10 years',
    path: '/discover/vision/step1'
  },
  {
    number: 2,
    title: 'Core Aspirations',
    description: 'Discover what you truly want',
    path: '/discover/vision/step2'
  },
  {
    number: 3,
    title: 'Draft Vision',
    description: 'Craft your one-sentence vision',
    path: '/discover/vision/step3'
  },
  {
    number: 4,
    title: 'Finalize & Visualize',
    description: 'Create your vision card',
    path: '/discover/vision/step4'
  }
];

interface StepProgressProps {
  currentStep: number;
  completedSteps?: number[];
}

export default function StepProgress({ currentStep, completedSteps = [] }: StepProgressProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Mobile: Show current step only */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} / {STEPS.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="mt-3 font-semibold text-gray-900">
            {STEPS[currentStep - 1]?.title}
          </p>
          <p className="text-sm text-gray-600">
            {STEPS[currentStep - 1]?.description}
          </p>
        </div>

        {/* Desktop: Show all steps */}
        <div className="hidden md:flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.number);
            const isCurrent = currentStep === step.number;
            const isAccessible = step.number <= currentStep;

            return (
              <React.Fragment key={step.number}>
                {/* Step 원 */}
                <div className="flex flex-col items-center flex-1">
                  {isAccessible ? (
                    <Link
                      href={step.path}
                      className="group flex flex-col items-center cursor-pointer"
                    >
                      <StepCircle
                        step={step}
                        isCompleted={isCompleted}
                        isCurrent={isCurrent}
                      />
                      <StepLabel
                        step={step}
                        isCurrent={isCurrent}
                      />
                    </Link>
                  ) : (
                    <div className="flex flex-col items-center opacity-50 cursor-not-allowed">
                      <StepCircle
                        step={step}
                        isCompleted={false}
                        isCurrent={false}
                      />
                      <StepLabel
                        step={step}
                        isCurrent={false}
                      />
                    </div>
                  )}
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1 mx-2 mb-16">
                    <div
                      className={`h-full rounded transition-all duration-500 ${
                        step.number < currentStep
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepCircle({
  step,
  isCompleted,
  isCurrent
}: {
  step: Step;
  isCompleted: boolean;
  isCurrent: boolean;
}) {
  return (
    <div
      className={`
        w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg
        transition-all duration-300 relative
        ${
          isCompleted
            ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg'
            : isCurrent
            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl ring-4 ring-purple-200 scale-110'
            : 'bg-gray-200 text-gray-500'
        }
        group-hover:scale-110 group-hover:shadow-xl
      `}
    >
      {isCompleted ? (
        <Check className="w-7 h-7" />
      ) : (
        <span>{step.number}</span>
      )}

      {/* Current step pulse effect */}
      {isCurrent && (
        <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-75" />
      )}
    </div>
  );
}

function StepLabel({ step, isCurrent }: { step: Step; isCurrent: boolean }) {
  return (
    <div className="mt-3 text-center">
      <p
        className={`font-semibold transition-colors ${
          isCurrent ? 'text-purple-700' : 'text-gray-700'
        } group-hover:text-purple-600`}
      >
        {step.title}
      </p>
      <p className="text-xs text-gray-500 mt-1 max-w-[140px]">
        {step.description}
      </p>
    </div>
  );
}
