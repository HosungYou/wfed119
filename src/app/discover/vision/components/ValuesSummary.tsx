'use client';

import React from 'react';
import { Heart, Target, Briefcase } from 'lucide-react';

interface ValuesSummaryProps {
  values: {
    terminal?: { top3?: string[] };
    instrumental?: { top3?: string[] };
    work?: { top3?: string[] };
  };
  compact?: boolean;
}

export default function ValuesSummary({ values, compact = false }: ValuesSummaryProps) {
  const hasAnyValues =
    (values.terminal?.top3?.length ?? 0) > 0 ||
    (values.instrumental?.top3?.length ?? 0) > 0 ||
    (values.work?.top3?.length ?? 0) > 0;

  if (!hasAnyValues) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          Unable to load values data. Please complete the Values Discovery module first.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
            ✓
          </span>
          Your Core Values
        </h3>
        <div className="flex flex-wrap gap-2">
          {values.terminal?.top3?.map((value, idx) => (
            <span
              key={`t-${idx}`}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
            >
              {value}
            </span>
          ))}
          {values.instrumental?.top3?.slice(0, 2).map((value, idx) => (
            <span
              key={`i-${idx}`}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
            >
              {value}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Your Top 3 Values
      </h3>

      <div className="space-y-4">
        {/* Terminal Values */}
        {values.terminal?.top3 && values.terminal.top3.length > 0 && (
          <ValueCategory
            icon={<Heart className="w-5 h-5" />}
            title="Terminal Values"
            description="Ultimate life goals you want to achieve"
            values={values.terminal.top3}
            color="purple"
          />
        )}

        {/* Instrumental Values */}
        {values.instrumental?.top3 && values.instrumental.top3.length > 0 && (
          <ValueCategory
            icon={<Target className="w-5 h-5" />}
            title="Instrumental Values"
            description="Behaviors and attitudes for achieving goals"
            values={values.instrumental.top3}
            color="blue"
          />
        )}

        {/* Work Values */}
        {values.work?.top3 && values.work.top3.length > 0 && (
          <ValueCategory
            icon={<Briefcase className="w-5 h-5" />}
            title="Work Values"
            description="What matters most in your career and work"
            values={values.work.top3}
            color="green"
          />
        )}
      </div>
    </div>
  );
}

function ValueCategory({
  icon,
  title,
  description,
  values,
  color
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  values: string[];
  color: 'purple' | 'blue' | 'green';
}) {
  const colorClasses = {
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      tag: 'bg-purple-100 text-purple-800'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      tag: 'bg-blue-100 text-blue-800'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      tag: 'bg-green-100 text-green-800'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`${colors.icon} mt-0.5`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 ml-8">
        {values.map((value, idx) => (
          <span
            key={idx}
            className={`px-3 py-1.5 ${colors.tag} rounded-full text-sm font-medium`}
          >
            {idx + 1}. {value}
          </span>
        ))}
      </div>
    </div>
  );
}
