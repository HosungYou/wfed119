'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  Loader2, Download, Home, ArrowRight, ArrowUpRight, ArrowDownRight,
  Shield, Users, Zap, Target, Heart, Brain, Compass, Star, TrendingUp
} from 'lucide-react';

// Type definitions
interface EnneagramResult {
  primaryType: string;
  typeProbabilities: Record<string, number>;
  confidence: string;
  wingEstimate: string | null;
  instinct: string | null;
}

interface InterpretationData {
  typeOverview: string;
  wingInfluence: string;
  instinctFocus: string;
  strengthsSynergy?: string;
  growthPath: string;
  careerInsights: string;
  integratedInsight?: string;
}

interface TypeProfile {
  name: { en: string; ko: string };
  nickname: { en: string; ko: string };
  description?: { en: string; ko: string };
  coreFear: { en: string; ko: string };
  coreDesire: { en: string; ko: string };
  healthyTraits: { en: string[]; ko: string[] };
  unhealthyTraits?: { en: string[]; ko: string[] };
  growthDirection: number;
  stressDirection?: number;
  subtypes?: {
    sp: { en: string; ko: string };
    so: { en: string; ko: string };
    sx: { en: string; ko: string };
  };
}

interface InterpretResponse {
  interpretation: InterpretationData;
  typeProfile: TypeProfile;
  source: 'ai' | 'fallback';
}

type Locale = 'en' | 'kr';

interface Props {
  result: EnneagramResult;
  interpretation: InterpretResponse | null;
  locale: Locale;
  onNavigateToDashboard: () => void;
  loading?: boolean;
}

// Enneagram Center colors (Body: coral, Heart: amber, Head: indigo)
const TYPE_CENTERS: Record<number, { center: string; color: string; gradient: string }> = {
  8: { center: 'Body', color: '#ef4444', gradient: 'from-red-500 to-rose-600' },
  9: { center: 'Body', color: '#f97316', gradient: 'from-orange-500 to-red-500' },
  1: { center: 'Body', color: '#dc2626', gradient: 'from-rose-500 to-red-600' },
  2: { center: 'Heart', color: '#f59e0b', gradient: 'from-amber-400 to-orange-500' },
  3: { center: 'Heart', color: '#eab308', gradient: 'from-yellow-400 to-amber-500' },
  4: { center: 'Heart', color: '#d97706', gradient: 'from-amber-500 to-yellow-600' },
  5: { center: 'Head', color: '#6366f1', gradient: 'from-indigo-500 to-blue-600' },
  6: { center: 'Head', color: '#3b82f6', gradient: 'from-blue-500 to-indigo-600' },
  7: { center: 'Head', color: '#8b5cf6', gradient: 'from-violet-500 to-indigo-500' },
};

const TYPE_NAMES: Record<number, { en: string; ko: string }> = {
  1: { en: 'The Reformer', ko: '개혁가' },
  2: { en: 'The Helper', ko: '조력자' },
  3: { en: 'The Achiever', ko: '성취자' },
  4: { en: 'The Individualist', ko: '예술가' },
  5: { en: 'The Investigator', ko: '탐구자' },
  6: { en: 'The Loyalist', ko: '충성가' },
  7: { en: 'The Enthusiast', ko: '열정가' },
  8: { en: 'The Challenger', ko: '도전자' },
  9: { en: 'The Peacemaker', ko: '평화주의자' },
};

const CENTER_NAMES: Record<string, { en: string; ko: string; icon: React.ElementType }> = {
  Body: { en: 'Body Center', ko: '장 센터', icon: Shield },
  Heart: { en: 'Heart Center', ko: '가슴 센터', icon: Heart },
  Head: { en: 'Head Center', ko: '머리 센터', icon: Brain },
};

const INSTINCT_DISPLAY: Record<string, { en: string; ko: string; icon: React.ElementType }> = {
  sp: { en: 'Self-Preservation', ko: '자기보존', icon: Shield },
  so: { en: 'Social', ko: '사회적', icon: Users },
  sx: { en: 'Intimate', ko: '친밀', icon: Zap },
};

