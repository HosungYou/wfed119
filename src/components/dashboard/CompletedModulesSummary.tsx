'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart, Target, User, Lightbulb, Eye, Grid3X3, CheckCircle2, Zap,
  Flag, Briefcase, ChevronRight, ChevronDown, ChevronUp, Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import {
  ModuleId, MODULE_ORDER, MODULE_CONFIGS, MODULE_PARTS, PART_NAMES,
  ValuesData, StrengthsData, EnneagramData, LifeThemesData,
  VisionData, SwotData, GoalSettingData, ErrcData,
  MissionData, CareerOptionsData, LifeRolesData
} from '@/lib/types/modules';

// ============================================================================
// Types
// ============================================================================

interface ModuleSummaryData {
  moduleId: ModuleId;
  completedAt?: string;
  summary: React.ReactNode;
}

interface CompletedModulesSummaryProps {
  completedModules: ModuleId[];
}

// ============================================================================
// Module Icons
// ============================================================================

const MODULE_ICONS: Record<ModuleId, React.ElementType> = {
  enneagram: User,
  'life-themes': Lightbulb,
  values: Heart,
  mission: Flag,
  'life-roles': Users,
  vision: Eye,
  swot: Grid3X3,
  'career-options': Briefcase,
  goals: CheckCircle2,
  errc: Zap,
  strengths: Target, // DEPRECATED
};

const MODULE_COLORS: Record<ModuleId, string> = {
  enneagram: 'text-teal-600 bg-teal-50',
  'life-themes': 'text-amber-600 bg-amber-50',
  values: 'text-rose-600 bg-rose-50',
  mission: 'text-fuchsia-600 bg-fuchsia-50',
  'life-roles': 'text-violet-600 bg-violet-50',
  vision: 'text-purple-600 bg-purple-50',
  swot: 'text-orange-600 bg-orange-50',
  'career-options': 'text-sky-600 bg-sky-50',
  goals: 'text-indigo-600 bg-indigo-50',
  errc: 'text-emerald-600 bg-emerald-50',
  strengths: 'text-blue-600 bg-blue-50', // DEPRECATED
};

// ============================================================================
// Summary Renderers for Each Module
// ============================================================================

