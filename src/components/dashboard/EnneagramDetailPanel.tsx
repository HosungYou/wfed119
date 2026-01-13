'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, TrendingUp, Brain, Briefcase, Heart,
  ChevronRight, Loader2, RefreshCw
} from 'lucide-react';
import { EnneagramData, StrengthsData } from '@/lib/types/modules';
import { EnneagramTypeProfile } from '@/lib/enneagram/typeProfiles';

// ============================================================================
// Types
// ============================================================================

interface InterpretationData {
  typeOverview: string;
  wingInfluence: string;
  instinctFocus: string;
  strengthsSynergy?: string;
  growthPath: string;
  careerInsights: string;
}

interface InterpretResponse {
  interpretation: InterpretationData;
  typeProfile: EnneagramTypeProfile;
  generatedAt: string;
  source: 'ai' | 'fallback';
  error?: string;
}

interface EnneagramDetailPanelProps {
  data: EnneagramData;
  strengthsData?: StrengthsData | null;
  probabilities?: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function SectionCard({
  icon: Icon,
  title,
  children,
  iconColor = 'text-primary-600',
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      </div>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}

function TypeProbabilityGrid({
  probabilities,
  primaryType,
}: {
  probabilities: Record<string, number>;
  primaryType: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(probabilities)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([typeNum, prob]) => {
          const isPrimary = Number(typeNum) === primaryType;
          return (
            <div
              key={typeNum}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                isPrimary
                  ? 'bg-teal-100 border border-teal-300'
                  : 'bg-gray-50 border border-gray-100'
              }`}
            >
              <span className={`font-medium ${isPrimary ? 'text-teal-700' : 'text-gray-600'}`}>
                Type {typeNum}
              </span>
              <span className={`font-bold ${isPrimary ? 'text-teal-800' : 'text-gray-700'}`}>
                {(Number(prob) * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EnneagramDetailPanel({
  data,
  strengthsData,
  probabilities,
  isOpen,
  onClose,
}: EnneagramDetailPanelProps) {
  const [interpretation, setInterpretation] = useState<InterpretResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instinctLabels: Record<string, string> = {
    sp: 'Self-Preservation',
    so: 'Social',
    sx: 'Sexual/One-to-One',
  };

  const confidenceColors: Record<string, string> = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-red-100 text-red-700',
  };

  // Fetch AI interpretation
  const fetchInterpretation = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload: {
        enneagram: {
          type: number;
          wing: number;
          instinct: 'sp' | 'so' | 'sx';
          confidence: string;
          probabilities?: Record<string, number>;
        };
        strengths?: {
          skills: string[];
          attitudes: string[];
          values: string[];
        };
        locale: string;
      } = {
        enneagram: {
          type: data.type,
          wing: data.wing,
          instinct: data.instinct,
          confidence: data.confidence,
          probabilities,
        },
        locale: 'en',
      };

      // Include strengths if available
      if (strengthsData?.topStrengths && strengthsData.topStrengths.length > 0) {
        payload.strengths = {
          skills: strengthsData.topStrengths
            .filter(s => s.category === 'skill')
            .map(s => s.name),
          attitudes: strengthsData.topStrengths
            .filter(s => s.category === 'attitude')
            .map(s => s.name),
          values: strengthsData.topStrengths
            .filter(s => s.category === 'value')
            .map(s => s.name),
        };
      }

      const res = await fetch('/api/enneagram/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to load interpretation (${res.status})`);
      }

      const result = await res.json();
      setInterpretation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interpretation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !interpretation && !loading) {
      fetchInterpretation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-600 to-teal-500 text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl font-bold">{data.type}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                Type {data.type}w{data.wing}
                {interpretation?.typeProfile && (
                  <span className="ml-2 text-lg font-normal opacity-90">
                    - {interpretation.typeProfile.name.en}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                  {instinctLabels[data.instinct]}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-sm ${confidenceColors[data.confidence]}`}>
                  {data.confidence.charAt(0).toUpperCase() + data.confidence.slice(1)} Confidence
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Type Probabilities */}
          {probabilities && Object.keys(probabilities).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-600" />
                Type Probabilities
              </h3>
              <TypeProbabilityGrid probabilities={probabilities} primaryType={data.type} />
            </div>
          )}

          {/* AI Interpretation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                AI Interpretation
                {interpretation?.source === 'ai' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                    AI Generated
                  </span>
                )}
                {interpretation?.source === 'fallback' && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    Template
                  </span>
                )}
              </h3>
              {interpretation && (
                <button
                  onClick={fetchInterpretation}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Regenerate interpretation"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {loading && !interpretation ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                <span className="ml-3 text-gray-600">Generating interpretation...</span>
              </div>
            ) : error && !interpretation ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={fetchInterpretation}
                  className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : interpretation ? (
              <div className="space-y-4">
                <SectionCard icon={Heart} title="Type Overview" iconColor="text-rose-500">
                  {interpretation.interpretation.typeOverview}
                </SectionCard>

                <SectionCard icon={ChevronRight} title="Wing Influence" iconColor="text-indigo-500">
                  {interpretation.interpretation.wingInfluence}
                </SectionCard>

                <SectionCard icon={Brain} title="Instinct Focus" iconColor="text-purple-500">
                  {interpretation.interpretation.instinctFocus}
                </SectionCard>

                {interpretation.interpretation.strengthsSynergy && (
                  <SectionCard icon={Sparkles} title="Strengths Synergy" iconColor="text-amber-500">
                    {interpretation.interpretation.strengthsSynergy}
                  </SectionCard>
                )}

                <SectionCard icon={TrendingUp} title="Growth Path" iconColor="text-green-500">
                  {interpretation.interpretation.growthPath}
                </SectionCard>

                <SectionCard icon={Briefcase} title="Career Insights" iconColor="text-blue-500">
                  {interpretation.interpretation.careerInsights}
                </SectionCard>
              </div>
            ) : null}
          </div>

          {/* Type Profile Details */}
          {interpretation?.typeProfile && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                About Type {data.type}: {interpretation.typeProfile.name.en}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-teal-50 rounded-xl p-4">
                  <h4 className="font-medium text-teal-800 mb-2">Core Fear</h4>
                  <p className="text-sm text-teal-700">{interpretation.typeProfile.coreFear.en}</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-4">
                  <h4 className="font-medium text-teal-800 mb-2">Core Desire</h4>
                  <p className="text-sm text-teal-700">{interpretation.typeProfile.coreDesire.en}</p>
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Healthy Traits</h4>
                  <div className="flex flex-wrap gap-1">
                    {interpretation.typeProfile.healthyTraits.en.map((trait, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Growth Direction</h4>
                  <p className="text-sm text-gray-600">
                    Type {interpretation.typeProfile.growthDirection} →{' '}
                    <span className="font-medium">
                      Move toward its positive qualities
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnneagramDetailPanel;
