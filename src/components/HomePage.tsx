'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Sparkles, Heart, Target, User, Lightbulb,
  Eye, Grid3X3, CheckCircle2, Zap, LogIn, LogOut,
  LayoutDashboard, Loader2, ChevronRight, Compass, Mountain, Leaf
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { JourneyProgressMap } from '@/components/dashboard';
import { useAllModulesProgress } from '@/hooks/useModuleProgress';
import { MODULE_ORDER, MODULE_CONFIGS, getNextModule, ModuleId } from '@/lib/types/modules';
import { useTranslation } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';

/* =============================================================================
 * Terra Editorial Design - Journey Parts Configuration
 * Warm Earth Tones color scheme applied
 * New module order: enneagram → life-themes → values → mission → life-roles → vision → swot → career-options → goals → errc
 * ============================================================================= */
const JOURNEY_PARTS = [
  {
    id: 'self-discovery',
    modules: ['enneagram', 'life-themes', 'values'] as ModuleId[],
    icon: Compass,
    gradient: 'from-primary-500 to-primary-600',
    bgGradient: 'from-primary-50 to-primary-100/50',
    borderColor: 'border-primary-200',
    accentColor: 'text-primary-700',
    iconBg: 'bg-primary-100',
  },
  {
    id: 'mission-roles',
    modules: ['mission', 'life-roles'] as ModuleId[],
    icon: Target,
    gradient: 'from-secondary-500 to-secondary-600',
    bgGradient: 'from-secondary-50 to-secondary-100/50',
    borderColor: 'border-secondary-200',
    accentColor: 'text-secondary-700',
    iconBg: 'bg-secondary-100',
  },
  {
    id: 'vision-options',
    modules: ['vision', 'swot', 'career-options'] as ModuleId[],
    icon: Mountain,
    gradient: 'from-accent-500 to-accent-600',
    bgGradient: 'from-accent-50 to-accent-100/50',
    borderColor: 'border-accent-300',
    accentColor: 'text-accent-700',
    iconBg: 'bg-accent-100',
  },
  {
    id: 'goal-setting',
    modules: ['goals', 'errc'] as ModuleId[],
    icon: Leaf,
    gradient: 'from-success to-success-dark',
    bgGradient: 'from-success-light to-success-light/50',
    borderColor: 'border-success/20',
    accentColor: 'text-success-dark',
    iconBg: 'bg-success-light',
  },
];

