'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart, Target, User, Lightbulb, Eye, Sparkles, Grid3X3, CheckCircle2, Zap,
  ChevronRight, TrendingUp, Award, Compass, RefreshCw, Lock, Flag
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { IntegratedProfile, ModuleId, MODULE_ORDER, MODULE_CONFIGS } from '@/lib/types/modules';

/* =============================================================================
 * Terra Editorial Design - Integrated Profile Card
 * Warm earth tones with editorial typography
 * ============================================================================= */

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

function ValuesSection({ values, language }: { values: IntegratedProfile['topValues']; language: string }) {
  if (!values || values.length === 0) return null;

  const typeLabels: Record<string, string> = {
    terminal: language === 'ko' ? '궁극적' : 'Terminal',
    instrumental: language === 'ko' ? '도구적' : 'Instrumental',
    work: language === 'ko' ? '직업' : 'Work',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-primary-500" />
        <h4 className="text-body-sm font-medium text-neutral-700">
          {language === 'ko' ? '핵심 가치' : 'Core Values'}
        </h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.slice(0, 6).map((value, idx) => (
          <span
            key={idx}
            className="px-2.5 py-1 text-caption bg-primary-50 text-primary-700 rounded-lg"
            title={typeLabels[value.type] || value.type}
          >
            {value.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function StrengthsSection({ strengths, language }: { strengths: IntegratedProfile['topStrengths']; language: string }) {
  if (!strengths || strengths.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-secondary-500" />
        <h4 className="text-body-sm font-medium text-neutral-700">
          {language === 'ko' ? '주요 강점' : 'Key Strengths'}
        </h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {strengths.slice(0, 4).map((strength, idx) => (
          <span
            key={idx}
            className="px-2.5 py-1 text-caption bg-secondary-50 text-secondary-700 rounded-lg"
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
  language,
}: {
  type?: number;
  wing?: number;
  instinct?: string;
  language: string;
}) {
  if (!type) return null;

  const instinctLabels: Record<string, string> = {
    sp: language === 'ko' ? '자기보존' : 'Self-Preservation',
    so: language === 'ko' ? '사회' : 'Social',
    sx: language === 'ko' ? '성적' : 'Sexual',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-accent-500" />
        <h4 className="text-body-sm font-medium text-neutral-700">
          {language === 'ko' ? '에니어그램' : 'Enneagram'}
        </h4>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-display text-xl font-bold text-accent-600">
          {type}{wing && `w${wing}`}
        </span>
        {instinct && (
          <span className="px-2 py-0.5 text-caption bg-accent-50 text-accent-700 rounded-lg">
            {instinctLabels[instinct] || instinct}
          </span>
        )}
      </div>
    </div>
  );
}

function LifeThemesSection({ themes, language }: { themes: IntegratedProfile['lifeThemes']; language: string }) {
  if (!themes || themes.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h4 className="text-body-sm font-medium text-neutral-700">
          {language === 'ko' ? '생애 주제' : 'Life Themes'}
        </h4>
      </div>
      <div className="space-y-1.5">
        {themes.slice(0, 3).map((theme, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-amber-600 font-display font-bold text-caption">#{idx + 1}</span>
            <span className="text-body-sm text-neutral-600">{theme.theme}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisionSection({
  vision,
  timeHorizon,
  language,
}: {
  vision?: string;
  timeHorizon?: string;
  language: string;
}) {
  if (!vision) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-purple-500" />
        <h4 className="text-body-sm font-medium text-neutral-700">
          {language === 'ko' ? '비전' : 'Vision'}
        </h4>
        {timeHorizon && (
          <span className="px-2 py-0.5 text-[10px] bg-purple-50 text-purple-600 rounded-lg">
            {timeHorizon}
          </span>
        )}
      </div>
      <p className="text-body-sm text-neutral-600 italic line-clamp-2">"{vision}"</p>
    </div>
  );
}

function AiInsightsSection({
  careerInsights,
  recommendedActions,
  growthAreas,
  language,
}: {
  careerInsights?: string;
  recommendedActions: IntegratedProfile['aiRecommendedActions'];
  growthAreas: IntegratedProfile['aiGrowthAreas'];
  language: string;
}) {
  if (!careerInsights && (!recommendedActions || recommendedActions.length === 0)) {
    return null;
  }

  const getPriorityLabel = (priority: string) => {
    if (language === 'ko') {
      return priority === 'high' ? '높음' : priority === 'medium' ? '보통' : '낮음';
    }
    return priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low';
  };

  return (
    <div className="mt-6 pt-6 border-t border-neutral-100">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary-500" />
        <h4 className="font-display text-sm font-semibold text-neutral-900">
          {language === 'ko' ? 'AI 인사이트' : 'AI Insights'}
        </h4>
      </div>

      {careerInsights && (
        <p className="text-body-sm text-neutral-600 mb-4 line-clamp-3">{careerInsights}</p>
      )}

      {recommendedActions && recommendedActions.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-caption font-medium text-neutral-500">
            {language === 'ko' ? '추천 행동' : 'Recommended Actions'}
          </h5>
          {recommendedActions.slice(0, 3).map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-primary-50 rounded-xl"
            >
              <TrendingUp className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body-sm text-neutral-700">{action.action}</p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-lg mt-1 inline-block ${
                    action.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : action.priority === 'medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {getPriorityLabel(action.priority)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {growthAreas && growthAreas.length > 0 && (
        <div className="mt-4 space-y-2">
          <h5 className="text-caption font-medium text-neutral-500">
            {language === 'ko' ? '성장 영역' : 'Growth Areas'}
          </h5>
          {growthAreas.slice(0, 2).map((area, idx) => (
            <div key={idx} className="p-3 bg-neutral-50 rounded-xl">
              <p className="text-body-sm font-medium text-neutral-700">{area.area}</p>
              <p className="text-caption text-neutral-500 mt-0.5">{area.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Module Icons Map
// ============================================================================

const MODULE_ICONS: Record<ModuleId, React.ElementType> = {
  values: Heart,
  strengths: Target,
  enneagram: User,
  'life-themes': Lightbulb,
  vision: Eye,
  mission: Flag,
  'career-options': Compass,
  swot: Grid3X3,
  goals: CheckCircle2,
  errc: Zap,
};

// Terra Editorial module colors
const MODULE_COLORS: Record<ModuleId, { bg: string; text: string; fill: string }> = {
  values: { bg: 'bg-primary-100', text: 'text-primary-600', fill: '#e26b42' },
  strengths: { bg: 'bg-secondary-100', text: 'text-secondary-600', fill: '#889c5c' },
  enneagram: { bg: 'bg-accent-100', text: 'text-accent-600', fill: '#cbba96' },
  'life-themes': { bg: 'bg-amber-100', text: 'text-amber-600', fill: '#d97706' },
  vision: { bg: 'bg-purple-100', text: 'text-purple-600', fill: '#9333ea' },
  mission: { bg: 'bg-primary-100', text: 'text-primary-700', fill: '#d04f2a' },
  'career-options': { bg: 'bg-secondary-100', text: 'text-secondary-700', fill: '#6a7d44' },
  swot: { bg: 'bg-orange-100', text: 'text-orange-600', fill: '#ea580c' },
  goals: { bg: 'bg-emerald-100', text: 'text-emerald-600', fill: '#059669' },
  errc: { bg: 'bg-teal-100', text: 'text-teal-600', fill: '#0d9488' },
};

// ============================================================================
// Radar Chart Component
// ============================================================================

function ProfileRadarChart({
  completedModules,
  language,
}: {
  completedModules: ModuleId[];
  language: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const radarData = MODULE_ORDER.map((moduleId) => {
    const config = MODULE_CONFIGS[moduleId];
    const isCompleted = completedModules.includes(moduleId);
    return {
      module: language === 'ko' ? config.nameKo : config.name,
      moduleId,
      value: isCompleted ? 100 : 0,
      fullMark: 100,
    };
  });

  // Prevent SSR issues with ResponsiveContainer
  if (!mounted) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-neutral-50 rounded-xl">
        <div className="text-neutral-400 text-body-sm">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 flex items-center justify-center">
      <RadarChart width={400} height={256} cx={200} cy={128} outerRadius={90} data={radarData}>
        <PolarGrid stroke="#e5e5e0" />
        <PolarAngleAxis
          dataKey="module"
          tick={{ fontSize: 10, fill: '#78756e' }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name={language === 'ko' ? '완료도' : 'Completion'}
          dataKey="value"
          stroke="#e26b42"
          fill="#e26b42"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value: number) => [`${value}%`, language === 'ko' ? '완료' : 'Complete']}
          contentStyle={{
            backgroundColor: '#fffef9',
            border: '1px solid #e5e5e0',
            borderRadius: '12px',
            fontSize: '12px',
            fontFamily: 'var(--font-ibm-plex)',
          }}
        />
      </RadarChart>
    </div>
  );
}

// ============================================================================
// Module Grid Component
// ============================================================================

function ModuleGrid({
  completedModules,
  language,
}: {
  completedModules: ModuleId[];
  language: string;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {MODULE_ORDER.map((moduleId) => {
        const config = MODULE_CONFIGS[moduleId];
        const Icon = MODULE_ICONS[moduleId];
        const colors = MODULE_COLORS[moduleId];
        const isCompleted = completedModules.includes(moduleId);

        return (
          <Link
            key={moduleId}
            href={config.route}
            className={`
              relative flex flex-col items-center p-3 rounded-xl transition-all duration-200
              ${isCompleted
                ? `${colors.bg} ${colors.text} hover:shadow-soft`
                : 'bg-neutral-50 text-neutral-300 hover:bg-neutral-100'
              }
            `}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-medium text-center leading-tight">
              {language === 'ko' ? config.nameKo : config.name}
            </span>
            {isCompleted && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-soft">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
            {!isCompleted && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-200 rounded-full flex items-center justify-center">
                <Lock className="w-2.5 h-2.5 text-neutral-400" />
              </div>
            )}
          </Link>
        );
      })}
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
  const { language } = useLanguage();
  const [profile, setProfile] = useState<IntegratedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const t = {
    integratedProfile: language === 'ko' ? '통합 프로필' : 'Integrated Profile',
    profileSummary: language === 'ko' ? '프로필 요약' : 'Profile Summary',
    complete: language === 'ko' ? '% 완성' : '% complete',
    noProfile: language === 'ko' ? '프로필이 아직 생성되지 않았습니다.' : 'Profile not yet created.',
    noProfileHint: language === 'ko'
      ? '모듈을 완료하면 통합 프로필이 자동으로 생성됩니다.'
      : 'Complete modules to automatically generate your integrated profile.',
    myProfile: language === 'ko' ? '나의 통합 프로필' : 'My Integrated Profile',
    modulesCompleted: language === 'ko' ? '개 모듈 완료' : ' modules completed',
    refreshAi: language === 'ko' ? 'AI 분석 새로고침' : 'Refresh AI Analysis',
    viewFullProfile: language === 'ko' ? '전체 프로필 보기' : 'View Full Profile',
    detailsAndAi: language === 'ko' ? '상세 정보 및 AI 분석 확인' : 'View details and AI analysis',
    moduleStatus: language === 'ko' ? '모듈 현황' : 'Module Status',
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
      <div className="card p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-1/2" />
          <div className="h-4 bg-neutral-100 rounded w-3/4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-neutral-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Always show the card with radar chart, even if no modules completed
  const completedModules = profile?.modulesCompleted || [];
  const completionPercent = profile?.profileCompleteness || Math.round((completedModules.length / MODULE_ORDER.length) * 100);

  if (!profile || profile.modulesCompleted.length === 0) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-label text-primary-600 uppercase tracking-wider">Profile</span>
            <h3 className="font-display text-lg font-bold text-neutral-900 mt-1">{t.integratedProfile}</h3>
          </div>
          <span className="font-display text-lg font-bold text-neutral-400">0{t.complete}</span>
        </div>

        {/* Radar Chart - Empty State */}
        <ProfileRadarChart completedModules={[]} language={language} />

        {/* Module Grid */}
        <div className="mt-6">
          <h4 className="text-body-sm font-medium text-neutral-700 mb-4">{t.moduleStatus}</h4>
          <ModuleGrid completedModules={[]} language={language} />
        </div>

        {/* Empty State Message */}
        <div className="mt-8 text-center p-6 bg-neutral-50 rounded-2xl">
          <Compass className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <p className="text-body-sm text-neutral-600">{t.noProfile}</p>
          <p className="text-caption text-neutral-400 mt-1">{t.noProfileHint}</p>
        </div>
      </div>
    );
  }

  // Compact variant
  if (compact) {
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-semibold text-neutral-900">{t.profileSummary}</h3>
          <span className="text-caption text-neutral-500">
            {profile.profileCompleteness}{t.complete}
          </span>
        </div>

        <div className="space-y-3">
          {profile.topValues && profile.topValues.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.topValues.slice(0, 3).map((v, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] bg-primary-50 text-primary-600 rounded-lg"
                >
                  {v.name}
                </span>
              ))}
            </div>
          )}

          {profile.enneagramType && (
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-accent-600">
                {profile.enneagramType}
                {profile.enneagramWing && `w${profile.enneagramWing}`}
              </span>
            </div>
          )}

          {profile.visionStatement && (
            <p className="text-caption text-neutral-500 italic line-clamp-1">
              "{profile.visionStatement}"
            </p>
          )}
        </div>

        <Link
          href="/dashboard/profile"
          className="mt-4 flex items-center gap-1.5 text-caption text-primary-600 hover:text-primary-700 font-medium"
        >
          {t.viewFullProfile}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Full variant
  return (
    <div className="card p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-label text-primary-600 uppercase tracking-wider">Profile</span>
          <h3 className="font-display text-lg font-bold text-neutral-900 mt-1">{t.myProfile}</h3>
          <p className="text-body-sm text-neutral-500 mt-0.5">
            {profile.modulesCompleted.length}{t.modulesCompleted} | {profile.profileCompleteness}{t.complete}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 rounded-xl transition-colors disabled:opacity-50"
          title={t.refreshAi}
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Profile Completeness Bar */}
      <div className="mb-6">
        <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500 ease-out-expo"
            style={{ width: `${profile.profileCompleteness}%` }}
          />
        </div>
      </div>

      {/* Radar Chart */}
      <div className="mb-6">
        <ProfileRadarChart completedModules={profile.modulesCompleted} language={language} />
      </div>

      {/* Module Grid */}
      <div className="mb-8">
        <h4 className="text-body-sm font-medium text-neutral-700 mb-4">{t.moduleStatus}</h4>
        <ModuleGrid completedModules={profile.modulesCompleted} language={language} />
      </div>

      {/* Profile Sections - Collapsed Summary */}
      <div className="space-y-4 p-5 bg-neutral-50 rounded-2xl">
        <h4 className="font-display text-sm font-semibold text-neutral-900 mb-3">
          {language === 'ko' ? '프로필 요약' : 'Profile Summary'}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Values */}
          {profile.topValues && profile.topValues.length > 0 && (
            <div className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-primary-500 mt-0.5" />
              <div>
                <p className="text-caption font-medium text-neutral-600">
                  {language === 'ko' ? '핵심 가치' : 'Core Values'}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.topValues.slice(0, 2).map((v, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-primary-100 text-primary-700 rounded-lg">
                      {v.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Strengths */}
          {profile.topStrengths && profile.topStrengths.length > 0 && (
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-secondary-500 mt-0.5" />
              <div>
                <p className="text-caption font-medium text-neutral-600">
                  {language === 'ko' ? '강점' : 'Strengths'}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.topStrengths.slice(0, 2).map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-lg">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Enneagram */}
          {profile.enneagramType && (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-accent-500 mt-0.5" />
              <div>
                <p className="text-caption font-medium text-neutral-600">
                  {language === 'ko' ? '에니어그램' : 'Enneagram'}
                </p>
                <p className="font-display text-sm font-bold text-accent-600">
                  {profile.enneagramType}{profile.enneagramWing && `w${profile.enneagramWing}`}
                </p>
              </div>
            </div>
          )}

          {/* Vision */}
          {profile.visionStatement && (
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-purple-500 mt-0.5" />
              <div>
                <p className="text-caption font-medium text-neutral-600">
                  {language === 'ko' ? '비전' : 'Vision'}
                </p>
                <p className="text-[10px] text-neutral-500 italic line-clamp-2">
                  "{profile.visionStatement}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      {showAiInsights && (
        <AiInsightsSection
          careerInsights={profile.aiCareerInsights}
          recommendedActions={profile.aiRecommendedActions}
          growthAreas={profile.aiGrowthAreas}
          language={language}
        />
      )}

      {/* View Full Profile Link */}
      <div className="mt-8 pt-6 border-t border-neutral-100">
        <Link
          href="/dashboard/profile"
          className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl hover:bg-neutral-100 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shadow-soft">
              <Award className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold text-neutral-900">{t.viewFullProfile}</h4>
              <p className="text-caption text-neutral-500">{t.detailsAndAi}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default IntegratedProfileCard;
