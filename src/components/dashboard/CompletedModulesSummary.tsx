'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart, Target, User, Lightbulb, Eye, Grid3X3, CheckCircle2, Zap,
  ChevronRight, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ModuleId, MODULE_ORDER, MODULE_CONFIGS, MODULE_PARTS, PART_NAMES,
  ValuesData, StrengthsData, EnneagramData, LifeThemesData,
  VisionData, SwotData, GoalSettingData, ErrcData
} from '@/lib/types/modules';
import { EnneagramDetailPanel } from './EnneagramDetailPanel';

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
  values: Heart,
  strengths: Target,
  enneagram: User,
  'life-themes': Lightbulb,
  vision: Eye,
  swot: Grid3X3,
  goals: CheckCircle2,
  errc: Zap,
};

const MODULE_COLORS: Record<ModuleId, string> = {
  values: 'text-rose-600 bg-rose-50',
  strengths: 'text-blue-600 bg-blue-50',
  enneagram: 'text-teal-600 bg-teal-50',
  'life-themes': 'text-amber-600 bg-amber-50',
  vision: 'text-purple-600 bg-purple-50',
  swot: 'text-orange-600 bg-orange-50',
  goals: 'text-indigo-600 bg-indigo-50',
  errc: 'text-emerald-600 bg-emerald-50',
};

// ============================================================================
// Summary Renderers for Each Module
// ============================================================================

function ValuesSummary({ data }: { data: ValuesData | null }) {
  if (!data) return <p className="text-gray-500 text-sm">No data</p>;

  const allValues = [
    ...(data.terminalTop3 || []).map((v) => ({ type: 'Terminal', value: v })),
    ...(data.instrumentalTop3 || []).map((v) => ({ type: 'Instrumental', value: v })),
    ...(data.workTop3 || []).map((v) => ({ type: 'Work', value: v })),
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
            +{allValues.length - 6} more
          </span>
        )}
      </div>
    </div>
  );
}

function StrengthsSummary({ data }: { data: StrengthsData | null }) {
  if (!data) return <p className="text-gray-500 text-sm">No data</p>;

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
            +{data.topStrengths.length - 4} more
          </span>
        )}
      </div>
    </div>
  );
}

function EnneagramSummary({
  data,
  onViewAI,
}: {
  data: EnneagramData | null;
  onViewAI?: () => void;
}) {
  if (!data) return <p className="text-gray-500 text-sm">No data</p>;

  const instinctLabels: Record<string, string> = {
    sp: 'Self-Preservation',
    so: 'Social',
    sx: 'Sexual/One-to-One',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="text-2xl font-bold text-teal-600">
          {data.type}w{data.wing}
        </div>
        <div className="text-sm text-gray-600">
          {instinctLabels[data.instinct] || data.instinct}
        </div>
      </div>
      {onViewAI && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewAI();
          }}
          className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          View AI Interpretation
        </button>
      )}
    </div>
  );
}