function ValuesSummary({ data, language }: { data: ValuesData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  const allValues = [
    ...(data.terminalTop3 || []).map((v) => ({ type: language === 'ko' ? '궁극적' : 'Terminal', value: v })),
    ...(data.instrumentalTop3 || []).map((v) => ({ type: language === 'ko' ? '도구적' : 'Instrumental', value: v })),
    ...(data.workTop3 || []).map((v) => ({ type: language === 'ko' ? '직업' : 'Work', value: v })),
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {allValues.slice(0, 6).map((item, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 text-xs bg-rose-100 text-rose-700 rounded-full"
          >
            {item.value}
          </span>
        ))}
        {allValues.length > 6 && (
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
            +{allValues.length - 6} {language === 'ko' ? '더보기' : 'more'}
          </span>
        )}
      </div>
    </div>
  );
}

function StrengthsSummary({ data, language }: { data: StrengthsData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {data.topStrengths?.slice(0, 4).map((strength, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full"
          >
            {strength.name}
          </span>
        ))}
        {data.topStrengths && data.topStrengths.length > 4 && (
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
            +{data.topStrengths.length - 4} {language === 'ko' ? '더보기' : 'more'}
          </span>
        )}
      </div>
    </div>
  );
}

function EnneagramSummary({ data, language }: { data: EnneagramData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  const instinctLabels: Record<string, Record<string, string>> = {
    sp: { ko: '자기보존형', en: 'Self-Preservation' },
    so: { ko: '사회형', en: 'Social' },
    sx: { ko: '성적/일대일형', en: 'Sexual/One-to-One' },
  };

  const getInstinctLabel = (instinct: string) => {
    const labels = instinctLabels[instinct];
    return labels ? labels[language === 'ko' ? 'ko' : 'en'] : instinct;
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-2xl font-bold text-teal-600">
        {data.type}w{data.wing}
      </div>
      <div className="text-sm text-gray-600">
        {getInstinctLabel(data.instinct)}
      </div>
    </div>
  );
}

function LifeThemesSummary({ data, language }: { data: LifeThemesData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  return (
    <div className="space-y-1">
      {data.themes?.slice(0, 3).map((theme, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <span className="text-amber-600 font-bold text-sm">#{idx + 1}</span>
          <span className="text-sm text-gray-700">{theme.theme}</span>
        </div>
      ))}
    </div>
  );
}

function VisionSummary({ data, language }: { data: VisionData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  return (
    <div className="space-y-2">
      {data.visionStatement && (
        <p className="text-sm text-gray-700 italic line-clamp-2">
          &ldquo;{data.visionStatement}&rdquo;
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
          {data.timeHorizon} {language === 'ko' ? '비전' : 'Vision'}
        </span>
        {data.dreams && data.dreams.length > 0 && (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
            {data.dreams.length} {language === 'ko' ? '개의 꿈' : 'dreams'}
          </span>
        )}
      </div>
    </div>
  );
}

function MissionSummary({ data, language }: { data: MissionData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  const missionText = data.finalStatement || data.draftVersions?.at(-1)?.text;

  return (
    <div className="space-y-2">
      {missionText ? (
        <p className="text-sm text-gray-700 line-clamp-3">
          {missionText}
        </p>
      ) : (
        <p className="text-gray-500 text-sm">{language === 'ko' ? '미션 선언문이 없습니다.' : 'No mission statement.'}</p>
      )}
    </div>
  );
}

function CareerOptionsSummary({ data, language }: { data: CareerOptionsData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  const topChoices = data.topCareerChoices || [];
  const suggested = data.suggestedCareers || [];
  const displayItems = topChoices.length > 0
    ? topChoices.map((item) => item.career)
    : suggested.slice(0, 3).map((item) => item.title);

  return (
    <div className="space-y-2">
      {displayItems.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {displayItems.slice(0, 4).map((item, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs bg-sky-100 text-sky-700 rounded-full"
            >
              {item}
            </span>
          ))}
          {displayItems.length > 4 && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{displayItems.length - 4} {language === 'ko' ? '더보기' : 'more'}
            </span>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">{language === 'ko' ? '추천 직업이 없습니다.' : 'No recommended careers.'}</p>
      )}
    </div>
  );
}

function LifeRolesSummary({ data, language }: { data: LifeRolesData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  return (
    <div className="space-y-2">
      {data.roles && data.roles.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {data.roles.slice(0, 4).map((role, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full"
            >
              {role.role || role.entity}
            </span>
          ))}
          {data.roles.length > 4 && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{data.roles.length - 4} {language === 'ko' ? '더보기' : 'more'}
            </span>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">{language === 'ko' ? '역할이 정의되지 않았습니다.' : 'No roles defined.'}</p>
      )}
      {data.commitments && data.commitments.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {data.commitments.length} {language === 'ko' ? '개 헌신 설정됨' : 'commitments set'}
        </p>
      )}
    </div>
  );
}

function SwotSummary({ data, language }: { data: SwotData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  const labels = {
    strengths: language === 'ko' ? '강점' : 'Strengths',
    weaknesses: language === 'ko' ? '약점' : 'Weaknesses',
    opportunities: language === 'ko' ? '기회' : 'Opportunities',
    threats: language === 'ko' ? '위협' : 'Threats',
  };

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="text-gray-600">{labels.strengths} {data.strengths?.length || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-gray-600">{labels.weaknesses} {data.weaknesses?.length || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-blue-500 rounded-full" />
        <span className="text-gray-600">{labels.opportunities} {data.opportunities?.length || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-orange-500 rounded-full" />
        <span className="text-gray-600">{labels.threats} {data.threats?.length || 0}</span>
      </div>
    </div>
  );
}

function GoalsSummary({ data, language }: { data: GoalSettingData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-indigo-600 font-medium">{data.roles?.length || 0}</span>
        <span className="text-gray-600">{language === 'ko' ? '역할' : 'Roles'}</span>
        <span className="text-gray-300">|</span>
        <span className="text-indigo-600 font-medium">{data.objectives?.length || 0}</span>
        <span className="text-gray-600">{language === 'ko' ? '목표' : 'Objectives'}</span>
        <span className="text-gray-300">|</span>
        <span className="text-indigo-600 font-medium">{data.keyResults?.length || 0}</span>
        <span className="text-gray-600">KR</span>
      </div>
    </div>
  );
}

function ErrcSummary({ data, language }: { data: ErrcData | null; language: string }) {
  if (!data) return <p className="text-gray-500 text-sm">{language === 'ko' ? '데이터 없음' : 'No data'}</p>;

  const categories = [
    { key: 'eliminate', label: language === 'ko' ? '제거' : 'Eliminate', color: 'bg-red-100 text-red-700' },
    { key: 'reduce', label: language === 'ko' ? '감소' : 'Reduce', color: 'bg-orange-100 text-orange-700' },
    { key: 'raise', label: language === 'ko' ? '증가' : 'Raise', color: 'bg-blue-100 text-blue-700' },
    { key: 'create', label: language === 'ko' ? '창조' : 'Create', color: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((cat) => {
        const count = data.canvas?.[cat.key as keyof typeof data.canvas]?.length || 0;
        return (
          <span key={cat.key} className={`px-2 py-0.5 text-xs rounded-full ${cat.color}`}>
            {cat.label} {count}
          </span>
        );
      })}
    </div>
  );
}

// ============================================================================
// Module Summary Card
// ============================================================================

function ModuleSummaryCard({
  moduleId,
  data,
  isExpanded,
  onToggle,
  language,
}: {
  moduleId: ModuleId;
  data: unknown;
  isExpanded: boolean;
  onToggle: () => void;
  language: string;
}) {
  const config = MODULE_CONFIGS[moduleId];
  const Icon = MODULE_ICONS[moduleId];
  const colorClass = MODULE_COLORS[moduleId];

  const renderSummary = () => {
    switch (moduleId) {
      case 'values':
        return <ValuesSummary data={data as ValuesData} language={language} />;
      case 'strengths':
        return <StrengthsSummary data={data as StrengthsData} language={language} />;
      case 'enneagram':
        return <EnneagramSummary data={data as EnneagramData} language={language} />;
      case 'life-themes':
        return <LifeThemesSummary data={data as LifeThemesData} language={language} />;
      case 'vision':
        return <VisionSummary data={data as VisionData} language={language} />;
      case 'mission':
        return <MissionSummary data={data as MissionData} language={language} />;
      case 'life-roles':
        return <LifeRolesSummary data={data as LifeRolesData} language={language} />;
      case 'career-options':
        return <CareerOptionsSummary data={data as CareerOptionsData} language={language} />;
      case 'swot':
        return <SwotSummary data={data as SwotData} language={language} />;
      case 'goals':
        return <GoalsSummary data={data as GoalSettingData} language={language} />;
      case 'errc':
        return <ErrcSummary data={data as ErrcData} language={language} />;
      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <h4 className="font-medium text-gray-900">{language === 'ko' ? config.nameKo : config.name}</h4>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-3">
            {renderSummary()}
          </div>
          <Link
            href={config.route}
            className="mt-3 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            {language === 'ko' ? '자세히 보기' : 'View Details'}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CompletedModulesSummary({ completedModules }: CompletedModulesSummaryProps) {
  const { isAuthenticated } = useAuth();
  const { language } = useTranslation();
  const [moduleData, setModuleData] = useState<Record<ModuleId, unknown>>({} as Record<ModuleId, unknown>);
  const [expandedModules, setExpandedModules] = useState<Set<ModuleId>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || completedModules.length === 0) {
      setLoading(false);
      return;
    }

    const fetchModuleData = async () => {
      try {
        const res = await fetch('/api/modules/context?format=json');
        if (res.ok) {
          const data = await res.json();
          setModuleData(data.availableData || {});
        }
      } catch (err) {
        console.error('Failed to fetch module data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [isAuthenticated, completedModules]);

  const toggleModule = (moduleId: ModuleId) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (completedModules.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {language === 'ko' ? '완료된 모듈' : 'Completed Modules'}
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">
            {language === 'ko' ? '아직 완료된 모듈이 없습니다.' : 'No completed modules yet.'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {language === 'ko' ? '첫 번째 모듈부터 시작해보세요!' : 'Start with the first module!'}
          </p>
        </div>
      </div>
    );
  }

  // Sort completed modules by order
  const sortedModules = completedModules.sort((a, b) => {
    return MODULE_ORDER.indexOf(a) - MODULE_ORDER.indexOf(b);
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {language === 'ko' ? '완료된 모듈' : 'Completed Modules'}
        </h3>
        <span className="text-sm text-gray-500">
          {completedModules.length} {language === 'ko' ? '개 완료' : 'completed'}
        </span>
      </div>

      <div className="space-y-3">
        {sortedModules.map((moduleId) => (
          <ModuleSummaryCard
            key={moduleId}
            moduleId={moduleId}
            data={moduleData[moduleId]}
            isExpanded={expandedModules.has(moduleId)}
            onToggle={() => toggleModule(moduleId)}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}

export default CompletedModulesSummary;
