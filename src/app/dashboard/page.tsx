'use client';

import React from 'react';
import Link from 'next/link';
import { User, Lock, Home, Loader2, Settings, LogOut } from 'lucide-react';
import {
  JourneyProgressMap,
  CompletedModulesSummary,
  IntegratedProfileCard,
} from '@/components/dashboard';
import { useAllModulesProgress } from '@/hooks/useModuleProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/i18n';

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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{t.loginRequired}</h1>
            <p className="text-gray-600 mb-8">{t.loginDescription}</p>
            <button
              onClick={signInWithGoogle}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              {t.signInWithGoogle}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center gap-4">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || 'User'}
                  className="w-10 h-10 rounded-full border-2 border-primary-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {user?.user_metadata?.full_name || t.dashboard}
                </h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">{t.home}</span>
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">{t.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{t.myJourney}</h2>
          <p className="text-gray-600 mt-1">{t.journeyDescription}</p>
        </div>

        {/* Journey Progress Map */}
        <div className="mb-8">
          {modulesLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <JourneyProgressMap variant="full" showPartLabels={true} />
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Completed Modules */}
          <div>
            {modulesLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl" />
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
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-gray-100 rounded" />
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
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            href="/discover/values"
            title={t.values}
            description={t.valuesDesc}
            icon="heart"
            color="rose"
          />
          <QuickActionCard
            href="/discover/strengths"
            title={t.strengths}
            description={t.strengthsDesc}
            icon="target"
            color="blue"
          />
          <QuickActionCard
            href="/discover/vision"
            title={t.vision}
            description={t.visionDesc}
            icon="eye"
            color="purple"
          />
          <QuickActionCard
            href="/discover/goals"
            title={t.goals}
            description={t.goalsDesc}
            icon="check"
            color="indigo"
          />
        </div>
      </main>
    </div>
  );
}

// Quick Action Card Component
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
  color: 'rose' | 'blue' | 'purple' | 'indigo';
}) {
  const colorClasses = {
    rose: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
  };

  return (
    <Link
      href={href}
      className={`
        block p-4 rounded-xl transition-colors
        ${colorClasses[color]}
      `}
    >
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm opacity-80">{description}</p>
    </Link>
  );
}