export const HomePage: React.FC = () => {
  const { user, isAuthenticated, loading, signInWithGoogle, signOut } = useAuth();
  const { completedModules, loading: modulesLoading } = useAllModulesProgress();
  const { t, language } = useTranslation();

  const completedSet = new Set(completedModules);
  const nextModule = isAuthenticated ? getNextModule(completedSet) : null;
  const nextModuleConfig = nextModule ? MODULE_CONFIGS[nextModule] : null;

  const getModuleName = (moduleId: ModuleId) => {
    return language === 'ko'
      ? MODULE_CONFIGS[moduleId].nameKo
      : MODULE_CONFIGS[moduleId].name;
  };

  const getModuleDescription = (moduleId: ModuleId) => {
    return language === 'ko'
      ? MODULE_CONFIGS[moduleId].descriptionKo
      : MODULE_CONFIGS[moduleId].description;
  };

  return (
    <div className="min-h-screen bg-surface-cream">
      {/* =========================================================================
       * Header - Editorial Navigation
       * ========================================================================= */}
      <header className="w-full py-4 px-6 bg-surface-paper/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-editorial-wide mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-medium group-hover:shadow-elevated transition-shadow duration-300">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-neutral-950 tracking-tight">
                {t('common.appName')}
              </h1>
              <p className="text-label text-neutral-400 hidden sm:block">Self-Discovery Journey</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-3">
            <LanguageToggle variant="pill" />

            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all duration-200 shadow-soft hover:shadow-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.dashboard')}</span>
                </Link>
                <button
                  onClick={signOut}
                  className="p-2.5 text-neutral-500 hover:text-error hover:bg-error-light rounded-lg transition-all duration-200"
                  title={t('common.signOut')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
                {user?.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || 'User'}
                    className="w-9 h-9 rounded-full border-2 border-neutral-200 shadow-subtle"
                  />
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface-paper border border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-surface-warm hover:border-neutral-300 transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('common.signIn')}</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* =========================================================================
       * Hero Section - Editorial Typography
       * ========================================================================= */}
      <main className="max-w-editorial mx-auto px-6 lg:px-8">
        <section className="pt-16 pb-20 md:pt-24 md:pb-28">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-8 animate-fade-up">
            <div className="accent-line" />
            <span className="text-label text-primary-600">{t('home.hero.subtitle')}</span>
          </div>

          {/* Main Headline - Editorial Style */}
          <div className="max-w-4xl mb-10">
            <h2 className="font-display text-display-lg md:text-display-xl lg:text-display-2xl text-neutral-950 mb-6 animate-fade-up delay-100 fill-both">
              {t('home.hero.title1')}
              <span className="block text-primary-600 mt-2">
                {t('home.hero.title2')}
              </span>
            </h2>

            <p className="text-body-lg md:text-body-xl text-neutral-600 max-w-2xl leading-relaxed animate-fade-up delay-200 fill-both">
              {t('home.hero.description')}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up delay-300 fill-both">
            {isAuthenticated ? (
              nextModuleConfig ? (
                <Link
                  href={nextModuleConfig.route}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all duration-300 shadow-medium hover:shadow-elevated"
                >
                  <span>
                    {completedModules.length === 0
                      ? t('home.cta.startJourney')
                      : t('home.cta.continueModule', { moduleName: getModuleName(nextModule!) })}
                  </span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-success text-white rounded-xl font-semibold hover:bg-success-dark transition-all duration-300 shadow-medium hover:shadow-elevated"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{language === 'ko' ? '완료! 결과 보기' : 'Complete! View Results'}</span>
                </Link>
              )
            ) : (
              <button
                onClick={signInWithGoogle}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all duration-300 shadow-medium hover:shadow-elevated"
              >
                <span>{language === 'ko' ? '무료로 시작하기' : 'Start for Free'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            )}

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-4 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl font-medium transition-all duration-200"
            >
              <span>{t('common.viewDashboard')}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* =========================================================================
         * Journey Overview - 4 Parts Grid
         * ========================================================================= */}
        <section className="py-16 border-t border-neutral-100">
          <div className="mb-12">
            <span className="text-label text-neutral-400 mb-3 block">{language === 'ko' ? '여정 개요' : 'Journey Overview'}</span>
            <h3 className="font-display text-display-sm md:text-display-md text-neutral-950 mb-3">
              {t('home.journey.title')}
            </h3>
            <p className="text-body-lg text-neutral-500 max-w-xl">{t('home.journey.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {JOURNEY_PARTS.map((part, index) => {
              const Icon = part.icon;
              const completedInPart = part.modules.filter((m) => completedSet.has(m)).length;
              const totalInPart = part.modules.length;
              const isPartComplete = completedInPart === totalInPart;
              const isPartStarted = completedInPart > 0;

              const partNumber = (index + 1).toString();
              const partTitle = t(`home.parts.${partNumber}.title`);
              const partEnglishTitle = t(`home.parts.${partNumber}.englishTitle`);
              const partDescription = t(`home.parts.${partNumber}.description`);

              return (
                <div
                  key={part.id}
                  className={`
                    group relative p-6 rounded-2xl border transition-all duration-300 hover-lift
                    ${isPartComplete
                      ? 'bg-gradient-to-br from-success-light to-white border-success/30'
                      : isPartStarted
                        ? `bg-gradient-to-br ${part.bgGradient} ${part.borderColor}`
                        : 'bg-surface-paper border-neutral-100 hover:border-neutral-200'
                    }
                  `}
                >
                  {/* Part Number */}
                  <div className={`
                    absolute -top-3 -left-3 w-8 h-8 rounded-full text-body-sm font-bold
                    flex items-center justify-center shadow-soft
                    ${isPartComplete
                      ? 'bg-success text-white'
                      : isPartStarted
                        ? `bg-gradient-to-br ${part.gradient} text-white`
                        : 'bg-surface-paper border border-neutral-200 text-neutral-500'
                    }
                  `}>
                    {isPartComplete ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>

                  {/* Icon */}
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center mb-5
                    transition-transform duration-300 group-hover:scale-105
                    ${isPartComplete
                      ? 'bg-success/10 text-success'
                      : `${part.iconBg} ${part.accentColor}`
                    }
                  `}>
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <h4 className={`font-display text-lg font-semibold mb-1 ${isPartComplete ? 'text-success-dark' : part.accentColor}`}>
                    {partTitle}
                  </h4>
                  <p className="text-caption text-neutral-400 mb-3">{partEnglishTitle}</p>
                  <p className="text-body-sm text-neutral-600 mb-5 line-clamp-2">{partDescription}</p>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out-expo ${
                          isPartComplete ? 'bg-success' : `bg-gradient-to-r ${part.gradient}`
                        }`}
                        style={{ width: `${(completedInPart / totalInPart) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-caption">
                      <span className="text-neutral-400">
                        {completedInPart}/{totalInPart} {t('common.modules')}
                      </span>
                      {isPartComplete && (
                        <span className="text-success font-medium">{t('common.completed')}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flow Indicator */}
          <div className="hidden lg:flex justify-center mt-8">
            <div className="flex items-center gap-4 text-neutral-400">
              <span className="text-body-sm font-medium">{t('home.journey.flow.selfDiscovery')}</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-body-sm font-medium">{t('home.journey.flow.vision')}</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-body-sm font-medium">{t('home.journey.flow.strategy')}</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-body-sm font-medium">{t('home.journey.flow.action')}</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
         * Journey Progress (Authenticated Users)
         * ========================================================================= */}
        {isAuthenticated && !modulesLoading && (
          <section className="py-16 border-t border-neutral-100">
            <div className="mb-10">
              <span className="text-label text-neutral-400 mb-3 block">{language === 'ko' ? '나의 진행 상황' : 'My Progress'}</span>
              <h3 className="font-display text-display-sm text-neutral-950 mb-2">{t('home.progress.title')}</h3>
              <p className="text-body-lg text-neutral-500">
                {completedModules.length === 1
                  ? t('home.progress.modulesCompleted', { count: completedModules.length })
                  : t('home.progress.modulesCompletedPlural', { count: completedModules.length })}
                {' '}{t('home.progress.outOf')}
              </p>
            </div>
            <JourneyProgressMap variant="compact" />
          </section>
        )}

        {/* =========================================================================
         * Benefits Section
         * ========================================================================= */}
        <section className="py-16 border-t border-neutral-100">
          <div className="mb-12">
            <span className="text-label text-neutral-400 mb-3 block">{language === 'ko' ? '왜 선택해야 하나요?' : 'Why Choose Us?'}</span>
            <h3 className="font-display text-display-sm md:text-display-md text-neutral-950 mb-3">
              {language === 'ko' ? '왜 LifeCraft인가요?' : 'Why LifeCraft?'}
            </h3>
            <p className="text-body-lg text-neutral-500 max-w-xl">
              {language === 'ko'
                ? '과학적 이론과 AI 기술을 결합한 커리어 코칭'
                : 'Career coaching combining scientific theory and AI technology'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <BenefitCard
              icon={<Sparkles className="w-6 h-6" />}
              title={language === 'ko' ? 'AI 기반 인사이트' : 'AI-Powered Insights'}
              description={language === 'ko'
                ? 'Claude AI가 당신의 응답을 분석하여 개인화된 인사이트를 제공합니다.'
                : 'Claude AI analyzes your responses to provide personalized insights.'}
              variant="primary"
            />
            <BenefitCard
              icon={<Target className="w-6 h-6" />}
              title={language === 'ko' ? '실행 가능한 결과' : 'Actionable Results'}
              description={language === 'ko'
                ? '단순한 분석을 넘어 구체적인 목표와 실행 계획을 수립합니다.'
                : 'Go beyond simple analysis to establish concrete goals and action plans.'}
              variant="secondary"
            />
            <BenefitCard
              icon={<CheckCircle2 className="w-6 h-6" />}
              title={language === 'ko' ? '과학적 검증' : 'Scientifically Validated'}
              description={language === 'ko'
                ? '에니어그램, OKR, SWOT 등 검증된 프레임워크를 활용합니다.'
                : 'Uses validated frameworks like Enneagram, OKR, and SWOT.'}
              variant="accent"
            />
          </div>
        </section>

        {/* =========================================================================
         * Module List Preview
         * ========================================================================= */}
        <section className="py-16 border-t border-neutral-100">
          <div className="mb-12">
            <span className="text-label text-neutral-400 mb-3 block">{language === 'ko' ? '전체 모듈' : 'All Modules'}</span>
            <h3 className="font-display text-display-sm md:text-display-md text-neutral-950 mb-3">
              {language === 'ko' ? '10개의 모듈' : '10 Modules'}
            </h3>
            <p className="text-body-lg text-neutral-500 max-w-xl">
              {language === 'ko'
                ? '순서대로 진행하며 자기 발견의 여정을 완성하세요'
                : 'Complete your self-discovery journey in sequence'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {MODULE_ORDER.map((moduleId, index) => {
              const isCompleted = completedSet.has(moduleId);
              const isNext = nextModule === moduleId;

              return (
                <ModulePreviewCard
                  key={moduleId}
                  order={index + 1}
                  name={getModuleName(moduleId)}
                  description={getModuleDescription(moduleId)}
                  isCompleted={isCompleted}
                  isNext={isNext}
                  isLocked={!isCompleted && !isNext && index > 0}
                  href={MODULE_CONFIGS[moduleId].route}
                  language={language}
                />
              );
            })}
          </div>
        </section>

        {/* =========================================================================
         * Final CTA
         * ========================================================================= */}
        <section className="py-16 border-t border-neutral-100">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-50 via-accent-50 to-secondary-50 p-12 md:p-16">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-200/30 rounded-full blur-3xl" />

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <h3 className="font-display text-display-md text-neutral-950 mb-4">
                {language === 'ko' ? '지금 시작하세요' : 'Start Now'}
              </h3>
              <p className="text-body-lg text-neutral-600 mb-10">
                {language === 'ko'
                  ? '무료로 시작하여 나만의 커리어 로드맵을 만들어보세요. 10단계 여정이 당신의 잠재력을 발견하는 데 도움을 드릴 것입니다.'
                  : 'Start for free and create your own career roadmap. The 10-step journey will help you discover your potential.'}
              </p>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 bg-primary-600 text-white px-10 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-300 shadow-medium hover:shadow-elevated"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  {language === 'ko' ? '대시보드로 이동' : 'Go to Dashboard'}
                </Link>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="inline-flex items-center gap-3 bg-primary-600 text-white px-10 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-300 shadow-medium hover:shadow-elevated"
                >
                  {language === 'ko' ? '무료로 시작하기' : 'Start for Free'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
       * Footer
       * ========================================================================= */}
      <footer className="border-t border-neutral-100 bg-surface-paper py-12 px-6 mt-16">
        <div className="max-w-editorial mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display text-lg font-bold text-neutral-950">LifeCraft</span>
                <p className="text-caption text-neutral-400">AI-Powered Career Coaching</p>
              </div>
            </div>

            {/* Copyright */}
            <p className="text-body-sm text-neutral-400">
              {language === 'ko'
                ? '© 2025 LifeCraft. AI 기반 커리어 코칭 플랫폼.'
                : '© 2025 LifeCraft. AI-Powered Career Coaching Platform.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* =============================================================================
 * Benefit Card Component
 * ============================================================================= */
function BenefitCard({
  icon,
  title,
  description,
  variant,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: 'primary' | 'secondary' | 'accent';
}) {
  const variantStyles = {
    primary: {
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      hoverBorder: 'hover:border-primary-200',
    },
    secondary: {
      iconBg: 'bg-secondary-100',
      iconColor: 'text-secondary-600',
      hoverBorder: 'hover:border-secondary-200',
    },
    accent: {
      iconBg: 'bg-accent-100',
      iconColor: 'text-accent-700',
      hoverBorder: 'hover:border-accent-300',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`card-interactive p-7 ${styles.hoverBorder}`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${styles.iconBg} ${styles.iconColor}`}>
        {icon}
      </div>
      <h4 className="font-display text-lg font-semibold text-neutral-900 mb-3">{title}</h4>
      <p className="text-body-sm text-neutral-600 leading-relaxed">{description}</p>
    </div>
  );
}

/* =============================================================================
 * Module Preview Card Component
 * ============================================================================= */
function ModulePreviewCard({
  order,
  name,
  description,
  isCompleted,
  isNext,
  isLocked,
  href,
  language,
}: {
  order: number;
  name: string;
  description: string;
  isCompleted: boolean;
  isNext: boolean;
  isLocked: boolean;
  href: string;
  language: string;
}) {
  const content = (
    <div
      className={`
        relative p-5 rounded-xl border transition-all duration-300 h-full
        ${isCompleted
          ? 'bg-gradient-to-br from-success-light to-white border-success/30'
          : isNext
            ? 'bg-gradient-to-br from-primary-50 to-white border-primary-300 shadow-glow-primary'
            : isLocked
              ? 'bg-neutral-50 border-neutral-100 opacity-50'
              : 'bg-surface-paper border-neutral-100 hover:border-neutral-200 hover:shadow-soft'
        }
      `}
    >
      {/* Order Badge */}
      <div
        className={`
          absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full text-body-xs font-bold
          flex items-center justify-center shadow-subtle
          ${isCompleted
            ? 'bg-success text-white'
            : isNext
              ? 'bg-primary-600 text-white'
              : 'bg-surface-paper border border-neutral-200 text-neutral-500'
          }
        `}
      >
        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : order}
      </div>

      <h5 className={`font-display font-semibold mb-2 ${
        isCompleted ? 'text-success-dark' : isLocked ? 'text-neutral-400' : 'text-neutral-900'
      }`}>
        {name}
      </h5>
      <p className={`text-body-xs line-clamp-2 ${isLocked ? 'text-neutral-300' : 'text-neutral-500'}`}>
        {description}
      </p>

      {isNext && (
        <div className="mt-3 flex items-center gap-1 text-body-xs text-primary-600 font-medium">
          <span>{language === 'ko' ? '다음 단계' : 'Next Step'}</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );

  if (isLocked) {
    return <div className="cursor-not-allowed">{content}</div>;
  }

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}

export default HomePage;
