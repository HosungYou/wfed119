'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowRight, ArrowLeft, Sparkles, ExternalLink,
  Star, TrendingUp, DollarSign, User, Brain, CheckCircle
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface Career {
  title: string;
  titleKo?: string;
  description: string;
  descriptionKo?: string;
  hollandFit: string;
  valuesFit: string;
  strengthsFit: string;
  personalityFit?: string;
  resumeFit?: string;
  growthOutlook: string;
  salaryRange: string;
  matchScore: number;
  onetCode?: string;
  onetLink?: string;
  selected?: boolean;
}

const STEPS = [
  { id: 'step1', label: 'Holland Assessment', labelKo: 'Holland 적성 검사' },
  { id: 'step2', label: 'Resume AI Review', labelKo: '이력서 AI 분석' },
  { id: 'step3', label: 'AI Career Suggestions', labelKo: 'AI 경력 추천' },
  { id: 'step4', label: 'Career Comparison', labelKo: '경력 비교' },
];

const HOLLAND_TYPES: Record<string, { name: string; nameKo: string }> = {
  R: { name: 'Realistic', nameKo: '현실형' },
  I: { name: 'Investigative', nameKo: '탐구형' },
  A: { name: 'Artistic', nameKo: '예술형' },
  S: { name: 'Social', nameKo: '사회형' },
  E: { name: 'Enterprising', nameKo: '기업형' },
  C: { name: 'Conventional', nameKo: '관습형' },
};

const ENNEAGRAM_TYPES: Record<number, { name: string; nameKo: string }> = {
  1: { name: 'The Reformer', nameKo: '개혁가' },
  2: { name: 'The Helper', nameKo: '조력자' },
  3: { name: 'The Achiever', nameKo: '성취자' },
  4: { name: 'The Individualist', nameKo: '개인주의자' },
  5: { name: 'The Investigator', nameKo: '탐구자' },
  6: { name: 'The Loyalist', nameKo: '충성가' },
  7: { name: 'The Enthusiast', nameKo: '열정가' },
  8: { name: 'The Challenger', nameKo: '도전자' },
  9: { name: 'The Peacemaker', nameKo: '평화주의자' },
};

