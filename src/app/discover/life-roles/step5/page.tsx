'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle, Sparkles, Share2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

const STEPS = [
  { id: 'step1', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step2', label: 'Wellbeing Reflection', labelKo: '웰빙 성찰' },
  { id: 'step3', label: 'Life Rainbow', labelKo: '인생 무지개' },
  { id: 'step4', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step5', label: 'Reflection', labelKo: '성찰' },
];

const SHARPEN_SAW_ROLES = [
  { key: 'physical', label: 'Physical', labelKo: '신체적' },
  { key: 'intellectual', label: 'Intellectual', labelKo: '지적' },
  { key: 'social_emotional', label: 'Social/Emotional', labelKo: '사회적/정서적' },
  { key: 'spiritual', label: 'Spiritual', labelKo: '영적' },
  { key: 'financial', label: 'Financial', labelKo: '재정적' },
];

const reflectionQuestions = [
  {
    key: 'identityReflection',
    question: 'How do your various life roles reflect your identity?',
    questionKo: '다양한 삶의 역할이 당신의 정체성을 어떻게 반영하나요?',
  },
  {
    key: 'futureChanges',
    question: 'How do you envision your roles and commitments changing in the future?',
    questionKo: '미래에 역할과 헌신이 어떻게 변화할 것으로 예상하나요?',
  },
  {
    key: 'lessonsLearned',
    question: 'What lessons did you learn from this experience?',
    questionKo: '이 경험에서 어떤 교훈을 배웠나요?',
  },
];

export default function LifeRolesStep5() {
  const router = useRouter();
  const { language } = useLanguage();
  const { completeModule } = useModuleProgress('life-roles');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [reflection, setReflection] = useState({
    identityReflection: '',
    futureChanges: '',
    lessonsLearned: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/life-roles/session');
      const data = await res.json();

      if (data.current_step < 5) {
        router.push('/discover/life-roles/step4');
        return;
      }

      setSession(data);

      if (data.reflection) {
        setReflection({
          identityReflection: data.reflection.identityReflection || '',
          futureChanges: data.reflection.futureChanges || '',
          lessonsLearned: data.reflection.lessonsLearned || '',
        });
        if (data.reflection.aiSummary) {
          setAssessment(data.reflection.aiSummary);
        }
      }

      if (data.status === 'completed') {
        setIsCompleted(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('[LifeRoles Step 5] Error:', error);
      setLoading(false);
    }
  }

  async function generateAssessment() {
    setAssessmentLoading(true);
    try {
      const res = await fetch('/api/discover/life-roles/ai-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lifeRoles: session?.life_roles || [],
          wellbeingReflections: session?.wellbeing_reflections || {},
          roleCommitments: session?.role_commitments || [],
          wellbeingCommitments: session?.wellbeing_commitments || {},
          rainbowData: session?.rainbow_data || {},
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.assessment) {
          setAssessment(data.assessment);
        }
      }
    } catch (error) {
      console.error('[LifeRoles Step 5] Assessment error:', error);
    } finally {
      setAssessmentLoading(false);
    }
  }

  async function handleComplete() {
    const allFilled = reflectionQuestions.every(
      q => reflection[q.key as keyof typeof reflection].trim().length > 0
    );

    if (!allFilled) {
      alert(language === 'ko'
        ? '모든 성찰 질문에 답해주세요.'
        : 'Please answer all reflection questions.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/life-roles/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflection: {
            identityReflection: reflection.identityReflection,
            futureChanges: reflection.futureChanges,
            lessonsLearned: reflection.lessonsLearned,
            aiSummary: assessment,
          },
          status: 'completed',
        }),
      });

      await completeModule();
      setIsCompleted(true);
    } catch (error) {
      console.error('[LifeRoles Step 5] Complete error:', error);
      alert(language === 'ko' ? '완료 실패' : 'Completion failed');
    } finally {
      setSaving(false);
    }
  }

  function getBalanceBadgeStyle(status: string) {
    if (status === 'balanced') return 'bg-green-100 text-green-700 border-green-300';
    if (status === 'moderately_imbalanced') return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-red-100 text-red-700 border-red-300';
  }

  function getBalanceLabel(status: string) {
    if (language === 'ko') {
      if (status === 'balanced') return '균형 잡힘';
      if (status === 'moderately_imbalanced') return '다소 불균형';
      return '심각한 불균형';
    }
    if (status === 'balanced') return 'Balanced';
    if (status === 'moderately_imbalanced') return 'Moderately Imbalanced';
    return 'Severely Imbalanced';
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/life-roles', 5, [1, 2, 3, 4]);
  const lifeRoles = session?.life_roles || [];
  const roleCommitments = session?.role_commitments || [];
  const wellbeingCommitments = session?.wellbeing_commitments || {};
  const filledCommitmentCount = roleCommitments.filter((c: any) => c.commitment?.trim()).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  // Completion Screen
  if (isCompleted) {
    return (
      <ModuleShell moduleId="life-roles" showProgress={false}>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'ko' ? '삶의 역할 탐색 완료!' : 'Life Roles Complete!'}
          </h1>

          <p className="text-gray-600 mb-8">
            {language === 'ko'
              ? '축하합니다! 당신의 삶의 역할과 헌신을 성찰하는 여정을 완료했습니다.'
              : 'Congratulations! You have completed your life roles exploration and commitment journey.'}
          </p>

          {/* Roles Summary */}
          {lifeRoles.length > 0 && (
            <ModuleCard padding="normal" className="mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">
                {language === 'ko' ? '나의 삶의 역할' : 'My Life Roles'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {lifeRoles.map((lr: any, i: number) => (
                  <span key={i} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                    {lr.entity}: {lr.role}
                  </span>
                ))}
              </div>
            </ModuleCard>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ModuleButton
              onClick={() => {
                const summary = lifeRoles.map((lr: any) => `${lr.entity}: ${lr.role}`).join('\n');
                navigator.clipboard.writeText(summary);
                alert(language === 'ko' ? '복사됨!' : 'Copied!');
              }}
              variant="secondary"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {language === 'ko' ? '역할 목록 복사' : 'Copy Roles'}
            </ModuleButton>
            <ModuleButton onClick={() => router.push('/dashboard')}>
              {language === 'ko' ? '대시보드로 이동' : 'Go to Dashboard'}
            </ModuleButton>
            <ModuleButton
              onClick={() => router.push('/discover/vision')}
              variant="secondary"
            >
              {language === 'ko' ? '다음 모듈: 비전' : 'Next Module: Vision'}
            </ModuleButton>
          </div>
        </div>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell
      moduleId="life-roles"
      currentStep={5}
      totalSteps={5}
      title={language === 'ko' ? '성찰 & 완료' : 'Reflection & Completion'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <ModuleCard padding="normal" className="bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '여정 요약' : 'Your Journey Summary'}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Roles summary */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {language === 'ko' ? '삶의 역할' : 'Life Roles'}
              </p>
              <div className="flex flex-wrap gap-1">
                {lifeRoles.slice(0, 4).map((lr: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                    {lr.role}
                  </span>
                ))}
                {lifeRoles.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    +{lifeRoles.length - 4}
                  </span>
                )}
              </div>
            </div>

            {/* Wellbeing overview */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {language === 'ko' ? '웰빙 영역' : 'Wellbeing Dimensions'}
              </p>
              <div className="space-y-1">
                {SHARPEN_SAW_ROLES.map((dim) => (
                  <div key={dim.key} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20 flex-shrink-0">
                      {language === 'ko' ? dim.labelKo : dim.label}
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${wellbeingCommitments[dim.key] ? 'bg-purple-400' : 'bg-gray-200'}`}
                        style={{ width: wellbeingCommitments[dim.key] ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* R&C highlight */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {language === 'ko' ? '역할 헌신' : 'Role Commitments'}
              </p>
              <p className="text-2xl font-bold text-teal-600">{filledCommitmentCount}</p>
              <p className="text-xs text-gray-500">
                {language === 'ko'
                  ? `총 ${roleCommitments.length}개 역할 중`
                  : `out of ${roleCommitments.length} roles`}
              </p>
            </div>
          </div>
        </ModuleCard>

        {/* AI Balance Assessment */}
        <ModuleCard padding="normal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {language === 'ko' ? 'AI 균형 평가' : 'AI Balance Assessment'}
            </h3>
            <button
              onClick={generateAssessment}
              disabled={assessmentLoading}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50 border border-purple-200 transition-colors"
            >
              {assessmentLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {language === 'ko' ? 'AI 평가 생성' : 'Generate AI Assessment'}
            </button>
          </div>

          {assessmentLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {language === 'ko' ? 'AI가 균형을 분석하고 있습니다...' : 'AI is analyzing your balance...'}
              </p>
            </div>
          ) : assessment ? (
            <div className="space-y-4">
              {/* Balance status badge */}
              {assessment.balanceAssessment && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {language === 'ko' ? '균형 상태:' : 'Balance Status:'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getBalanceBadgeStyle(assessment.balanceAssessment)}`}>
                    {getBalanceLabel(assessment.balanceAssessment)}
                  </span>
                </div>
              )}

              {/* Strength areas */}
              {assessment.strengthAreas && assessment.strengthAreas.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {language === 'ko' ? '강점 영역' : 'Strength Areas'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assessment.strengthAreas.map((area: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Growth areas */}
              {assessment.growthAreas && assessment.growthAreas.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {language === 'ko' ? '성장 영역' : 'Growth Areas'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assessment.growthAreas.map((area: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested adjustments */}
              {assessment.suggestedAdjustments && assessment.suggestedAdjustments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {language === 'ko' ? '개선 제안' : 'Suggested Adjustments'}
                  </p>
                  <ul className="space-y-1">
                    {assessment.suggestedAdjustments.map((adj: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-teal-500 flex-shrink-0">•</span>
                        {adj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary */}
              {(assessment.summary || assessment.summaryKo) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {language === 'ko' && assessment.summaryKo
                      ? assessment.summaryKo
                      : assessment.summary}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {language === 'ko'
                  ? 'AI 평가를 생성하면 역할 균형을 분석해 드립니다.'
                  : 'Generate an AI assessment to analyze your role balance.'}
              </p>
            </div>
          )}
        </ModuleCard>

        {/* Reflection Textareas */}
        <ModuleCard padding="normal">
          <h3 className="font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '성찰 질문' : 'Reflection Questions'}
          </h3>
          <div className="space-y-6">
            {reflectionQuestions.map((q) => {
              const value = reflection[q.key as keyof typeof reflection];
              const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
              return (
                <div key={q.key}>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    {language === 'ko' ? q.questionKo : q.question}
                  </label>
                  <textarea
                    value={value}
                    onChange={(e) =>
                      setReflection(prev => ({ ...prev, [q.key]: e.target.value }))
                    }
                    rows={4}
                    placeholder={language === 'ko' ? '여기에 성찰을 작성하세요...' : 'Write your reflection here...'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${value.trim().length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {value.trim().length > 0
                        ? (language === 'ko' ? '답변 완성' : 'Answered')
                        : (language === 'ko' ? '답변 필요' : 'Required')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {wordCount} {language === 'ko' ? '단어' : 'words'}
                      {wordCount < 10 && value.trim().length > 0 && (
                        <span className="ml-1 text-amber-500">
                          ({language === 'ko' ? '더 자세히 작성하면 좋아요' : 'Consider elaborating more'})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ModuleCard>

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => router.push('/discover/life-roles/step4')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <ModuleButton
            onClick={handleComplete}
            disabled={saving || reflectionQuestions.some(q => !reflection[q.key as keyof typeof reflection].trim())}
            size="large"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            {language === 'ko' ? '모듈 완료' : 'Complete Module'}
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
