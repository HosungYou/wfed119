'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart, Target, User, Lightbulb, Eye, Sparkles, ArrowLeft,
  TrendingUp, Award, Compass, RefreshCw, Briefcase, Star, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { IntegratedProfile } from '@/lib/types/modules';

export default function ProfilePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<IntegratedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const t = {
    pageTitle: language === 'ko' ? '나의 통합 프로필' : 'My Integrated Profile',
    pageDescription: language === 'ko'
      ? '모듈 완료를 통해 생성된 개인화된 프로필입니다.'
      : 'Your personalized profile generated through module completion.',
    backToDashboard: language === 'ko' ? '대시보드로 돌아가기' : 'Back to Dashboard',
    refreshAnalysis: language === 'ko' ? 'AI 분석 새로고침' : 'Refresh AI Analysis',
    noProfile: language === 'ko' ? '프로필이 아직 생성되지 않았습니다.' : 'Profile not yet created.',
    noProfileHint: language === 'ko'
      ? '모듈을 완료하면 통합 프로필이 자동으로 생성됩니다.'
      : 'Complete modules to automatically generate your integrated profile.',
    startJourney: language === 'ko' ? '여정 시작하기' : 'Start Your Journey',
    modulesCompleted: language === 'ko' ? '개 모듈 완료' : ' modules completed',
    profileCompleteness: language === 'ko' ? '% 완성' : '% complete',
    coreValues: language === 'ko' ? '핵심 가치' : 'Core Values',
    keyStrengths: language === 'ko' ? '주요 강점' : 'Key Strengths',
    enneagram: language === 'ko' ? '에니어그램' : 'Enneagram',
    lifeThemes: language === 'ko' ? '생애 주제' : 'Life Themes',
    vision: language === 'ko' ? '비전' : 'Vision',
    mission: language === 'ko' ? '사명' : 'Mission',
    careerGoals: language === 'ko' ? '커리어 목표' : 'Career Goals',
    aiInsights: language === 'ko' ? 'AI 인사이트' : 'AI Insights',
    recommendedActions: language === 'ko' ? '추천 행동' : 'Recommended Actions',
    growthAreas: language === 'ko' ? '성장 영역' : 'Growth Areas',
    terminal: language === 'ko' ? '궁극적' : 'Terminal',
    instrumental: language === 'ko' ? '도구적' : 'Instrumental',
    work: language === 'ko' ? '직업' : 'Work',
    high: language === 'ko' ? '높음' : 'High',
    medium: language === 'ko' ? '보통' : 'Medium',
    low: language === 'ko' ? '낮음' : 'Low',
    selfPreservation: language === 'ko' ? '자기보존' : 'Self-Preservation',
    social: language === 'ko' ? '사회' : 'Social',
    sexual: language === 'ko' ? '성적' : 'Sexual',
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/modules/integrated-profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to fetch integrated profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setLoading(false);
      return;
    }
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, authLoading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/modules/integrated-profile/refresh', { method: 'POST' });
      await fetchProfile();
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      setRefreshing(false);
    }
  };

  const getInstinctLabel = (instinct?: string) => {
    if (!instinct) return '';
    const labels: Record<string, string> = {
      sp: t.selfPreservation,
      so: t.social,
      sx: t.sexual,
    };
    return labels[instinct] || instinct;
  };

  const getValueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      terminal: t.terminal,
      instrumental: t.instrumental,
      work: t.work,
    };
    return labels[type] || type;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: t.high,
      medium: t.medium,
      low: t.low,
    };
    return labels[priority] || priority;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {language === 'ko' ? '로그인이 필요합니다.' : 'Please sign in to view your profile.'}
          </p>
          <Link
            href="/dashboard"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {t.backToDashboard}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">{t.backToDashboard}</span>
            </Link>
            {profile && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {t.refreshAnalysis}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t.pageTitle}</h1>
          <p className="text-gray-600 mt-1">{t.pageDescription}</p>
        </div>

        {!profile || profile.modulesCompleted.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Compass className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t.noProfile}</h2>
            <p className="text-gray-500 mb-6">{t.noProfileHint}</p>
            <Link
              href="/discover/values"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              {t.startJourney}
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Overview Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{t.pageTitle}</h2>
                    <p className="text-sm text-gray-500">
                      {profile.modulesCompleted.length}{t.modulesCompleted} | {profile.profileCompleteness}{t.profileCompleteness}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                  style={{ width: `${profile.profileCompleteness}%` }}
                />
              </div>
            </div>

            {/* Values Section */}
            {profile.topValues && profile.topValues.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <h3 className="text-lg font-bold text-gray-900">{t.coreValues}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.topValues.map((value, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium"
                      title={getValueTypeLabel(value.type)}
                    >
                      {value.name}
                      <span className="ml-1 text-rose-400 text-xs">
                        ({getValueTypeLabel(value.type)})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths Section */}
            {profile.topStrengths && profile.topStrengths.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-gray-900">{t.keyStrengths}</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {profile.topStrengths.map((strength, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl"
                    >
                      <Star className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="font-medium text-gray-900">{strength.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enneagram Section */}
            {profile.enneagramType && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-teal-500" />
                  <h3 className="text-lg font-bold text-gray-900">{t.enneagram}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl font-bold text-teal-600">
                      {profile.enneagramType}
                      {profile.enneagramWing && <span className="text-lg">w{profile.enneagramWing}</span>}
                    </span>
                  </div>
                  {profile.enneagramInstinct && (
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        {language === 'ko' ? '본능 유형' : 'Instinct Type'}
                      </p>
                      <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">
                        {getInstinctLabel(profile.enneagramInstinct)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Life Themes Section */}
            {profile.lifeThemes && profile.lifeThemes.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-gray-900">{t.lifeThemes}</h3>
                </div>
                <div className="space-y-3">
                  {profile.lifeThemes.map((theme, idx) => (
                    <div key={idx} className="p-4 bg-amber-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-gray-800 font-medium">{theme.theme}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vision Section */}
            {profile.visionStatement && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-bold text-gray-900">{t.vision}</h3>
                  {profile.timeHorizon && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">
                      {profile.timeHorizon}
                    </span>
                  )}
                </div>
                <blockquote className="text-lg text-gray-700 italic border-l-4 border-purple-300 pl-4">
                  "{profile.visionStatement}"
                </blockquote>
              </div>
            )}

            {/* Mission Section */}
            {profile.missionStatement && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Compass className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-lg font-bold text-gray-900">{t.mission}</h3>
                </div>
                <blockquote className="text-lg text-gray-700 italic border-l-4 border-indigo-300 pl-4">
                  "{profile.missionStatement}"
                </blockquote>
              </div>
            )}

            {/* Career Goals Section */}
            {profile.careerGoals && profile.careerGoals.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-bold text-gray-900">{t.careerGoals}</h3>
                </div>
                <div className="space-y-3">
                  {profile.careerGoals.map((goal, idx) => (
                    <div key={idx} className="p-4 bg-green-50 rounded-xl">
                      <p className="text-gray-800 font-medium">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights Section */}
            {(profile.aiCareerInsights || (profile.aiRecommendedActions && profile.aiRecommendedActions.length > 0)) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-bold text-gray-900">{t.aiInsights}</h3>
                </div>

                {profile.aiCareerInsights && (
                  <p className="text-gray-600 mb-6">{profile.aiCareerInsights}</p>
                )}

                {profile.aiRecommendedActions && profile.aiRecommendedActions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">{t.recommendedActions}</h4>
                    <div className="space-y-3">
                      {profile.aiRecommendedActions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-primary-50 rounded-xl">
                          <TrendingUp className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-gray-800">{action.action}</p>
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                                action.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : action.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {getPriorityLabel(action.priority)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.aiGrowthAreas && profile.aiGrowthAreas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">{t.growthAreas}</h4>
                    <div className="space-y-3">
                      {profile.aiGrowthAreas.map((area, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                          <p className="font-medium text-gray-800">{area.area}</p>
                          <p className="text-sm text-gray-500 mt-1">{area.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
