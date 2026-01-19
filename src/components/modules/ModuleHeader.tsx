'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, LayoutDashboard, ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage, useTranslation } from '@/lib/i18n';
import type { ModuleId } from '@/lib/types/modules';

/* =============================================================================
 * Terra Editorial Design - Module Header
 * Clean, minimal navigation with warm earth tones
 * ============================================================================= */

interface ModuleHeaderProps {
  moduleId: ModuleId;
  currentStep?: number;
  totalSteps?: number;
  showProgress?: boolean;
  title?: string;
  subtitle?: string;
}

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

  const handleHomeClick = () => router.push('/');
  const handleDashboardClick = () => router.push('/dashboard');

  return (
    <header className="sticky top-0 z-40 bg-surface-paper/90 backdrop-blur-md border-b border-neutral-100">
      <div className="max-w-editorial mx-auto px-6 lg:px-8">
        {/* Progress bar - Top accent */}
        {showProgress && currentStep !== undefined && totalSteps !== undefined && (
          <div className="h-1 bg-neutral-100">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500 ease-out-expo"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        )}

        <div className="py-4">
          {/* Top row: Breadcrumb navigation */}
          <nav className="flex items-center justify-between mb-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-body-sm">
              <button
                onClick={handleHomeClick}
                className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-700 transition-colors duration-200"
                aria-label={language === 'en' ? 'Go to home' : '홈으로 이동'}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'Home' : '홈'}</span>
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />

              <button
                onClick={handleDashboardClick}
                className="text-neutral-400 hover:text-neutral-700 transition-colors duration-200"
              >
                {language === 'en' ? 'Dashboard' : '대시보드'}
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />

              <span className="text-neutral-700 font-medium truncate max-w-[120px] sm:max-w-none">
                {moduleName}
              </span>
            </div>

            {/* Step indicator */}
            {showProgress && currentStep !== undefined && totalSteps !== undefined && (
              <div className="flex items-center gap-3">
                {/* Step dots */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                      key={i}
                      className={`
                        w-2 h-2 rounded-full transition-all duration-300
                        ${i < currentStep
                          ? 'bg-primary-500'
                          : i === currentStep
                            ? 'bg-primary-500 scale-125'
                            : 'bg-neutral-200'
                        }
                      `}
                    />
                  ))}
                </div>

                {/* Step text */}
                <span className="text-caption text-neutral-400 font-medium">
                  {currentStep}/{totalSteps}
                </span>
              </div>
            )}
          </nav>

          {/* Title area */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-display-sm text-neutral-950 mb-1">
                {displayTitle}
              </h1>
              {subtitle && (
                <p className="text-body-sm text-neutral-500">{subtitle}</p>
              )}
            </div>

            {/* Logo mark */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-warm rounded-lg border border-neutral-100">
              <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-body-sm font-semibold text-neutral-700">LifeCraft</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
