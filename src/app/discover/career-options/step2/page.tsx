'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Sparkles, Plus, Star, TrendingUp, DollarSign } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface Career {
  title: string;
  description: string;
  hollandFit: string;
  valuesFit: string;
  strengthsFit: string;
  growthOutlook: string;
  salaryRange: string;
  matchScore: number;
  selected?: boolean;
}

const STEPS = [
  { id: 'step1', label: 'Holland Assessment', labelKo: 'Holland 적성 검사' },
  { id: 'step2', label: 'AI Career Suggestions', labelKo: 'AI 경력 추천' },
  { id: 'step3', label: 'Career Research', labelKo: '경력 조사' },
  { id: 'step4', label: 'Career Comparison', labelKo: '경력 비교' },
];

const HOLLAND_TYPES: Record<string, { name: string; nameKo: string; description: string; descriptionKo: string }> = {
  R: { name: 'Realistic', nameKo: '현실형', description: 'Practical, hands-on', descriptionKo: '실용적, 체험적' },
  I: { name: 'Investigative', nameKo: '탐구형', description: 'Analytical, intellectual', descriptionKo: '분석적, 지적' },
  A: { name: 'Artistic', nameKo: '예술형', description: 'Creative, expressive', descriptionKo: '창의적, 표현적' },
  S: { name: 'Social', nameKo: '사회형', description: 'Helping, nurturing', descriptionKo: '도움, 양육' },
  E: { name: 'Enterprising', nameKo: '기업형', description: 'Leading, persuading', descriptionKo: '리더십, 설득' },
  C: { name: 'Conventional', nameKo: '관습형', description: 'Organized, detail-oriented', descriptionKo: '체계적, 세부지향' },
};

export default function CareerOptionsStep2() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const sessionRes = await fetch('/api/discover/career-options/session');
      const sessionData = await sessionRes.json();

      if (sessionData.current_step < 2) {
        router.push('/discover/career-options/step1');
        return;
      }

      setSession(sessionData);

      if (sessionData.suggested_careers && sessionData.suggested_careers.length > 0) {
        setCareers(sessionData.suggested_careers);
      }

      // Fetch context for AI
      const contextRes = await fetch('/api/discover/mission/context');
      const contextData = await contextRes.json();
      setContext(contextData);

      setLoading(false);

      // Auto-generate if no careers
      if (!sessionData.suggested_careers || sessionData.suggested_careers.length === 0) {
        generateCareers(sessionData, contextData);
      }
    } catch (error) {
      console.error('[Career Step 2] Error:', error);
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
      console.error('[Career Step 2] Generate error:', error);
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
          current_step: 3,
          suggested_careers: careers,
          explored_careers: selected.map(c => ({
            title: c.title,
            description: c.description,
            pros: [],
            cons: [],
            requirements: '',
            notes: '',
            interestLevel: 0,
            userAdded: false,
          })),
        }),
      });

      router.push('/discover/career-options/step3');
    } catch (error) {
      console.error('[Career Step 2] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/career-options', 2, [1]);
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
      currentStep={2}
      totalSteps={4}
      title={language === 'ko' ? 'AI 경력 추천' : 'AI Career Suggestions'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Holland Code Result */}
        <ModuleCard padding="normal" className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 mb-1">
                {language === 'ko' ? '당신의 Holland 코드' : 'Your Holland Code'}
              </p>
              <p className="text-3xl font-bold text-indigo-700">{session?.holland_code}</p>
            </div>
            <div className="text-right text-sm">
              {session?.holland_code?.split('').map((type: string, i: number) => (
                <div key={type} className="text-gray-600">
                  <span className="font-semibold">{type}</span>: {language === 'ko'
                    ? HOLLAND_TYPES[type]?.nameKo
                    : HOLLAND_TYPES[type]?.name}
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>

        {/* Instructions */}
        <ModuleCard padding="normal">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {language === 'ko' ? '추천 경력 목록' : 'Recommended Careers'}
              </h2>
              <p className="text-sm text-gray-600">
                {language === 'ko'
                  ? '탐색할 경력을 최소 3개 선택하세요.'
                  : 'Select at least 3 careers to explore further.'}
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
              {language === 'ko' ? 'AI가 맞춤 경력을 추천하고 있습니다...' : 'AI is generating personalized career recommendations...'}
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
                      <h3 className="font-semibold text-gray-900">{career.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{career.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-3 ${
                      career.selected ? 'bg-indigo-500' : 'border-2 border-gray-300'
                    }`}>
                      {career.selected && <Star className="w-4 h-4 text-white" />}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        career.hollandFit === 'High' ? 'bg-green-100 text-green-700' :
                        career.hollandFit === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        Holland: {career.hollandFit}
                      </span>
                      {career.matchScore && (
                        <span className="text-gray-500">{career.matchScore}% match</span>
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
            onClick={() => router.push('/discover/career-options/step1')}
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
            {language === 'ko' ? '경력 조사하기' : 'Research Careers'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