function LifeThemesSummary({ data }: { data: LifeThemesData | null }) {
  if (!data) return <p className="text-gray-500 text-sm">No data</p>;

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

function VisionSummary({ data }: { data: VisionData | null }) {
  if (!data) return <p className="text-gray-500 text-sm">No data</p>;

  return (
    <div className="space-y-2">
      {data.visionStatement && (
        <p className="text-sm text-gray-700 italic line-clamp-2">
          "{data.visionStatement}"
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
          {data.timeHorizon} Vision
        </span>
        {data.dreams && data.dreams.length > 0 && (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
            {data.dreams.length} Dreams
          </span>
        )}
      </div>
    </div>
  );
}

function SwotSummary({ data }: { data: SwotData | null }) {
  if (!data) return <p className="text-gray-500 text-sm">No data</p>;

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="text-gray-600">Strengths {data.strengths?.length || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-gray-600">Weaknesses {data.weaknesses?.length || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-blue-500 rounded-full" />
        <span className="text-gray-600">Opportunities {data.opportunities?.length || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-orange-500 rounded-full" />
        <span className="text-gray-600">Threats {data.threats?.length || 0}</span>
      </div>
    </div>
  );
}

function GoalsSummary({ data }: { data: GoalSettingData | null }) {
  if (!data) return <p className="text-gray-500 text-sm">No data</p>;

  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-indigo-600 font-medium">{data.roles?.length || 0}</span>
        <span className="text-gray-600">Roles</span>
        <span className="text-gray-300">|</span>
        <span className="text-indigo-600 font-medium">{data.objectives?.length || 0}</span>
        <span className="text-gray-600">Objectives</span>
        <span className="text-gray-300">|</span>
        <span className="text-indigo-600 font-medium">{data.keyResults?.length || 0}</span>
        <span className="text-gray-600">KRs</span>
      </div>
    </div>
  );
}

function ErrcSummary({ data }: { data: ErrcData | null }) {
  if (!data) return <p className="text-gray-500 text-sm">No data</p>;

  const categories = [
    { key: 'eliminate', label: 'Eliminate', color: 'bg-red-100 text-red-700' },
    { key: 'reduce', label: 'Reduce', color: 'bg-orange-100 text-orange-700' },
    { key: 'raise', label: 'Raise', color: 'bg-blue-100 text-blue-700' },
    { key: 'create', label: 'Create', color: 'bg-green-100 text-green-700' },
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
  onEnneagramAI,
}: {
  moduleId: ModuleId;
  data: unknown;
  isExpanded: boolean;
  onToggle: () => void;
  onEnneagramAI?: () => void;
}) {
  const config = MODULE_CONFIGS[moduleId];
  const Icon = MODULE_ICONS[moduleId];
  const colorClass = MODULE_COLORS[moduleId];

  const renderSummary = () => {
    switch (moduleId) {
      case 'values':
        return <ValuesSummary data={data as ValuesData} />;
      case 'strengths':
        return <StrengthsSummary data={data as StrengthsData} />;
      case 'enneagram':
        return <EnneagramSummary data={data as EnneagramData} onViewAI={onEnneagramAI} />;
      case 'life-themes':
        return <LifeThemesSummary data={data as LifeThemesData} />;
      case 'vision':
        return <VisionSummary data={data as VisionData} />;
      case 'swot':
        return <SwotSummary data={data as SwotData} />;
      case 'goals':
        return <GoalsSummary data={data as GoalSettingData} />;
      case 'errc':
        return <ErrcSummary data={data as ErrcData} />;
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
          <h4 className="font-medium text-gray-900">{config.name}</h4>
          <p className="text-xs text-gray-500">{config.description}</p>
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
            View Details
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
  const [moduleData, setModuleData] = useState<Record<ModuleId, unknown>>({} as Record<ModuleId, unknown>);
  const [expandedModules, setExpandedModules] = useState<Set<ModuleId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showEnneagramPanel, setShowEnneagramPanel] = useState(false);

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
        <h3 className="text-lg font-bold text-gray-900 mb-4">Completed Modules</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No completed modules yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Start with the first module!
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
        <h3 className="text-lg font-bold text-gray-900">Completed Modules</h3>
        <span className="text-sm text-gray-500">
          {completedModules.length} completed
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
            onEnneagramAI={moduleId === 'enneagram' ? () => setShowEnneagramPanel(true) : undefined}
          />
        ))}
      </div>

      {/* Enneagram Detail Panel */}
      {moduleData.enneagram && (
        <EnneagramDetailPanel
          data={moduleData.enneagram as EnneagramData}
          strengthsData={moduleData.strengths as StrengthsData | null}
          isOpen={showEnneagramPanel}
          onClose={() => setShowEnneagramPanel(false)}
        />
      )}
    </div>
  );
}

export default CompletedModulesSummary;
