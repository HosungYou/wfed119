'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface PurposeAnswers {
  whatDoYouDo: string;
  forWhom: string;
  howDoYouDoIt: string;
  whatImpact: string;
  whyDoesItMatter: string;
}

const STEPS = [
  { id: 'step1', label: 'Values Review', labelKo: '가치관 검토' },
  { id: 'step2', label: 'Purpose Questions', labelKo: '목적 질문' },
  { id: 'step3', label: 'Mission Draft', labelKo: '사명 초안' },
  { id: 'step4', label: 'Mission Refinement', labelKo: '사명 완성' },
];

const PURPOSE_QUESTIONS = [
  {
    key: 'whatDoYouDo',
    title: 'What do you do?',
    titleKo: '무엇을 합니까?',
    description: 'Describe the core activity or service you provide.',
    descriptionKo: '당신이 제공하는 핵심 활동이나 서비스를 설명하세요.',
    placeholder: 'e.g., I teach, I build, I create, I help...',
    placeholderKo: '예: 가르치다, 만들다, 창조하다, 돕다...',
    hint: 'Focus on verbs - what ACTION do you take?',
    hintKo: '동사에 집중하세요 - 어떤 행동을 합니까?',
  },
  {
    key: 'forWhom',
    title: 'For whom?',
    titleKo: '누구를 위해?',
    description: 'Who benefits from what you do?',
    descriptionKo: '당신의 활동으로 혜택을 받는 사람은 누구입니까?',
    placeholder: 'e.g., students, entrepreneurs, communities...',
    placeholderKo: '예: 학생들, 기업가들, 지역사회...',
    hint: 'Be specific about your audience or beneficiaries.',
    hintKo: '대상이나 수혜자를 구체적으로 작성하세요.',
  },
  {
    key: 'howDoYouDoIt',
    title: 'How do you do it?',
    titleKo: '어떻게 합니까?',
    description: 'What methods, tools, or approaches do you use?',
    descriptionKo: '어떤 방법, 도구, 접근 방식을 사용합니까?',
    placeholder: 'e.g., through mentorship, using technology, by listening...',
    placeholderKo: '예: 멘토링을 통해, 기술을 활용하여, 경청하며...',
    hint: 'Think about your unique approach or style.',
    hintKo: '당신만의 독특한 접근 방식이나 스타일을 생각해보세요.',
  },
  {
    key: 'whatImpact',
    title: 'What impact do you make?',
    titleKo: '어떤 영향을 미칩니까?',
    description: 'What changes or improvements result from your work?',
    descriptionKo: '당신의 일로 어떤 변화나 개선이 일어납니까?',
    placeholder: 'e.g., increased confidence, better decisions, transformed lives...',
    placeholderKo: '예: 자신감 향상, 더 나은 의사결정, 삶의 변화...',
    hint: 'Focus on outcomes and transformations.',
    hintKo: '결과와 변화에 집중하세요.',
  },
  {
    key: 'whyDoesItMatter',
    title: 'Why does it matter?',
    titleKo: '왜 중요합니까?',
    description: 'What is the deeper significance of your work?',
    descriptionKo: '당신의 일이 갖는 깊은 의미는 무엇입니까?',
    placeholder: 'e.g., because everyone deserves..., to create a world where...',
    placeholderKo: '예: 모든 사람이 ~할 자격이 있기 때문에, ~한 세상을 만들기 위해...',
    hint: 'Connect to your values and vision.',
    hintKo: '가치관과 비전에 연결하세요.',
  },
];

export default function MissionStep2() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<PurposeAnswers>({
    whatDoYouDo: '',
    forWhom: '',
    howDoYouDoIt: '',
    whatImpact: '',
    whyDoesItMatter: '',
  });
  const [activeQuestion, setActiveQuestion] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/mission/session');
      const data = await res.json();

      if (data.current_step < 2) {
        router.push('/discover/mission/step1');
        return;
      }

      if (data.purpose_answers && Object.keys(data.purpose_answers).length > 0) {
        setAnswers(data.purpose_answers);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 2] Error:', error);
      setLoading(false);
    }
  }

  function updateAnswer(key: keyof PurposeAnswers, value: string) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  async function handleNext() {
    // Validate all answers
    const emptyFields = Object.entries(answers).filter(([_, v]) => !v.trim());
    if (emptyFields.length > 0) {
      alert(language === 'ko'
        ? '모든 질문에 답해주세요.'
        : 'Please answer all questions.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          purpose_answers: answers,
        }),
      });

      router.push('/discover/mission/step3');
    } catch (error) {
      console.error('[Mission Step 2] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose_answers: answers,
        }),
      });
      alert(language === 'ko' ? '저장되었습니다.' : 'Saved!');
    } catch (error) {
      console.error('[Mission Step 2] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 2, [1]);
  const answeredCount = Object.values(answers).filter(v => v.trim()).length;

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
      currentStep={2}
      totalSteps={4}
      title={language === 'ko' ? '목적 질문' : 'Purpose Questions'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Instruction */}
        <ModuleCard padding="normal">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '5가지 목적 질문' : 'Five Purpose Questions'}
          </h2>
          <p className="text-gray-600">
            {language === 'ko'
              ? '이 질문들은 당신의 사명을 정의하는 데 도움이 됩니다. 각 질문에 진솔하게 답해주세요.'
              : 'These questions help define your mission. Answer each one thoughtfully.'}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-teal-700">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all"
                style={{ width: `${(answeredCount / 5) * 100}%` }}
              />
            </div>
            <span>{answeredCount}/5</span>
          </div>
        </ModuleCard>

        {/* Questions */}
        <div className="space-y-4">
          {PURPOSE_QUESTIONS.map((q, index) => {
            const key = q.key as keyof PurposeAnswers;
            const isActive = activeQuestion === index;
            const hasAnswer = answers[key].trim().length > 0;

            return (
              <ModuleCard
                key={q.key}
                padding="normal"
                className={`transition-all cursor-pointer ${
                  isActive
                    ? 'ring-2 ring-teal-500 border-teal-300'
                    : hasAnswer
                    ? 'border-green-200 bg-green-50'
                    : ''
                }`}
              >
                <div
                  onClick={() => setActiveQuestion(index)}
                  className="flex items-start gap-3"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    hasAnswer
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {hasAnswer ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {language === 'ko' ? q.titleKo : q.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {language === 'ko' ? q.descriptionKo : q.description}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={answers[key]}
                      onChange={(e) => updateAnswer(key, e.target.value)}
                      placeholder={language === 'ko' ? q.placeholderKo : q.placeholder}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    />
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{language === 'ko' ? q.hintKo : q.hint}</span>
                    </div>
                  </div>
                )}
              </ModuleCard>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <ModuleButton
            onClick={() => router.push('/discover/mission/step1')}
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
              disabled={saving || answeredCount < 5}
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
