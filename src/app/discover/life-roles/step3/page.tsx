'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, ClipboardList, HelpCircle, Users, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface RoleCommitment {
  roleId: string;
  roleName: string;
  commitment: string;
  currentTimePct: number;
  desiredTimePct: number;
}

interface LifeRole {
  id: string;
  entity: string;
  role: string;
}

const STEPS = [
  { id: 'step1', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step2', label: 'Life Rainbow', labelKo: '인생 무지개' },
  { id: 'step3', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step4', label: 'Reflection', labelKo: '성찰' },
];

export default function LifeRolesStep3() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lifeRoles, setLifeRoles] = useState<LifeRole[]>([]);
  const [roleCommitments, setRoleCommitments] = useState<RoleCommitment[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    roleCommitments?: Record<string, string>;
  }>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/life-roles/session');
      const data = await res.json();

      if (data.current_step < 3) {
        router.push('/discover/life-roles/step2');
        return;
      }

      // Load life roles from session
      if (data.life_roles && data.life_roles.length > 0) {
        setLifeRoles(data.life_roles);

        // Initialize role commitments from existing data or from life_roles
        const existingCommitments: RoleCommitment[] = data.role_commitments || [];
        const commitments = data.life_roles.map((lr: LifeRole) => {
          const existing = existingCommitments.find((c) => c.roleId === lr.id);
          return {
            roleId: lr.id,
            roleName: `${lr.entity}: ${lr.role}`,
            commitment: existing?.commitment || '',
            currentTimePct: existing?.currentTimePct ?? 20,
            desiredTimePct: existing?.desiredTimePct ?? 20,
          };
        });
        setRoleCommitments(commitments);
      }

      setLoading(false);
    } catch (error) {
      console.error('[LifeRoles Step 3] Error:', error);
      setLoading(false);
    }
  }

  async function loadAISuggestions() {
    setAiLoading(true);
    try {
      const res = await fetch('/api/discover/life-roles/ai-commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lifeRoles,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestions) {
          setAiSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('[LifeRoles Step 3] AI suggestions error:', error);
    } finally {
      setAiLoading(false);
    }
  }

  function applyRoleAISuggestion(roleId: string) {
    const suggestion = aiSuggestions.roleCommitments?.[roleId];
    if (!suggestion) return;
    setRoleCommitments(prev =>
      prev.map(rc => rc.roleId === roleId ? { ...rc, commitment: suggestion } : rc)
    );
  }

  function updateRoleCommitment(roleId: string, field: keyof RoleCommitment, value: string | number) {
    setRoleCommitments(prev =>
      prev.map(rc => rc.roleId === roleId ? { ...rc, [field]: value } : rc)
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/discover/life-roles/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_commitments: roleCommitments,
        }),
      });
      alert(language === 'ko' ? '저장되었습니다.' : 'Saved!');
    } catch (error) {
      console.error('[LifeRoles Step 3] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    const filledRoles = roleCommitments.filter(c => c.commitment.trim()).length;

    if (filledRoles < 3) {
      alert(language === 'ko'
        ? '역할 헌신을 최소 3개 작성해주세요.'
        : 'Please complete at least 3 role commitments.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/life-roles/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 4,
          role_commitments: roleCommitments,
        }),
      });
      router.push('/discover/life-roles/step4');
    } catch (error) {
      console.error('[LifeRoles Step 3] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/life-roles', 3, [1, 2]);
  const filledRoleCount = roleCommitments.filter(c => c.commitment.trim()).length;
  const isReady = filledRoleCount >= 3;

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
      currentStep={3}
      totalSteps={4}
      title={language === 'ko' ? '역할과 헌신(R&C) 테이블' : 'Roles & Commitment (R&C) Table'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Instruction Card */}
        <ModuleCard padding="normal">
          <div className="flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'ko' ? 'R&C 테이블이란?' : 'What is the R&C Table?'}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {language === 'ko'
                  ? '"헌신(Commitment)"은 의무나 압박이 아닌 진정한 자기 선택적 참여입니다. 각 역할에 대해 어떻게 헌신할 것인지, 그리고 현재와 원하는 시간 배분을 기록하세요.'
                  : '"Commitment" is not a rigid obligation but a genuine, self-chosen involvement. Record how you commit to each role and reflect on your current vs. desired time allocation.'}
              </p>
            </div>
          </div>
        </ModuleCard>

        {/* AI Suggestions Button */}
        <div className="flex justify-end">
          <button
            onClick={loadAISuggestions}
            disabled={aiLoading}
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 border border-purple-200 transition-colors"
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {language === 'ko' ? 'AI 제안 받기' : 'Get AI Suggestions'}
          </button>
        </div>

        {/* Life Roles Commitments Table */}
        <ModuleCard padding="normal">
          <div className="flex items-center gap-2 mb-4 p-3 bg-teal-50 rounded-lg">
            <Users className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-teal-800">
              {language === 'ko' ? '삶의 역할 헌신' : 'Life Role Commitments'}
            </h3>
          </div>

          {lifeRoles.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              {language === 'ko'
                ? 'Step 1에서 삶의 역할을 먼저 추가해주세요.'
                : 'Please add life roles in Step 1 first.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-teal-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 w-1/4">
                      {language === 'ko' ? '역할' : 'Role'}
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                      {language === 'ko' ? '헌신' : 'Commitment'}
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 w-28">
                      {language === 'ko' ? '현재 시간 %' : 'Current %'}
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 w-28">
                      {language === 'ko' ? '희망 시간 %' : 'Desired %'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roleCommitments.map((rc) => (
                    <tr key={rc.roleId}>
                      <td className="border border-gray-200 px-3 py-2 bg-white font-medium text-gray-700">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs leading-tight">{rc.roleName}</span>
                          {aiSuggestions.roleCommitments?.[rc.roleId] && (
                            <button
                              onClick={() => applyRoleAISuggestion(rc.roleId)}
                              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-0.5 flex-shrink-0"
                            >
                              <Sparkles className="w-3 h-3" />
                              {language === 'ko' ? '적용' : 'Apply'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-200 p-1 bg-white">
                        <textarea
                          value={rc.commitment}
                          onChange={(e) => updateRoleCommitment(rc.roleId, 'commitment', e.target.value)}
                          placeholder={
                            aiSuggestions.roleCommitments?.[rc.roleId]
                              ? `AI: ${aiSuggestions.roleCommitments[rc.roleId].substring(0, 50)}...`
                              : language === 'ko' ? '이 역할에 대한 헌신...' : 'Your commitment to this role...'
                          }
                          rows={2}
                          className="w-full px-2 py-1.5 border-0 focus:ring-2 focus:ring-teal-500 rounded text-sm resize-none"
                        />
                      </td>
                      <td className="border border-gray-200 px-3 py-2 bg-white text-center">
                        <div className="space-y-1">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={rc.currentTimePct}
                            onChange={(e) => updateRoleCommitment(rc.roleId, 'currentTimePct', Number(e.target.value))}
                            className="w-full accent-teal-500"
                          />
                          <span className="text-xs text-gray-500">{rc.currentTimePct}%</span>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 bg-white text-center">
                        <div className="space-y-1">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={rc.desiredTimePct}
                            onChange={(e) => updateRoleCommitment(rc.roleId, 'desiredTimePct', Number(e.target.value))}
                            className="w-full accent-teal-500"
                          />
                          <span className="text-xs text-gray-500">{rc.desiredTimePct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModuleCard>

        {/* Example Reference Card */}
        <ModuleCard padding="normal" className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-2">
                {language === 'ko' ? '예시' : 'Example'}
              </h4>
              <div className="text-sm text-amber-900 space-y-2">
                <p>
                  <span className="font-medium">{language === 'ko' ? '부모 역할: ' : 'Parent role: '}</span>
                  {language === 'ko'
                    ? '자녀와 매주 질 높은 시간을 보내며 그들의 성장을 지원한다. (현재 30% → 목표 35%)'
                    : 'Spend quality time with children weekly and support their growth. (Current 30% → Desired 35%)'}
                </p>
                <p>
                  <span className="font-medium">{language === 'ko' ? '학습자 역할: ' : 'Learner role: '}</span>
                  {language === 'ko'
                    ? '매주 새로운 기술을 배우기 위해 시간을 투자한다. (현재 10% → 목표 20%)'
                    : 'Invest time weekly to learn new skills. (Current 10% → Desired 20%)'}
                </p>
              </div>
            </div>
          </div>
        </ModuleCard>

        {/* Progress Summary */}
        <ModuleCard padding="normal" className={isReady ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <p className={filledRoleCount >= 3 ? 'text-green-700' : 'text-gray-600'}>
                {language === 'ko'
                  ? `역할 헌신: ${filledRoleCount}/${roleCommitments.length} 완성 (최소 3개)`
                  : `Role commitments: ${filledRoleCount}/${roleCommitments.length} (min 3)`}
              </p>
            </div>
            {isReady && (
              <span className="text-green-600 text-lg">&#10003;</span>
            )}
          </div>
        </ModuleCard>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <ModuleButton
            onClick={() => router.push('/discover/life-roles/step2')}
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
              disabled={saving || !isReady}
            >
              {language === 'ko' ? '다음: 성찰' : 'Next: Reflection'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </ModuleButton>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
