'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Sparkles, Heart, Target, User, Lightbulb,
  Eye, Grid3X3, CheckCircle2, Zap, LogIn, LogOut,
  LayoutDashboard, Loader2, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { JourneyProgressMap } from '@/components/dashboard';
import { useAllModulesProgress } from '@/hooks/useModuleProgress';
import { MODULE_ORDER, MODULE_CONFIGS, getNextModule } from '@/lib/types/modules';

// Part data for the journey overview
const JOURNEY_PARTS = [
  {
    id: 'self-discovery',
    title: '자기 발견',
    titleEn: 'Know Yourself',
    description: '가치관, 강점, 성격, 삶의 주제 발견',
    modules: ['values', 'strengths', 'enneagram', 'life-themes'],
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    id: 'vision-mission',
    title: '비전 설정',
    titleEn: 'Envision',
    description: '꿈과 비전 선언문 작성',
    modules: ['vision'],
    icon: Eye,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  {
    id: 'strategic-analysis',
    title: '전략 분석',
    titleEn: 'Strategize',
    description: 'SWOT 분석 및 우선순위 전략',
    modules: ['swot'],
    icon: Grid3X3,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  {
    id: 'goal-setting',
    title: '목표 실행',
    titleEn: 'Act',
    description: 'OKR 목표 설정 및 실행 계획',
    modules: ['goals', 'errc'],
    icon: Zap,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
];

export const HomePage: React.FC = () => {
  const { user, isAuthenticated, loading, signInWithGoogle, signOut } = useAuth();
  const { completedModules, loading: modulesLoading } = useAllModulesProgress();

  const completedSet = new Set(completedModules);
  const nextModule = isAuthenticated ? getNextModule(completedSet) : null;
  const nextModuleConfig = nextModule ? MODULE_CONFIGS[nextModule] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full py-4 px-4 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              LifeCraft
            </h1>
          </Link>

          <nav className="flex items-center space-x-3">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">대시보드</span>
                </Link>
                <button
                  onClick={signOut}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
                {user?.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                  />
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>로그인</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium">
            AI 기반 커리어 코칭
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            나를 발견하고
            <span className="block text-primary-600 mt-2">
              미래를 설계하세요
            </span>
          </h2>

          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            8단계 모듈을 통해 자신의 가치관, 강점, 성격을 발견하고,
            명확한 비전과 실행 가능한 목표를 수립하세요.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              nextModuleConfig ? (
                <Link
                  href={nextModuleConfig.route}
                  className="group bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2 shadow-lg shadow-primary-500/20"
                >
                  <span>
                    {completedModules.length === 0
                      ? '여정 시작하기'
                      : `${nextModuleConfig.nameKo} 계속하기`}
                  </span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="group bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-lg shadow-green-500/20"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>완료! 결과 보기</span>
                </Link>
              )
            ) : (
              <button
                onClick={signInWithGoogle}
                className="group bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2 shadow-lg shadow-primary-500/20"
              >
                <span>무료로 시작하기</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <Link
              href="/dashboard"
              className="text-gray-600 px-6 py-4 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <span>대시보드 보기</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Journey Overview - 4 Parts */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">4단계 여정</h3>
            <p className="text-gray-600">순서대로 8개의 모듈을 완료하세요</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {JOURNEY_PARTS.map((part, index) => {
              const Icon = part.icon;
              const completedInPart = part.modules.filter((m) =>
                completedSet.has(m as any)
              ).length;
              const totalInPart = part.modules.length;
              const isPartComplete = completedInPart === totalInPart;
              const isPartStarted = completedInPart > 0;

              return (
                <div
                  key={part.id}
                  className={`
                    relative p-6 rounded-2xl border-2 transition-all
                    ${isPartComplete
                      ? 'bg-green-50 border-green-200'
                      : isPartStarted
                        ? `${part.bgColor} border-current/20`
                        : 'bg-white border-gray-200'
                    }
                  `}
                >
                  {/* Part Number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center mb-4
                      ${isPartComplete
                        ? 'bg-green-500 text-white'
                        : `bg-gradient-to-br ${part.color} text-white`
                      }
                    `}
                  >
                    {isPartComplete ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>

                  {/* Content */}
                  <h4 className={`text-lg font-bold mb-1 ${isPartComplete ? 'text-green-700' : part.textColor}`}>
                    {part.title}
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">{part.titleEn}</p>
                  <p className="text-sm text-gray-600 mb-4">{part.description}</p>

                  {/* Progress */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {completedInPart}/{totalInPart} 모듈
                    </span>
                    {isPartComplete && (
                      <span className="text-green-600 font-medium">완료!</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Arrow connectors for desktop */}
          <div className="hidden md:flex justify-center mt-4">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-sm">자기발견</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm">비전</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm">전략</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm">실행</span>
            </div>
          </div>
        </section>

        {/* Journey Progress (for authenticated users) */}
        {isAuthenticated && !modulesLoading && (
          <section className="mb-20">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">나의 진행 상황</h3>
              <p className="text-gray-600">
                {completedModules.length}개 모듈 완료 / {MODULE_ORDER.length}개 중
              </p>
            </div>
            <JourneyProgressMap variant="compact" />
          </section>
        )}

        {/* Benefits Section */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">왜 LifeCraft인가요?</h3>
            <p className="text-gray-600">과학적 이론과 AI 기술을 결합한 커리어 코칭</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <BenefitCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI 기반 인사이트"
              description="Claude AI가 당신의 응답을 분석하여 개인화된 인사이트를 제공합니다."
              color="primary"
            />
            <BenefitCard
              icon={<Target className="w-6 h-6" />}
              title="실행 가능한 결과"
              description="단순한 분석을 넘어 구체적인 목표와 실행 계획을 수립합니다."
              color="secondary"
            />
            <BenefitCard
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="과학적 검증"
              description="에니어그램, OKR, SWOT 등 검증된 프레임워크를 활용합니다."
              color="accent"
            />
          </div>
        </section>

        {/* Module List Preview */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">8개의 모듈</h3>
            <p className="text-gray-600">순서대로 진행하며 자기 발견의 여정을 완성하세요</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULE_ORDER.map((moduleId, index) => {
              const config = MODULE_CONFIGS[moduleId];
              const isCompleted = completedSet.has(moduleId);
              const isNext = nextModule === moduleId;

              return (
                <ModulePreviewCard
                  key={moduleId}
                  order={index + 1}
                  name={config.nameKo}
                  description={config.descriptionKo}
                  isCompleted={isCompleted}
                  isNext={isNext}
                  isLocked={!isCompleted && !isNext && index > 0}
                  href={config.route}
                />
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-12 px-8 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            지금 시작하세요
          </h3>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            무료로 시작하여 나만의 커리어 로드맵을 만들어보세요.
            8단계 여정이 당신의 잠재력을 발견하는 데 도움을 드릴 것입니다.
          </p>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              대시보드로 이동
            </Link>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              무료로 시작하기
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">LifeCraft</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 LifeCraft. AI 기반 커리어 코칭 플랫폼.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Benefit Card Component
function BenefitCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'secondary' | 'accent';
}) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    secondary: 'bg-secondary-100 text-secondary-600',
    accent: 'bg-accent-100 text-accent-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

// Module Preview Card Component
function ModulePreviewCard({
  order,
  name,
  description,
  isCompleted,
  isNext,
  isLocked,
  href,
}: {
  order: number;
  name: string;
  description: string;
  isCompleted: boolean;
  isNext: boolean;
  isLocked: boolean;
  href: string;
}) {
  const content = (
    <div
      className={`
        relative p-4 rounded-xl border-2 transition-all h-full
        ${isCompleted
          ? 'bg-green-50 border-green-200'
          : isNext
            ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500/20'
            : isLocked
              ? 'bg-gray-50 border-gray-200 opacity-60'
              : 'bg-white border-gray-200 hover:border-gray-300'
        }
      `}
    >
      {/* Order Badge */}
      <div
        className={`
          absolute -top-2 -left-2 w-6 h-6 rounded-full text-xs font-bold
          flex items-center justify-center
          ${isCompleted
            ? 'bg-green-500 text-white'
            : isNext
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-600'
          }
        `}
      >
        {isCompleted ? '✓' : order}
      </div>

      <h5 className={`font-medium mb-1 ${isCompleted ? 'text-green-700' : isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
        {name}
      </h5>
      <p className={`text-xs line-clamp-2 ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
        {description}
      </p>

      {isNext && (
        <span className="mt-2 inline-block text-xs text-primary-600 font-medium">
          다음 단계 →
        </span>
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