export default function CareerOptionsStep3() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [context, setContext] = useState<any>(null);
  const [enneagram, setEnneagram] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load career session
      const sessionRes = await fetch('/api/discover/career-options/session');
      const sessionData = await sessionRes.json();

      if (sessionData.current_step < 3) {
        router.push(`/discover/career-options/step${sessionData.current_step}`);
        return;
      }

      setSession(sessionData);

      // Load existing suggestions if any
      if (sessionData.suggested_careers && sessionData.suggested_careers.length > 0) {
        setCareers(sessionData.suggested_careers);
      }

      // Fetch context (values, strengths, etc.)
      const contextRes = await fetch('/api/discover/mission/context');
      const contextData = await contextRes.json();
      setContext(contextData);

      // Fetch enneagram results
      try {
        const enneagramRes = await fetch('/api/enneagram/session');
        if (enneagramRes.ok) {
          const enneagramData = await enneagramRes.json();
          if (enneagramData.enneagram_type) {
            setEnneagram(enneagramData);
          }
        }
      } catch {
        // Enneagram not completed
      }

      setLoading(false);

      // Auto-generate if no careers yet
      if (!sessionData.suggested_careers || sessionData.suggested_careers.length === 0) {
        generateCareers(sessionData, contextData);
      }
    } catch (error) {
      console.error('[Career Step 3] Error:', error);
      setLoading(false);
    }
  }

  async function generateCareers(sessionData?: any, contextData?: any) {
    setGenerating(true);
    try {
      const s = sessionData || session;
      const c = contextData || context;

      const res = await fetch('/api/discover/career-options/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hollandCode: s.holland_code,
          hollandScores: s.holland_scores,
          resumeAnalysis: s.resume_analysis,
          selectedOnetCareers: s.selected_onet_careers,
          enneagramType: enneagram?.enneagram_type,
          enneagramWing: enneagram?.wing,
          values: c?.values,
          strengths: c?.strengths,
          vision: c?.vision,
          mission: c?.mission,
        }),
      });

      const data = await res.json();

      if (data.suggestions) {
        const careersWithSelection = data.suggestions.map((c: Career) => ({
          ...c,
          selected: false,
        }));
        setCareers(careersWithSelection);

        // Save to session
        await fetch('/api/discover/career-options/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suggested_careers: careersWithSelection }),
        });
      }
    } catch (error) {
      console.error('[Career Step 3] Generate error:', error);
    } finally {
      setGenerating(false);
    }
  }

  function toggleCareerSelection(index: number) {
    setCareers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  }

  async function handleNext() {
    const selected = careers.filter(c => c.selected);
    if (selected.length < 3) {
      alert(language === 'ko'
        ? '최소 3개의 경력을 선택해주세요.'
        : 'Please select at least 3 careers to explore.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/career-options/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 4,
          suggested_careers: careers,
          explored_careers: selected.map(c => ({
            title: c.title,
            titleKo: c.titleKo,
            description: c.description,
            descriptionKo: c.descriptionKo,
            onetCode: c.onetCode,
            onetLink: c.onetLink,
            pros: [],
            cons: [],
            requirements: '',
            notes: '',
            interestLevel: 0,
            userAdded: false,
          })),
        }),
      });

      router.push('/discover/career-options/step4');
    } catch (error) {
      console.error('[Career Step 3] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/career-options', 3, [1, 2]);
  const selectedCount = careers.filter(c => c.selected).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <ModuleShell
      moduleId="career-options"
      currentStep={3}
      totalSteps={4}
      title={language === 'ko' ? 'AI 경력 추천' : 'AI Career Suggestions'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Profile Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Holland Code */}
          {session?.holland_code && (
            <ModuleCard padding="normal" className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="text-xs text-indigo-600 uppercase">Holland Code</p>
                  <p className="text-xl font-bold text-indigo-700">{session.holland_code}</p>
                  <p className="text-xs text-gray-500">
                    {session.holland_code?.split('').map((type: string) => (
                      <span key={type} className="mr-1">
                        {language === 'ko' ? HOLLAND_TYPES[type]?.nameKo : HOLLAND_TYPES[type]?.name}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </ModuleCard>
          )}

          {/* Enneagram Type */}
          {enneagram?.enneagram_type && (
            <ModuleCard padding="normal" className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 uppercase">
                    {language === 'ko' ? '에니어그램' : 'Enneagram'}
                  </p>
                  <p className="text-xl font-bold text-purple-700">
                    Type {enneagram.enneagram_type}
                    {enneagram.wing && `w${enneagram.wing}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {language === 'ko'
                      ? ENNEAGRAM_TYPES[enneagram.enneagram_type]?.nameKo
                      : ENNEAGRAM_TYPES[enneagram.enneagram_type]?.name}
                  </p>
                </div>
              </div>
            </ModuleCard>
          )}

          {/* Resume Analysis */}
          {session?.resume_analysis && (
            <ModuleCard padding="normal" className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 uppercase">
                    {language === 'ko' ? '이력서 분석' : 'Resume Analysis'}
                  </p>
                  <p className="text-xl font-bold text-green-700">
                    {session.resume_analysis.overallFit}% {language === 'ko' ? '적합' : 'Fit'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.resume_analysis.experienceLevel}
                  </p>
                </div>
              </div>
            </ModuleCard>
          )}
        </div>

        {/* Instructions */}
        <ModuleCard padding="normal">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {language === 'ko' ? '종합 경력 추천' : 'Comprehensive Career Recommendations'}
              </h2>
              <p className="text-sm text-gray-600">
                {language === 'ko'
                  ? 'Holland 적성, 이력서 분석, 성격 유형을 종합한 AI 맞춤 추천입니다. 최소 3개를 선택하세요.'
                  : 'AI recommendations based on your Holland code, resume analysis, and personality type. Select at least 3.'}
              </p>
            </div>
            <ModuleButton
              onClick={() => generateCareers()}
              variant="secondary"
              size="small"
              disabled={generating}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {language === 'ko' ? '새로 생성' : 'Regenerate'}
            </ModuleButton>
          </div>
        </ModuleCard>

        {/* Career Cards */}
        {generating ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">
              {language === 'ko'
                ? 'AI가 맞춤 경력을 추천하고 있습니다...'
                : 'AI is generating personalized career recommendations...'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {language === 'ko'
                ? 'Holland 코드, 이력서, 성격 유형을 분석 중...'
                : 'Analyzing Holland code, resume, and personality type...'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {careers.map((career, index) => (
              <ModuleCard
                key={index}
                padding="normal"
                className={`cursor-pointer transition-all ${
                  career.selected
                    ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50'
                    : 'hover:border-gray-300'
                }`}
              >
                <div onClick={() => toggleCareerSelection(index)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {language === 'ko' && career.titleKo ? career.titleKo : career.title}
                        </h3>
                        {career.onetCode && (
                          <span className="text-xs text-gray-400">{career.onetCode}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {language === 'ko' && career.descriptionKo ? career.descriptionKo : career.description}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-3 ${
                      career.selected ? 'bg-indigo-500' : 'border-2 border-gray-300'
                    }`}>
                      {career.selected && <Star className="w-4 h-4 text-white" />}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        career.hollandFit === 'High' ? 'bg-green-100 text-green-700' :
                        career.hollandFit === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        Holland: {career.hollandFit}
                      </span>
                      {career.personalityFit && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          career.personalityFit === 'High' ? 'bg-purple-100 text-purple-700' :
                          career.personalityFit === 'Medium' ? 'bg-purple-50 text-purple-600' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {language === 'ko' ? '성격' : 'Personality'}: {career.personalityFit}
                        </span>
                      )}
                      {career.matchScore && (
                        <span className="text-indigo-600 font-medium">{career.matchScore}% match</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-gray-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {career.growthOutlook}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {career.salaryRange}
                      </span>
                      {career.onetLink && (
                        <a
                          href={career.onetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                        >
                          O*NET <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </ModuleCard>
            ))}
          </div>
        )}

        {/* Selection Summary */}
        <ModuleCard padding="normal" className={selectedCount >= 3 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
          <div className="flex items-center justify-between">
            <p className={selectedCount >= 3 ? 'text-green-800' : 'text-gray-600'}>
              {language === 'ko'
                ? `${selectedCount}개 선택됨 (최소 3개 필요)`
                : `${selectedCount} selected (minimum 3 required)`}
            </p>
            {selectedCount >= 3 && (
              <span className="text-green-600">✓</span>
            )}
          </div>
        </ModuleCard>

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => router.push('/discover/career-options/step2')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <ModuleButton
            onClick={handleNext}
            disabled={saving || selectedCount < 3}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {language === 'ko' ? '경력 비교하기' : 'Compare Careers'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