export default function EnneagramResultDisplay({
  result,
  interpretation,
  locale,
  onNavigateToDashboard,
  loading = false,
}: Props) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const primaryType = parseInt(result.primaryType, 10);
  const typeCenter = TYPE_CENTERS[primaryType] || TYPE_CENTERS[5];
  const typeName = TYPE_NAMES[primaryType] || TYPE_NAMES[5];
  const centerInfo = CENTER_NAMES[typeCenter.center];
  const instinctInfo = INSTINCT_DISPLAY[result.instinct || 'sp'];
  const CenterIcon = centerInfo.icon;
  const InstinctIcon = instinctInfo.icon;

  // Parse wing
  const wingNumber = result.wingEstimate
    ? parseInt(result.wingEstimate.split('w')[1], 10)
    : null;

  // Get growth/stress directions
  const growthDirection = interpretation?.typeProfile?.growthDirection;
  const stressDirection = interpretation?.typeProfile?.stressDirection;

  async function downloadAsJPG() {
    if (!resultsRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        logging: false,
        useCORS: true,
      });
      const image = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = image;
      link.download = `enneagram-type-${primaryType}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }

  // Sort probabilities by value
  const sortedProbs = Object.entries(result.typeProbabilities)
    .map(([type, prob]) => ({ type: parseInt(type, 10), prob: Number(prob) }))
    .sort((a, b) => b.prob - a.prob);

  const maxProb = Math.max(...sortedProbs.map(p => p.prob));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
            <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-light text-slate-200 tracking-wide">
            {locale === 'kr' ? 'AI 분석 중...' : 'Analyzing Your Profile...'}
          </h2>
          <p className="text-slate-500 mt-2 font-mono text-sm">
            {locale === 'kr' ? '잠시만 기다려 주세요' : 'Please wait a moment'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={resultsRef}
      className="space-y-8 font-space-grotesk"
    >
      {/* Hero Section - Editorial Style */}
      <div className={`relative overflow-hidden rounded-none md:rounded-3xl bg-gradient-to-br ${typeCenter.gradient} p-8 md:p-12`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* Enneagram Symbol */}
            <circle cx="200" cy="200" r="150" fill="none" stroke="white" strokeWidth="2" />
            <polygon points="200,50 350,300 50,300" fill="none" stroke="white" strokeWidth="1.5" />
            <path d="M200,50 L95,170 L95,330 L305,330 L305,170 Z" fill="none" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Type Number - Massive Typography */}
          <div className="flex items-start gap-6 md:gap-10">
            <div className="flex-shrink-0">
              <span
                className="block text-[120px] md:text-[180px] font-black leading-none text-white/90 font-mono tracking-tighter"
              >
                {primaryType}
              </span>
            </div>

            <div className="pt-4 md:pt-8 flex-1">
              {/* Type Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                <CenterIcon className="w-4 h-4" />
                <span className="text-sm font-medium text-white/90">
                  {centerInfo[locale === 'kr' ? 'ko' : 'en']}
                </span>
              </div>

              {/* Type Name */}
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                {typeName[locale === 'kr' ? 'ko' : 'en']}
              </h1>

              {/* Wing + Instinct Tags */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {wingNumber && (
                  <span className="px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl text-white font-mono text-lg">
                    {primaryType}w{wingNumber}
                  </span>
                )}
                <span className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-xl text-white">
                  <InstinctIcon className="w-4 h-4" />
                  <span className="font-medium">{instinctInfo[locale === 'kr' ? 'ko' : 'en']}</span>
                </span>
                <span className={`px-4 py-2 rounded-xl font-medium ${
                  result.confidence === 'high' ? 'bg-emerald-500/30 text-emerald-100' :
                  result.confidence === 'medium' ? 'bg-amber-500/30 text-amber-100' :
                  'bg-red-500/30 text-red-100'
                }`}>
                  {result.confidence === 'high' && (locale === 'kr' ? '높은 확신도' : 'High Confidence')}
                  {result.confidence === 'medium' && (locale === 'kr' ? '중간 확신도' : 'Medium Confidence')}
                  {result.confidence === 'low' && (locale === 'kr' ? '낮은 확신도' : 'Low Confidence')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Column - Type Probabilities Visualization */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            {locale === 'kr' ? '유형별 분포' : 'Type Distribution'}
          </h3>

          <div className="space-y-3">
            {sortedProbs.map(({ type, prob }) => {
              const isPrimary = type === primaryType;
              const typeColor = TYPE_CENTERS[type];
              const barWidth = (prob / maxProb) * 100;

              return (
                <div key={type} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-lg font-mono font-bold text-sm ${
                          isPrimary ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {type}
                      </span>
                      <span className={`text-sm ${isPrimary ? 'text-white font-medium' : 'text-slate-500'}`}>
                        {TYPE_NAMES[type][locale === 'kr' ? 'ko' : 'en']}
                      </span>
                    </div>
                    <span className={`font-mono text-sm ${isPrimary ? 'text-white' : 'text-slate-500'}`}>
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPrimary ? `bg-gradient-to-r ${typeColor.gradient}` : 'bg-slate-600'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Growth Dynamics */}
        <div className="lg:col-span-3 space-y-6">
          {/* Integration/Disintegration Directions */}
          {(growthDirection || stressDirection) && (
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                {locale === 'kr' ? '통합 & 분열 방향' : 'Growth & Stress Directions'}
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Growth Direction */}
                {growthDirection && (
                  <div className="relative bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 rounded-2xl p-5 border border-emerald-800/50 overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="text-sm text-emerald-400 font-medium mb-2">
                      {locale === 'kr' ? '성장 방향 (통합)' : 'Growth Direction'}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-black text-emerald-300 font-mono">{primaryType}</span>
                      <ArrowRight className="w-5 h-5 text-emerald-500" />
                      <span className="text-4xl font-black text-emerald-100 font-mono">{growthDirection}</span>
                    </div>
                    <p className="mt-3 text-sm text-emerald-200/70">
                      {locale === 'kr'
                        ? `건강한 상태에서 Type ${growthDirection}의 긍정적 특성을 통합합니다`
                        : `In health, integrates positive qualities of Type ${growthDirection}`}
                    </p>
                  </div>
                )}

                {/* Stress Direction */}
                {stressDirection && (
                  <div className="relative bg-gradient-to-br from-rose-900/50 to-rose-950/50 rounded-2xl p-5 border border-rose-800/50 overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <ArrowDownRight className="w-6 h-6 text-rose-400" />
                    </div>
                    <div className="text-sm text-rose-400 font-medium mb-2">
                      {locale === 'kr' ? '스트레스 방향 (분열)' : 'Stress Direction'}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-black text-rose-300 font-mono">{primaryType}</span>
                      <ArrowRight className="w-5 h-5 text-rose-500" />
                      <span className="text-4xl font-black text-rose-100 font-mono">{stressDirection}</span>
                    </div>
                    <p className="mt-3 text-sm text-rose-200/70">
                      {locale === 'kr'
                        ? `스트레스 시 Type ${stressDirection}의 부정적 특성이 나타납니다`
                        : `Under stress, takes on negative traits of Type ${stressDirection}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Core Fear & Desire */}
          {interpretation?.typeProfile && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-rose-400" />
                  </div>
                  <h4 className="font-semibold text-slate-200">
                    {locale === 'kr' ? '핵심 두려움' : 'Core Fear'}
                  </h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {interpretation.typeProfile.coreFear[locale === 'kr' ? 'ko' : 'en']}
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Star className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="font-semibold text-slate-200">
                    {locale === 'kr' ? '핵심 욕구' : 'Core Desire'}
                  </h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {interpretation.typeProfile.coreDesire[locale === 'kr' ? 'ko' : 'en']}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Interpretation Section */}
      {interpretation && (
        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              {locale === 'kr' ? 'AI 통합 분석' : 'AI-Powered Analysis'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              interpretation.source === 'ai'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-700 text-slate-400'
            }`}>
              {interpretation.source === 'ai' ? 'AI Generated' : 'Template'}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Type Overview */}
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                  {locale === 'kr' ? '유형 개요' : 'Type Overview'}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {interpretation.interpretation.typeOverview}
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">
                  {locale === 'kr' ? '날개 영향' : 'Wing Influence'}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {interpretation.interpretation.wingInfluence}
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                  {locale === 'kr' ? '본능 초점' : 'Instinct Focus'}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {interpretation.interpretation.instinctFocus}
                </p>
              </div>
            </div>

            {/* Growth & Career */}
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {locale === 'kr' ? '성장 방향' : 'Growth Path'}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {interpretation.interpretation.growthPath}
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
                  {locale === 'kr' ? '커리어 인사이트' : 'Career Insights'}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {interpretation.interpretation.careerInsights}
                </p>
              </div>

              {interpretation.interpretation.strengthsSynergy && (
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3">
                    {locale === 'kr' ? '강점 시너지' : 'Strengths Synergy'}
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {interpretation.interpretation.strengthsSynergy}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Integrated Insight - Featured */}
          {interpretation.interpretation.integratedInsight && (
            <div className="mt-6 bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-2xl p-6 border border-amber-700/30">
              <h4 className="text-base font-bold text-amber-300 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                {locale === 'kr' ? '통합 분석: 당신만의 고유한 프로필' : 'Integrated Analysis: Your Unique Profile'}
              </h4>
              <p className="text-amber-100/80 leading-relaxed whitespace-pre-wrap">
                {interpretation.interpretation.integratedInsight}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Healthy/Unhealthy Traits */}
      {interpretation?.typeProfile?.healthyTraits && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h4 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {locale === 'kr' ? '건강한 특성' : 'Healthy Traits'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {interpretation.typeProfile.healthyTraits[locale === 'kr' ? 'ko' : 'en'].map((trait, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 text-sm rounded-lg border border-emerald-500/20"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {interpretation.typeProfile.unhealthyTraits && (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h4 className="font-semibold text-rose-400 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                {locale === 'kr' ? '주의할 특성' : 'Watch For'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {interpretation.typeProfile.unhealthyTraits[locale === 'kr' ? 'ko' : 'en'].map((trait, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-rose-500/10 text-rose-300 text-sm rounded-lg border border-rose-500/20"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtype Details */}
      {interpretation?.typeProfile?.subtypes && result.instinct && (
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">
            {locale === 'kr' ? '본능 하위유형 상세' : 'Your Instinctual Subtype'}
          </h3>
          <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/30 rounded-2xl p-5 border border-indigo-700/30">
            <div className="flex items-center gap-3 mb-3">
              <InstinctIcon className="w-6 h-6 text-indigo-400" />
              <span className="text-lg font-bold text-indigo-300">
                {instinctInfo[locale === 'kr' ? 'ko' : 'en']} {primaryType}
              </span>
            </div>
            <p className="text-indigo-100/80 leading-relaxed">
              {interpretation.typeProfile.subtypes[result.instinct as 'sp' | 'so' | 'sx'][locale === 'kr' ? 'ko' : 'en']}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
        <p className="text-slate-400 text-center mb-6">
          {locale === 'kr'
            ? '대시보드에서 모든 모듈 결과를 확인하고 관리할 수 있습니다.'
            : 'View and manage all module results on your dashboard.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={downloadAsJPG}
            disabled={downloading}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {locale === 'kr' ? '다운로드 중...' : 'Downloading...'}
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                {locale === 'kr' ? '이미지로 저장' : 'Save as Image'}
              </>
            )}
          </button>
          <button
            onClick={onNavigateToDashboard}
            className={`w-full sm:w-auto px-8 py-4 bg-gradient-to-r ${typeCenter.gradient} text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2`}
          >
            <Home className="w-5 h-5" />
            {locale === 'kr' ? '대시보드로 이동' : 'Go to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
