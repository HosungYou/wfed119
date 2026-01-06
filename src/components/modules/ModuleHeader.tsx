'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage, useTranslation } from '@/lib/i18n';
import type { ModuleId } from '@/lib/types/modules';

interface ModuleHeaderProps {
  moduleId: ModuleId;
  currentStep?: number;
  totalSteps?: number;
  showProgress?: boolean;
  title?: string;
  subtitle?: string;
}

// Module display names (will be used until full i18n integration)
const MODULE_NAMES: Record<ModuleId, { en: string; ko: string }> = {
  'values': { en: 'Values Discovery', ko: '가치 발견' },
  'strengths': { en: 'Strengths Discovery', ko: '강점 발견' },
  'enneagram': { en: 'Enneagram Assessment', ko: '에니어그램 평가' },
  'life-themes': { en: 'Life Themes', ko: '삶의 주제' },
  'vision': { en: 'Vision & Dreams', ko: '비전 & 꿈' },
  'mission': { en: 'Mission Statement', ko: '사명 선언문' },
  'career-options': { en: 'Career Options', ko: '경력 탐색' },
  'swot': { en: 'SWOT Analysis', ko: 'SWOT 분석' },
  'goals': { en: 'Goal Setting', ko: '목표 설정' },
  'errc': { en: 'ERRC Framework', ko: 'ERRC 프레임워크' },
};

export default function ModuleHeader({
  moduleId,
  currentStep,
  totalSteps,
  showProgress = true,
  title,
  subtitle,
}: ModuleHeaderProps) {
  const router = useRouter();
  const { language } = useLanguage();

  const moduleName = MODULE_NAMES[moduleId]?.[language] || MODULE_NAMES[moduleId]?.en || moduleId;
  const displayTitle = title || moduleName;

  const handleHomeClick = () => {
    router.push('/');
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        {/* Top row: Navigation */}
        <div className="flex items-center justify-between mb-2">
          {/* Left: Home & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleHomeClick}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
              aria-label={language === 'en' ? 'Go to home' : '홈으로 이동'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden sm:inline">{language === 'en' ? 'Home' : '홈'}</span>
            </button>

            <span className="text-gray-300">/</span>

            <button
              onClick={handleDashboardClick}
              className="text-gray-500 hover:text-gray-900 transition-colors text-sm"
            >
              {language === 'en' ? 'Dashboard' : '대시보드'}
            </button>

            <span className="text-gray-300">/</span>

            <span className="text-gray-900 font-medium text-sm truncate max-w-[150px] sm:max-w-none">
              {moduleName}
            </span>
          </div>

          {/* Right: Step Progress (if applicable) */}
          {showProgress && currentStep !== undefined && totalSteps !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>
                {language === 'en' ? 'Step' : '단계'} {currentStep} / {totalSteps}
              </span>
            </div>
          )}
        </div>

        {/* Bottom row: Title & Progress bar */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {displayTitle}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
          )}

          {/* Progress bar */}
          {showProgress && currentStep !== undefined && totalSteps !== undefined && (
            <div className="mt-3">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
