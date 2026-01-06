'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart, Target, User, Lightbulb, Eye, Sparkles,
  ChevronRight, TrendingUp, Award, Compass, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { IntegratedProfile, ModuleId } from '@/lib/types/modules';

// ============================================================================
// Types
// ============================================================================

interface IntegratedProfileCardProps {
  showAiInsights?: boolean;
  compact?: boolean;
}

// ============================================================================
// Profile Section Components
// ============================================================================

function ValuesSection({ values }: { values: IntegratedProfile['topValues'] }) {
  if (!values || values.length === 0) return null;

  const typeLabels: Record<string, string> = {
    terminal: '궁극적',
    instrumental: '도구적',
    work: '직업',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-rose-500" />
        <h4 className="text-sm font-medium text-gray-700">핵심 가치</h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.slice(0, 6).map((value, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 text-xs bg-rose-50 text-rose-700 rounded-full"
            title={typeLabels[value.type] || value.type}
          >
            {value.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function StrengthsSection({ strengths }: { strengths: IntegratedProfile['topStrengths'] }) {
  if (!strengths || strengths.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-blue-500" />
        <h4 className="text-sm font-medium text-gray-700">주요 강점</h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {strengths.slice(0, 4).map((strength, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full"
          >
            {strength.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function EnneagramSection({
  type,
  wing,
  instinct,
}: {
  type?: number;
  wing?: number;
  instinct?: string;
}) {
  if (!type) return null;

  const instinctLabels: Record<string, string> = {
    sp: '자기보존',
    so: '사회',
    sx: '성적',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-teal-500" />
        <h4 className="text-sm font-medium text-gray-700">에니어그램</h4>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-teal-600">
          {type}{wing && `w${wing}`}
        </span>
        {instinct && (
          <span className="px-2 py-0.5 text-xs bg-teal-50 text-teal-700 rounded-full">
            {instinctLabels[instinct] || instinct}
          </span>
        )}
      </div>
    </div>
  );
}

function LifeThemesSection({ themes }: { themes: IntegratedProfile['lifeThemes'] }) {
  if (!themes || themes.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h4 className="text-sm font-medium text-gray-700">생애 주제</h4>
      </div>
      <div className="space-y-1">
        {themes.slice(0, 3).map((theme, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-amber-600 font-bold text-xs">#{idx + 1}</span>
            <span className="text-sm text-gray-600">{theme.theme}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisionSection({
  vision,
  timeHorizon,
}: {
  vision?: string;
  timeHorizon?: string;
}) {
  if (!vision) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-purple-500" />
        <h4 className="text-sm font-medium text-gray-700">비전</h4>
        {timeHorizon && (
          <span className="px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-600 rounded">
            {timeHorizon}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 italic line-clamp-2">"{vision}"</p>
    </div>
  );
}

function AiInsightsSection({
  careerInsights,
  recommendedActions,
  growthAreas,
}: {
  careerInsights?: string;
  recommendedActions: IntegratedProfile['aiRecommendedActions'];
  growthAreas: IntegratedProfile['aiGrowthAreas'];
}) {
  if (!careerInsights && (!recommendedActions || recommendedActions.length === 0)) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary-500" />
        <h4 className="text-sm font-medium text-gray-700">AI 인사이트</h4>
      </div>

      {careerInsights && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{careerInsights}</p>
      )}

      {recommendedActions && recommendedActions.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-500">추천 행동</h5>
          {recommendedActions.slice(0, 3).map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2 bg-primary-50 rounded-lg"
            >
              <TrendingUp className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">{action.action}</p>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    action.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : action.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {action.priority === 'high'
                    ? '높음'
                    : action.priority === 'medium'
                    ? '보통'
                    : '낮음'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {growthAreas && growthAreas.length > 0 && (
        <div className="mt-3 space-y-2">
          <h5 className="text-xs font-medium text-gray-500">성장 영역</h5>
          {growthAreas.slice(0, 2).map((area, idx) => (
            <div key={idx} className="p-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">{area.area}</p>
              <p className="text-xs text-gray-500 mt-0.5">{area.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function IntegratedProfileCard({
  showAiInsights = true,
  compact = false,
}: IntegratedProfileCardProps) {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<IntegratedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger AI analysis refresh
    try {
      await fetch('/api/modules/integrated-profile/refresh', { method: 'POST' });
      await fetchProfile();
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
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
    );
  }

  if (!profile || profile.modulesCompleted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">통합 프로필</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Compass className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">프로필이 아직 생성되지 않았습니다.</p>
          <p className="text-sm text-gray-400 mt-1">
            모듈을 완료하면 통합 프로필이 자동으로 생성됩니다.
          </p>
        </div>
      </div>
    );
  }

  // Compact variant
  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">프로필 요약</h3>
          <span className="text-xs text-gray-500">
            {profile.profileCompleteness}% 완성
          </span>
        </div>

        <div className="space-y-3">
          {profile.topValues && profile.topValues.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.topValues.slice(0, 3).map((v, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-[10px] bg-rose-50 text-rose-600 rounded"
                >
                  {v.name}
                </span>
              ))}
            </div>
          )}

          {profile.enneagramType && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-teal-600">
                {profile.enneagramType}
                {profile.enneagramWing && `w${profile.enneagramWing}`}
              </span>
            </div>
          )}

          {profile.visionStatement && (
            <p className="text-xs text-gray-500 italic line-clamp-1">
              "{profile.visionStatement}"
            </p>
          )}
        </div>

        <Link
          href="/dashboard/profile"
          className="mt-3 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
        >
          전체 프로필 보기
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // Full variant
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">나의 통합 프로필</h3>
          <p className="text-sm text-gray-500">
            {profile.modulesCompleted.length}개 모듈 완료 | {profile.profileCompleteness}% 완성
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          title="AI 분석 새로고침"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Profile Completeness Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
            style={{ width: `${profile.profileCompleteness}%` }}
          />
        </div>
      </div>

      {/* Profile Sections */}
      <div className="space-y-4">
        <ValuesSection values={profile.topValues} />
        <StrengthsSection strengths={profile.topStrengths} />
        <EnneagramSection
          type={profile.enneagramType}
          wing={profile.enneagramWing}
          instinct={profile.enneagramInstinct}
        />
        <LifeThemesSection themes={profile.lifeThemes} />
        <VisionSection
          vision={profile.visionStatement}
          timeHorizon={profile.timeHorizon}
        />
      </div>

      {/* AI Insights */}
      {showAiInsights && (
        <AiInsightsSection
          careerInsights={profile.aiCareerInsights}
          recommendedActions={profile.aiRecommendedActions}
          growthAreas={profile.aiGrowthAreas}
        />
      )}

      {/* View Full Profile Link */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <Link
          href="/dashboard/profile"
          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">전체 프로필 보기</h4>
              <p className="text-xs text-gray-500">상세 정보 및 AI 분석 확인</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default IntegratedProfileCard;
