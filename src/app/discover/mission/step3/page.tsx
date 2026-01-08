'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Heart, Brain, Users, Sparkles, DollarSign, HelpCircle, MessageCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface WellbeingDimension {
  key: string;
  reflection: string;
}

interface AIQuestion {
  question: string;
  questionKo: string;
}

const STEPS = [
  { id: 'step1', label: 'Values Review', labelKo: '가치관 검토' },
  { id: 'step2', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step3', label: 'Self-Role Reflection', labelKo: '자기 역할 성찰' },
  { id: 'step4', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step5', label: 'Mission Statement', labelKo: '사명 선언문' },
];

const WELLBEING_DIMENSIONS = [
  {
    key: 'physical',
    icon: Heart,
    color: 'rose',
    title: 'Physical Well-being',
    titleKo: '신체적 웰빙',
    description: 'Exercise, nutrition, rest, and stress management.',
    descriptionKo: '운동, 영양, 휴식, 스트레스 관리.',
    placeholder: 'e.g., I will exercise 3 times a week to maintain my energy...',
    placeholderKo: '예: 에너지 유지를 위해 주 3회 운동을 할 것입니다...',
    example: 'Engage in regular exercise to enhance my physical well-being and energy.',
    exampleKo: '신체적 웰빙과 에너지를 향상시키기 위해 규칙적인 운동에 참여한다.',
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
    example: 'Dedicate time each week to read books that stimulate my intellectual curiosity.',
    exampleKo: '지적 호기심을 자극하는 책을 읽는 시간을 매주 할애한다.',
  },
  {
    key: 'social_emotional',
    icon: Users,
    color: 'amber',
    title: 'Social/Emotional Well-being',
    titleKo: '사회적/정서적 웰빙',
    description: 'Relationships, emotional intelligence, and empathy.',
    descriptionKo: '관계, 감성 지능, 공감.',
    placeholder: 'e.g., I will invest in relationships and activities that nurture my emotional well-being...',
    placeholderKo: '예: 정서적 웰빙을 키우는 관계와 활동에 투자하겠습니다...',
    example: 'Invest in relationships and activities that nurture my emotional well-being.',
    exampleKo: '정서적 웰빙을 키우는 관계와 활동에 투자한다.',
  },
  {
    key: 'spiritual',
    icon: Sparkles,
    color: 'purple',
    title: 'Spiritual Well-being',
    titleKo: '영적 웰빙',
    description: 'Purpose, meditation, values, and connection to something greater.',
    descriptionKo: '목적, 명상, 가치관, 더 큰 것과의 연결.',
    placeholder: 'e.g., I will explore and practice spiritual activities that resonate with my beliefs and values...',
    placeholderKo: '예: 내 신념과 가치에 부합하는 영적 활동을 탐구하고 실천하겠습니다...',
    example: 'Explore and practice spiritual activities that resonate with my beliefs and values.',
    exampleKo: '내 신념과 가치에 부합하는 영적 활동을 탐구하고 실천한다.',
  },
  {
    key: 'financial',
    icon: DollarSign,
    color: 'green',
    title: 'Financial Well-being',
    titleKo: '재정적 웰빙',
    description: 'Budgeting, saving, financial education, and security.',
    descriptionKo: '예산 관리, 저축, 재정 교육, 안정성.',
    placeholder: 'e.g., I will develop healthy financial habits by creating a realistic budget...',
    placeholderKo: '예: 현실적인 예산을 세워 건강한 재정 습관을 기르겠습니다...',
    example: 'Develop healthy financial habits by creating a realistic budget, building an emergency fund, and educating myself about personal finance.',
    exampleKo: '현실적인 예산 수립, 비상 자금 마련, 개인 재정에 대한 교육을 통해 건강한 재정 습관을 기른다.',
  },
];

export default function MissionStep3() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wellbeing, setWellbeing] = useState<Record<string, string>>({
    physical: '',
    intellectual: '',
    social_emotional: '',
    spiritual: '',
    financial: '',
  });
  const [activeDimension, setActiveDimension] = useState<string | null>('physical');
  const [aiQuestions, setAiQuestions] = useState<Record<string, AIQuestion[]>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/mission/session');
      const data = await res.json();

      if (data.current_step < 3) {
        router.push(`/discover/mission/step${data.current_step}`);
        return;
      }

      // Load existing wellbeing reflections if any
      if (data.wellbeing_reflections) {
        setWellbeing(prev => ({
          ...prev,
          ...data.wellbeing_reflections,
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 3] Error:', error);
      setLoading(false);
    }
  }

  async function loadAIQuestions(dimensionKey: string) {
    setAiLoading(prev => ({ ...prev, [dimensionKey]: true }));
    try {
      const res = await fetch('/api/discover/mission/ai-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'wellbeing_questions',
          dimension: dimensionKey,
        }),
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
      console.error('[Mission Step 3] AI questions error:', error);
    } finally {
      setAiLoading(prev => ({ ...prev, [dimensionKey]: false }));
    }
  }

  function updateWellbeing(key: string, value: string) {
    setWellbeing(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wellbeing_reflections: wellbeing,
        }),
      });
      alert(language === 'ko' ? '저장되었습니다.' : 'Saved!');
    } catch (error) {
      console.error('[Mission Step 3] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    const filledCount = Object.values(wellbeing).filter(v => v.trim()).length;
    if (filledCount < 3) {
      alert(language === 'ko'
        ? '최소 3개의 영역에 대한 성찰을 작성해주세요.'
        : 'Please complete reflections for at least 3 dimensions.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 4,
          wellbeing_reflections: wellbeing,
        }),
      });

      router.push('/discover/mission/step4');
    } catch (error) {
      console.error('[Mission Step 3] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 3, [1, 2]);
  const filledCount = Object.values(wellbeing).filter(v => v.trim()).length;

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      rose: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', icon: 'text-rose-500' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: 'text-blue-500' },
      amber: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', icon: 'text-amber-500' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', icon: 'text-purple-500' },
      green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', icon: 'text-green-500' },
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
      moduleId="mission"
      currentStep={3}
      totalSteps={5}
      title={language === 'ko' ? '자기 역할 성찰' : 'Self-Role Reflection'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Instruction Card */}
        <ModuleCard padding="normal">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '2. 자기 역할 성찰 (Sharpen the Saw)' : '2. Reflecting on Self-Role (Sharpen the Saw)'}
          </h2>
          <p className="text-gray-600 mb-4">
            {language === 'ko'
              ? '다양한 삶의 역할을 고려할 때, 자신과의 관계를 생각하는 것이 중요합니다. Stephen Covey의 "톱날 갈기" 개념을 활용하여 다음 네 가지 차원(+재정)에서 웰빙을 향상시키는 방법을 생각해보세요.'
              : 'While considering different life roles, it\'s crucial to consider the relationship with yourself. Using Stephen Covey\'s "Sharpen the Saw" concept, think about ways to enhance your well-being in these four dimensions (+financial).'}
          </p>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">
                {language === 'ko' ? '출처: ' : 'Source: '}
              </span>
              Covey, S. R. (1991). <em>The seven habits of highly effective people</em>. Simon & Schuster.
            </p>
          </div>
        </ModuleCard>

        {/* Wellbeing Dimensions */}
        <div className="space-y-4">
          {WELLBEING_DIMENSIONS.map((dim) => {
            const Icon = dim.icon;
            const isActive = activeDimension === dim.key;
            const hasContent = wellbeing[dim.key]?.trim().length > 0;
            const colorClasses = getColorClasses(dim.color, isActive);
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
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4 space-y-3">
                    {/* AI Questions Section */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 text-purple-500" />
                        {language === 'ko' ? 'AI 성찰 질문' : 'AI Reflection Questions'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadAIQuestions(dim.key);
                        }}
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

                    <textarea
                      value={wellbeing[dim.key]}
                      onChange={(e) => updateWellbeing(dim.key, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={language === 'ko' ? dim.placeholderKo : dim.placeholder}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    />
                    <div className="flex items-start gap-2 p-3 bg-white/50 rounded-lg">
                      <HelpCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">
                          {language === 'ko' ? '예시: ' : 'Example: '}
                        </span>
                        {language === 'ko' ? dim.exampleKo : dim.example}
                      </div>
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
                const hasContent = wellbeing[dim.key]?.trim().length > 0;
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
            onClick={() => router.push('/discover/mission/step2')}
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
