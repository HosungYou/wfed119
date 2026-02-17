'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Heart, Brain, Users, Sparkles, DollarSign, HelpCircle, MessageCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface WellbeingEntry {
  reflection: string;
  currentLevel: number; // 1-10
  goals: string;
}

interface AIQuestion {
  question: string;
  questionKo: string;
}

const STEPS = [
  { id: 'step1', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step2', label: 'Wellbeing Reflection', labelKo: '웰빙 성찰' },
  { id: 'step3', label: 'Life Rainbow', labelKo: '인생 무지개' },
  { id: 'step4', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step5', label: 'Reflection', labelKo: '성찰' },
];

const WELLBEING_DIMENSIONS = [
  {
    key: 'physical',
    icon: Heart,
    color: 'emerald',
    title: 'Physical Well-being',
    titleKo: '신체적 웰빙',
    description: 'Exercise, nutrition, rest, and stress management.',
    descriptionKo: '운동, 영양, 휴식, 스트레스 관리.',
    placeholder: 'e.g., I will exercise 3 times a week to maintain my energy...',
    placeholderKo: '예: 에너지 유지를 위해 주 3회 운동을 할 것입니다...',
    goalsPlaceholder: 'e.g., Run a 5K by next year, improve sleep quality...',
    goalsPlaceholderKo: '예: 내년까지 5K 달리기, 수면의 질 개선...',
  },
  {
    key: 'intellectual',
    icon: Brain,
    color: 'blue',
    title: 'Intellectual Well-being',
    titleKo: '지적 웰빙',
    description: 'Learning, reading, critical thinking, and mental stimulation.',
    descriptionKo: '학습, 독서, 비판적 사고, 정신적 자극.',
    placeholder: 'e.g., I will dedicate time each week to read books that stimulate my intellectual curiosity...',
    placeholderKo: '예: 매주 지적 호기심을 자극하는 책을 읽는 시간을 갖겠습니다...',
    goalsPlaceholder: 'e.g., Complete an online course, read 12 books this year...',
    goalsPlaceholderKo: '예: 온라인 강좌 수강 완료, 올해 책 12권 읽기...',
  },
  {
    key: 'social_emotional',
    icon: Users,
    color: 'rose',
    title: 'Social/Emotional Well-being',
    titleKo: '사회적/정서적 웰빙',
    description: 'Relationships, emotional intelligence, and empathy.',
    descriptionKo: '관계, 감성 지능, 공감.',
    placeholder: 'e.g., I will invest in relationships and activities that nurture my emotional well-being...',
    placeholderKo: '예: 정서적 웰빙을 키우는 관계와 활동에 투자하겠습니다...',
    goalsPlaceholder: 'e.g., Weekly family dinners, join a community group...',
    goalsPlaceholderKo: '예: 주간 가족 식사, 커뮤니티 그룹 참여...',
  },
  {
    key: 'spiritual',
    icon: Sparkles,
    color: 'amber',
    title: 'Spiritual Well-being',
    titleKo: '영적 웰빙',
    description: 'Purpose, meditation, values, and connection to something greater.',
    descriptionKo: '목적, 명상, 가치관, 더 큰 것과의 연결.',
    placeholder: 'e.g., I will explore and practice spiritual activities that resonate with my beliefs and values...',
    placeholderKo: '예: 내 신념과 가치에 부합하는 영적 활동을 탐구하고 실천하겠습니다...',
    goalsPlaceholder: 'e.g., Daily 10-minute meditation, volunteer monthly...',
    goalsPlaceholderKo: '예: 매일 10분 명상, 월간 자원봉사...',
  },
  {
    key: 'financial',
    icon: DollarSign,
    color: 'teal',
    title: 'Financial Well-being',
    titleKo: '재정적 웰빙',
    description: 'Budgeting, saving, financial education, and security.',
    descriptionKo: '예산 관리, 저축, 재정 교육, 안정성.',
    placeholder: 'e.g., I will develop healthy financial habits by creating a realistic budget...',
    placeholderKo: '예: 현실적인 예산을 세워 건강한 재정 습관을 기르겠습니다...',
    goalsPlaceholder: 'e.g., Save 3-month emergency fund, reduce debt by 20%...',
    goalsPlaceholderKo: '예: 3개월 비상 자금 저축, 부채 20% 감소...',
  },
];

const DEFAULT_WELLBEING: Record<string, WellbeingEntry> = {
  physical: { reflection: '', currentLevel: 5, goals: '' },
  intellectual: { reflection: '', currentLevel: 5, goals: '' },
  social_emotional: { reflection: '', currentLevel: 5, goals: '' },
  spiritual: { reflection: '', currentLevel: 5, goals: '' },
  financial: { reflection: '', currentLevel: 5, goals: '' },
};

export default function LifeRolesStep2() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wellbeing, setWellbeing] = useState<Record<string, WellbeingEntry>>(DEFAULT_WELLBEING);
  const [activeDimension, setActiveDimension] = useState<string | null>('physical');
  const [aiQuestions, setAiQuestions] = useState<Record<string, AIQuestion[]>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/life-roles/session');
      const data = await res.json();

      if (data.current_step < 2) {
        router.push('/discover/life-roles/step1');
        return;
      }

      // Load existing wellbeing reflections if any
      if (data.wellbeing_reflections) {
        const loaded: Record<string, WellbeingEntry> = { ...DEFAULT_WELLBEING };
        for (const key of Object.keys(data.wellbeing_reflections)) {
          const existing = data.wellbeing_reflections[key];
          // Handle both old format (string) and new format (object)
          if (typeof existing === 'string') {
            loaded[key] = { reflection: existing, currentLevel: 5, goals: '' };
          } else if (existing && typeof existing === 'object') {
            loaded[key] = {
              reflection: existing.reflection ?? '',
              currentLevel: existing.currentLevel ?? 5,
              goals: existing.goals ?? '',
            };
          }
        }
        setWellbeing(loaded);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Life Roles Step 2] Error:', error);
      setLoading(false);
    }
  }

  async function loadAIQuestions(dimensionKey: string) {
    setAiLoading(prev => ({ ...prev, [dimensionKey]: true }));
    try {
      const res = await fetch('/api/discover/life-roles/ai-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dimension: dimensionKey }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions) {
          setAiQuestions(prev => ({
            ...prev,
            [dimensionKey]: data.questions,
          }));
        }
      }
    } catch (error) {
      console.error('[Life Roles Step 2] AI questions error:', error);
    } finally {
      setAiLoading(prev => ({ ...prev, [dimensionKey]: false }));
    }
  }

  function updateWellbeing(key: string, field: keyof WellbeingEntry, value: string | number) {
    setWellbeing(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/discover/life-roles/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wellbeing_reflections: wellbeing }),
      });
      alert(language === 'ko' ? '저장되었습니다.' : 'Saved!');
    } catch (error) {
      console.error('[Life Roles Step 2] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    const filledCount = Object.values(wellbeing).filter(v => v.reflection?.trim().length > 0).length;
    if (filledCount < 3) {
      alert(language === 'ko'
        ? '최소 3개의 영역에 대한 성찰을 작성해주세요.'
        : 'Please complete reflections for at least 3 dimensions.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/life-roles/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          wellbeing_reflections: wellbeing,
        }),
      });
      router.push('/discover/life-roles/step3');
    } catch (error) {
      console.error('[Life Roles Step 2] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/life-roles', 2, [1]);
  const filledCount = Object.values(wellbeing).filter(v => v.reflection?.trim().length > 0).length;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; icon: string; slider: string }> = {
      emerald: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', icon: 'text-emerald-500', slider: 'accent-emerald-600' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: 'text-blue-500', slider: 'accent-blue-600' },
      rose: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', icon: 'text-rose-500', slider: 'accent-rose-600' },
      amber: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', icon: 'text-amber-500', slider: 'accent-amber-600' },
      teal: { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700', icon: 'text-teal-500', slider: 'accent-teal-600' },
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <ModuleShell
      moduleId="life-roles"
      currentStep={2}
      totalSteps={5}
      title={language === 'ko' ? '웰빙 성찰 (톱날 갈기)' : 'Wellbeing Reflection (Sharpen the Saw)'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Instruction Card */}
        <ModuleCard padding="normal">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '웰빙 성찰 (Sharpen the Saw)' : 'Wellbeing Reflection (Sharpen the Saw)'}
          </h2>
          <p className="text-gray-600 mb-4">
            {language === 'ko'
              ? '다양한 삶의 역할을 탐색하는 과정에서 자신을 돌보는 것이 중요합니다. Stephen Covey의 "톱날 갈기" 개념을 바탕으로, 다섯 가지 웰빙 차원에서 현재 상태를 성찰하고 목표를 설정해보세요.'
              : "As you explore your life roles, taking care of yourself is essential. Based on Stephen Covey's \"Sharpen the Saw\" concept, reflect on your current state across five wellbeing dimensions and set goals for each."}
          </p>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">
                {language === 'ko' ? '출처: ' : 'Source: '}
              </span>
              Covey, S. R. (1991). <em>The seven habits of highly effective people</em>. Simon &amp; Schuster.
            </p>
          </div>
        </ModuleCard>

        {/* Wellbeing Dimensions */}
        <div className="space-y-4">
          {WELLBEING_DIMENSIONS.map((dim) => {
            const Icon = dim.icon;
            const isActive = activeDimension === dim.key;
            const entry = wellbeing[dim.key];
            const hasContent = entry?.reflection?.trim().length > 0;
            const colorClasses = getColorClasses(dim.color);
            const dimensionQuestions = aiQuestions[dim.key] || [];
            const isLoadingQuestions = aiLoading[dim.key];

            return (
              <ModuleCard
                key={dim.key}
                padding="normal"
                className={`transition-all cursor-pointer ${
                  isActive
                    ? `ring-2 ring-teal-500 ${colorClasses.bg} ${colorClasses.border}`
                    : hasContent
                    ? 'bg-green-50 border-green-200'
                    : 'hover:border-gray-300'
                }`}
              >
                <div
                  onClick={() => setActiveDimension(isActive ? null : dim.key)}
                  className="flex items-start gap-3"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    hasContent ? 'bg-green-100' : colorClasses.bg
                  }`}>
                    {hasContent ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {language === 'ko' ? dim.titleKo : dim.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {language === 'ko' ? dim.descriptionKo : dim.description}
                    </p>
                    {!isActive && entry?.currentLevel !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full"
                            style={{ width: `${(entry.currentLevel / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{entry.currentLevel}/10</span>
                      </div>
                    )}
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* Current Level Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          {language === 'ko' ? '현재 수준' : 'Current Level'}
                        </label>
                        <span className={`text-sm font-bold ${colorClasses.text}`}>
                          {entry.currentLevel}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={entry.currentLevel}
                        onChange={(e) => updateWellbeing(dim.key, 'currentLevel', Number(e.target.value))}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${colorClasses.slider}`}
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{language === 'ko' ? '낮음 (1)' : 'Low (1)'}</span>
                        <span>{language === 'ko' ? '높음 (10)' : 'High (10)'}</span>
                      </div>
                    </div>

                    {/* AI Questions Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 text-purple-500" />
                          {language === 'ko' ? 'AI 성찰 질문' : 'AI Reflection Questions'}
                        </span>
                        <button
                          onClick={() => loadAIQuestions(dim.key)}
                          disabled={isLoadingQuestions}
                          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 px-2 py-1 rounded-lg hover:bg-purple-50"
                        >
                          {isLoadingQuestions ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          {language === 'ko' ? '질문 생성' : 'Generate'}
                        </button>
                      </div>

                      {dimensionQuestions.length > 0 && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                          {dimensionQuestions.map((q, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-purple-800">
                                {language === 'ko' ? q.questionKo : q.question}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reflection Textarea */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'ko' ? '성찰' : 'Reflection'}
                      </label>
                      <textarea
                        value={entry.reflection}
                        onChange={(e) => updateWellbeing(dim.key, 'reflection', e.target.value)}
                        placeholder={language === 'ko' ? dim.placeholderKo : dim.placeholder}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Goals Textarea */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                        {language === 'ko' ? '목표' : 'Goals'}
                      </label>
                      <textarea
                        value={entry.goals}
                        onChange={(e) => updateWellbeing(dim.key, 'goals', e.target.value)}
                        placeholder={language === 'ko' ? dim.goalsPlaceholderKo : dim.goalsPlaceholder}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                )}
              </ModuleCard>
            );
          })}
        </div>

        {/* Progress Summary */}
        <ModuleCard padding="normal" className={filledCount >= 3 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
          <div className="flex items-center justify-between">
            <p className={filledCount >= 3 ? 'text-green-700' : 'text-gray-600'}>
              {language === 'ko'
                ? `${filledCount}/5 영역 완성 (최소 3개 필요)`
                : `${filledCount}/5 dimensions completed (minimum 3 required)`}
            </p>
            <div className="flex gap-1">
              {WELLBEING_DIMENSIONS.map((dim) => {
                const hasContent = wellbeing[dim.key]?.reflection?.trim().length > 0;
                return (
                  <div
                    key={dim.key}
                    className={`w-3 h-3 rounded-full ${hasContent ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                );
              })}
            </div>
          </div>
        </ModuleCard>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <ModuleButton
            onClick={() => router.push('/discover/life-roles/step1')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <div className="flex gap-3">
            <ModuleButton
              onClick={handleSave}
              variant="ghost"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {language === 'ko' ? '저장' : 'Save'}
            </ModuleButton>
            <ModuleButton
              onClick={handleNext}
              disabled={saving || filledCount < 3}
            >
              {language === 'ko' ? '다음 단계' : 'Next Step'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </ModuleButton>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
