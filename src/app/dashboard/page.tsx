'use client';

import React from 'react';
import Link from 'next/link';
import { User, Lock, Home, Loader2, LogOut, Heart, Target, Eye, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import {
  JourneyProgressMap,
  CompletedModulesSummary,
  IntegratedProfileCard,
} from '@/components/dashboard';
import { useAllModulesProgress } from '@/hooks/useModuleProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/i18n';

/* =============================================================================
 * Terra Editorial Design - Dashboard Page
 * Warm earth tones with editorial typography
 * ============================================================================= */

export default function DashboardPage() {
  const { user, isAuthenticated, loading, signInWithGoogle, signOut } = useAuth();
  const { completedModules, loading: modulesLoading } = useAllModulesProgress();
  const { language } = useLanguage();

  const t = {
    loginRequired: language === 'ko' ? '로그인이 필요합니다' : 'Sign in required',
    loginDescription: language === 'ko'
      ? 'Google 계정으로 로그인하여 개인화된 대시보드와 진행 상황을 확인하세요.'
      : 'Sign in with your Google account to view your personalized dashboard and progress.',
    signInWithGoogle: language === 'ko' ? 'Google로 로그인' : 'Sign in with Google',
    dashboard: language === 'ko' ? '대시보드' : 'Dashboard',
    home: language === 'ko' ? '홈' : 'Home',
    signOut: language === 'ko' ? '로그아웃' : 'Sign Out',
    myJourney: language === 'ko' ? '나의 여정' : 'My Journey',
    journeyDescription: language === 'ko'
      ? 'LifeCraft 10단계 모듈을 통해 자기 발견과 목표 설정을 완성하세요.'
      : 'Complete your self-discovery and goal setting through 10 LifeCraft modules.',
    values: language === 'ko' ? '가치관' : 'Values',
    valuesDesc: language === 'ko' ? '핵심 가치 발견' : 'Discover core values',
    strengths: language === 'ko' ? '강점' : 'Strengths',
    strengthsDesc: language === 'ko' ? 'AI 강점 분석' : 'AI strength analysis',
    vision: language === 'ko' ? '비전' : 'Vision',
    visionDesc: language === 'ko' ? '비전 & 꿈 설정' : 'Vision & dreams',
    goals: language === 'ko' ? '목표' : 'Goals',
    goalsDesc: language === 'ko' ? 'OKR 목표 설정' : 'OKR goal setting',
    quickActions: language === 'ko' ? '빠른 이동' : 'Quick Actions',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-cream">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-body-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-cream">
        <div className="max-w-lg mx-auto px-6 py-20">
          <div className="card p-10 text-center">
            <div className="w-20 h-20 mx-auto mb-8 bg-neutral-100 rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-neutral-400" />
            </div>
            <h1 className="font-display text-display-sm text-neutral-900 mb-4">{t.loginRequired}</h1>
            <p className="text-body-md text-neutral-600 mb-10">{t.loginDescription}</p>
            <button
              onClick={signInWithGoogle}
              className="btn-primary w-full py-4 text-body-md"
            >
              {t.signInWithGoogle}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-cream">
      {/* Header */}
      <header className="bg-surface-paper/90 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-10">
        <div className="max-w-editorial-wide mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center gap-4">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || 'User'}
                  className="w-12 h-12 rounded-xl border-2 border-primary-100 shadow-soft"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 shadow-soft">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="font-display text-lg font-semibold text-neutral-900 tracking-tight">
                  {user?.user_metadata?.full_name || t.dashboard}
                </h1>
                <p className="text-body-sm text-neutral-500">{user?.email}</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="btn-ghost flex items-center gap-2 px-4 py-2.5"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline text-body-sm">{t.home}</span>
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2.5 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-body-sm">{t.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-editorial-wide mx-auto px-6 py-10">
        {/* Page Title */}
        <div className="mb-10">
          <span className="text-label text-primary-600 uppercase tracking-wider">Dashboard</span>
          <h2 className="font-display text-display-md text-neutral-900 mt-2 tracking-tight">{t.myJourney}</h2>
          <p className="text-body-md text-neutral-600 mt-2">{t.journeyDescription}</p>
        </div>

        {/* Journey Progress Map */}
        <div className="mb-10">
          {modulesLoading ? (
            <div className="card p-12 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          ) : (
            <JourneyProgressMap variant="full" showPartLabels={true} />
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-10">
          {/* Left Column - Completed Modules */}
          <div>
            {modulesLoading ? (
              <div className="card p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-neutral-200 rounded w-1/3" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-neutral-100 rounded-xl" />
                  ))}
                </div>
              </div>
            ) : (
              <CompletedModulesSummary completedModules={completedModules} />
            )}
          </div>

          {/* Right Column - Integrated Profile */}
          <div>
            {modulesLoading ? (
              <div className="card p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-neutral-200 rounded w-1/2" />
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-neutral-100 rounded" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <IntegratedProfileCard showAiInsights={true} />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h3 className="font-display text-lg font-semibold text-neutral-900">{t.quickActions}</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              href="/discover/values"
              title={t.values}
              description={t.valuesDesc}
              icon="heart"
              color="primary"
            />
            <QuickActionCard
              href="/discover/strengths"
              title={t.strengths}
              description={t.strengthsDesc}
              icon="target"
              color="secondary"
            />
            <QuickActionCard
              href="/discover/vision"
              title={t.vision}
              description={t.visionDesc}
              icon="eye"
              color="accent"
            />
            <QuickActionCard
              href="/discover/goals"
              title={t.goals}
              description={t.goalsDesc}
              icon="check"
              color="neutral"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

/* =============================================================================
 * Quick Action Card Component
 * Terra Editorial styling with warm accents
 * ============================================================================= */

function QuickActionCard({
  href,
  title,
  description,
  icon,
  color,
}: {
  href: string;
  title: string;
  description: string;
  icon: 'heart' | 'target' | 'eye' | 'check';
  color: 'primary' | 'secondary' | 'accent' | 'neutral';
}) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-100',
    secondary: 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100 border-secondary-100',
    accent: 'bg-accent-50 text-accent-700 hover:bg-accent-100 border-accent-100',
    neutral: 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border-neutral-200',
  };

  const iconColorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    accent: 'text-accent-600',
    neutral: 'text-neutral-600',
  };

  const IconComponent = {
    heart: Heart,
    target: Target,
    eye: Eye,
    check: CheckCircle2,
  }[icon];

  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300
        ${colorClasses[color]}
        hover:shadow-soft hover:-translate-y-0.5
      `}
    >
      <div className={`p-2.5 bg-white/60 rounded-xl ${iconColorClasses[color]}`}>
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-sm">{title}</h4>
        <p className="text-body-sm opacity-80 truncate">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
    </Link>
  );
}
