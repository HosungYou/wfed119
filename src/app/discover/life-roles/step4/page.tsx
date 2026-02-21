'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle, Sparkles, Share2, ClipboardList, Rainbow, BarChart3, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

const STEPS = [
  { id: 'step1', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step2', label: 'Life Rainbow', labelKo: '인생 무지개' },
  { id: 'step3', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step4', label: 'Reflection', labelKo: '성찰' },
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

export default function LifeRolesStep4() {
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

      if (data.current_step < 4) {
        router.push('/discover/life-roles/step3');
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
      console.error('[LifeRoles Step 4] Error:', error);
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
          roleCommitments: session?.role_commitments || [],
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
      console.error('[LifeRoles Step 4] Assessment error:', error);
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
      console.error('[LifeRoles Step 4] Complete error:', error);
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

  const activities = createActivitiesFromSteps(STEPS, '/discover/life-roles', 4, [1, 2, 3]);
  const lifeRoles = session?.life_roles || [];
  const roleCommitments = session?.role_commitments || [];
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
    const rainbowData = session?.rainbow_data;
    const rainbowSlots = rainbowData?.slots || [];
    const placedSlots = rainbowSlots.filter((s: any) => s.roleId);
    const reflectionData = session?.reflection;
    const aiSummary = reflectionData?.aiSummary;

    const RAINBOW_COLORS = [
      'rgb(239,68,68)',
      'rgb(249,115,22)',
      'rgb(234,179,8)',
      'rgb(34,197,94)',
      'rgb(59,130,246)',
      'rgb(99,102,241)',
      'rgb(139,92,246)',
      'rgb(20,184,166)',
    ];

    return (
      <ModuleShell moduleId="life-roles" showProgress={false}>
        <div className="max-w-2xl mx-auto py-8 space-y-6">

          {/* 1. Header */}
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {language === 'ko' ? '삶의 역할 탐색 완료!' : 'Life Roles Complete!'}
            </h1>
            <p className="text-gray-600">
              {language === 'ko'
                ? '축하합니다! 당신의 삶의 역할과 헌신을 성찰하는 여정을 완료했습니다.'
                : 'Congratulations! You have completed your life roles exploration and commitment journey.'}
            </p>
          </div>

          {/* 2. Journey Summary Stats */}
          <ModuleCard padding="normal">
            <h2 className="font-semibold text-gray-900 mb-4">
              {language === 'ko' ? '여정 요약' : 'Journey Summary'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-teal-50 rounded-lg p-3 text-center border border-teal-100">
                <Users className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-teal-700">{lifeRoles.length}</p>
                <p className="text-xs text-teal-600 mt-0.5">
                  {language === 'ko' ? '삶의 역할' : 'Life Roles'}
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
                <ClipboardList className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-700">{filledCommitmentCount}</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {language === 'ko'
                    ? `헌신 (총 ${roleCommitments.length}개 중)`
                    : `Commitments (of ${roleCommitments.length})`}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-100">
                <Rainbow className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-700">{placedSlots.length}</p>
                <p className="text-xs text-purple-600 mt-0.5">
                  {language === 'ko' ? '무지개 배치' : 'Rainbow Placed'}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700">100%</p>
                <p className="text-xs text-green-600 mt-0.5">
                  {language === 'ko' ? '완료' : 'Complete'}
                </p>
              </div>
            </div>
          </ModuleCard>

          {/* 3. Life Roles List */}
          {lifeRoles.length > 0 && (
            <ModuleCard padding="normal">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-teal-600" />
                <h2 className="font-semibold text-gray-900">
                  {language === 'ko' ? '나의 삶의 역할' : 'My Life Roles'}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {lifeRoles.map((lr: any, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                  >
                    <span className="text-teal-500 font-normal">{lr.entity}: </span>
                    {lr.role}
                  </span>
                ))}
              </div>
            </ModuleCard>
          )}

          {/* 4. Role Commitments Table */}
          {roleCommitments.length > 0 && (
            <ModuleCard padding="normal">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                <h2 className="font-semibold text-gray-900">
                  {language === 'ko' ? '역할과 헌신' : 'Roles & Commitments'}
                </h2>
              </div>
              <div className="space-y-4">
                {roleCommitments.map((rc: any, i: number) => {
                  const current = rc.currentTimePct ?? 0;
                  const desired = rc.desiredTimePct ?? 0;
                  const diff = desired - current;
                  return (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-semibold text-teal-700 mb-2">{rc.roleName}</p>
                      {rc.commitment?.trim() ? (
                        <p className="text-sm text-gray-700 mb-3 italic">"{rc.commitment}"</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic mb-3">
                          {language === 'ko' ? '(헌신 미작성)' : '(No commitment written)'}
                        </p>
                      )}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-16 flex-shrink-0">
                            {language === 'ko' ? '현재' : 'Current'}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gray-400 h-2 rounded-full"
                              style={{ width: `${Math.min(current, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-8 text-right">{current}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-16 flex-shrink-0">
                            {language === 'ko' ? '목표' : 'Desired'}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-teal-500 h-2 rounded-full"
                              style={{ width: `${Math.min(desired, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-teal-600 w-8 text-right">{desired}%</span>
                        </div>
                      </div>
                      {diff !== 0 && (
                        <p className={`text-xs mt-1.5 ${diff > 0 ? 'text-teal-600' : 'text-amber-600'}`}>
                          {diff > 0 ? '▲' : '▼'} {Math.abs(diff)}%{' '}
                          {diff > 0
                            ? (language === 'ko' ? '늘리기 목표' : 'increase goal')
                            : (language === 'ko' ? '줄이기 목표' : 'decrease goal')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ModuleCard>
          )}

          {/* 5. Life Rainbow Visualization */}
          {placedSlots.length > 0 && (
            <ModuleCard padding="normal">
              <div className="flex items-center gap-2 mb-4">
                <Rainbow className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">
                  {language === 'ko' ? '인생 무지개' : 'Life Rainbow'}
                </h2>
                {rainbowData?.currentAge && (
                  <span className="ml-auto text-xs text-gray-500">
                    {language === 'ko' ? '현재 나이' : 'Current Age'}: {rainbowData.currentAge}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {rainbowSlots.map((slot: any, i: number) => {
                  const color = RAINBOW_COLORS[i % RAINBOW_COLORS.length];
                  const isEmpty = !slot.roleId;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isEmpty ? '#e5e7eb' : color }}
                      />
                      {isEmpty ? (
                        <div className="flex-1 h-7 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center px-2">
                          <span className="text-xs text-gray-400">
                            {language === 'ko' ? '(비어있음)' : '(empty)'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium text-gray-800">{slot.roleName}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{slot.ageStart ?? '?'} – {slot.ageEnd ?? '?'}</span>
                              {slot.intensity != null && (
                                <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: color + '33', color }}>
                                  {slot.intensity === 1
                                    ? (language === 'ko' ? '낮음' : 'Low')
                                    : slot.intensity === 2
                                      ? (language === 'ko' ? '중간' : 'Med')
                                      : (language === 'ko' ? '높음' : 'High')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${slot.intensity === 1 ? 33 : slot.intensity === 2 ? 66 : 100}%`,
                                backgroundColor: color,
                                opacity: slot.intensity === 1 ? 0.5 : slot.intensity === 2 ? 0.75 : 1,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {rainbowData?.notes && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-xs font-medium text-purple-700 mb-1">
                    {language === 'ko' ? '노트' : 'Notes'}
                  </p>
                  <p className="text-sm text-gray-700">{rainbowData.notes}</p>
                </div>
              )}
            </ModuleCard>
          )}

          {/* 6. Reflection Answers */}
          {reflectionData && reflectionQuestions.some(q => reflectionData[q.key]?.trim()) && (
            <ModuleCard padding="normal">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <h2 className="font-semibold text-gray-900">
                  {language === 'ko' ? '나의 성찰' : 'My Reflections'}
                </h2>
              </div>
              <div className="space-y-4">
                {reflectionQuestions.map((q) => {
                  const answer = reflectionData[q.key];
                  if (!answer?.trim()) return null;
                  return (
                    <div key={q.key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">
                        {language === 'ko' ? q.questionKo : q.question}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{answer}</p>
                    </div>
                  );
                })}
              </div>
            </ModuleCard>
          )}

          {/* 7. AI Balance Assessment */}
          {aiSummary && (
            <ModuleCard padding="normal">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">
                  {language === 'ko' ? 'AI 균형 평가' : 'AI Balance Assessment'}
                </h2>
                {aiSummary.balanceAssessment && (
                  <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium border ${getBalanceBadgeStyle(aiSummary.balanceAssessment)}`}>
                    {getBalanceLabel(aiSummary.balanceAssessment)}
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {aiSummary.strengthAreas && aiSummary.strengthAreas.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                      {language === 'ko' ? '강점 영역' : 'Strength Areas'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {aiSummary.strengthAreas.map((area: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {aiSummary.growthAreas && aiSummary.growthAreas.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                      {language === 'ko' ? '성장 영역' : 'Growth Areas'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {aiSummary.growthAreas.map((area: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {aiSummary.suggestedAdjustments && aiSummary.suggestedAdjustments.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      {language === 'ko' ? '개선 제안' : 'Suggested Adjustments'}
                    </p>
                    <ul className="space-y-1.5">
                      {aiSummary.suggestedAdjustments.map((adj: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-teal-500 flex-shrink-0 mt-0.5">&#8226;</span>
                          {adj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(aiSummary.summary || aiSummary.summaryKo) && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {language === 'ko' && aiSummary.summaryKo
                        ? aiSummary.summaryKo
                        : aiSummary.summary}
                    </p>
                  </div>
                )}
              </div>
            </ModuleCard>
          )}

          {/* 8. Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <ModuleButton
              onClick={() => {
                const summary = lifeRoles.map((lr: any) => `${lr.entity}: ${lr.role}`).join('\n');
                navigator.clipboard.writeText(summary);
                alert(language === 'ko' ? '복사됨!' : 'Copied!');
              }}
              variant="secondary"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              {language === 'ko' ? '역할 목록 복사' : 'Copy Roles'}
            </ModuleButton>
            <ModuleButton onClick={() => router.push('/dashboard')}>
              {language === 'ko' ? '대시보드로 이동' : 'Go to Dashboard'}
            </ModuleButton>
            <ModuleButton
              onClick={() => router.push('/discover/vision')}
              variant="secondary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
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
      currentStep={4}
      totalSteps={4}
      title={language === 'ko' ? '성찰 & 완료' : 'Reflection & Completion'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <ModuleCard padding="normal" className="bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '여정 요약' : 'Your Journey Summary'}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
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

        {/* Commitments Display Per Role */}
        {roleCommitments.length > 0 && (
          <ModuleCard padding="normal">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-gray-900">
                {language === 'ko' ? '나의 역할별 헌신' : 'My Commitments by Role'}
              </h3>
            </div>
            <div className="space-y-3">
              {roleCommitments.map((rc: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold text-teal-700 mb-1">
                    {rc.roleName}
                  </p>
                  {rc.commitment?.trim() ? (
                    <>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium text-gray-500">
                          {language === 'ko' ? '헌신: ' : 'Commitment: '}
                        </span>
                        {rc.commitment}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">
                          {language === 'ko' ? '시간: ' : 'Time: '}
                        </span>
                        {rc.currentTimePct ?? 0}% → {rc.desiredTimePct ?? 0}%
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      {language === 'ko' ? '(헌신 미작성)' : '(No commitment written)'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ModuleCard>
        )}

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
                        <span className="text-teal-500 flex-shrink-0">&#8226;</span>
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
            onClick={() => router.push('/discover/life-roles/step3')}
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
