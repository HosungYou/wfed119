'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, ClipboardList, HelpCircle, Users, Target } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface RoleCommitment {
  role: string;
  commitment: string;
}

interface WellbeingCommitment {
  dimension: string;
  commitment: string;
}

const STEPS = [
  { id: 'step1', label: 'Values Review', labelKo: '가치관 검토' },
  { id: 'step2', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step3', label: 'Self-Role Reflection', labelKo: '자기 역할 성찰' },
  { id: 'step4', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step5', label: 'Mission Statement', labelKo: '사명 선언문' },
];

const SHARPEN_SAW_ROLES = [
  { key: 'physical', label: 'Physical', labelKo: '신체적' },
  { key: 'intellectual', label: 'Intellectual', labelKo: '지적' },
  { key: 'social_emotional', label: 'Social/Emotional', labelKo: '사회적/정서적' },
  { key: 'spiritual', label: 'Spiritual', labelKo: '영적' },
  { key: 'financial', label: 'Financial', labelKo: '재정적' },
];

const AGE_MARKERS = [10, 20, 30, 40, 50, 60, 70, 80];

export default function MissionStep4() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [roleCommitments, setRoleCommitments] = useState<RoleCommitment[]>([]);
  const [wellbeingCommitments, setWellbeingCommitments] = useState<Record<string, string>>({});
  const [currentAge, setCurrentAge] = useState<number>(25);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/mission/session');
      const data = await res.json();

      if (data.current_step < 4) {
        router.push(`/discover/mission/step${data.current_step}`);
        return;
      }

      setSession(data);

      // Initialize role commitments from life_roles
      if (data.life_roles && data.life_roles.length > 0) {
        const existingCommitments = data.role_commitments || [];
        const commitments = data.life_roles.map((lr: any) => {
          const existing = existingCommitments.find((c: any) => c.role === lr.role);
          return {
            role: lr.role,
            commitment: existing?.commitment || '',
          };
        });
        setRoleCommitments(commitments);
      }

      // Initialize wellbeing commitments
      if (data.wellbeing_commitments) {
        setWellbeingCommitments(data.wellbeing_commitments);
      } else if (data.wellbeing_reflections) {
        // Pre-fill with reflections as starting point
        setWellbeingCommitments(data.wellbeing_reflections);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 4] Error:', error);
      setLoading(false);
    }
  }

  function updateRoleCommitment(index: number, commitment: string) {
    setRoleCommitments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], commitment };
      return updated;
    });
  }

  function updateWellbeingCommitment(key: string, value: string) {
    setWellbeingCommitments(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_commitments: roleCommitments,
          wellbeing_commitments: wellbeingCommitments,
        }),
      });
      alert(language === 'ko' ? '저장되었습니다.' : 'Saved!');
    } catch (error) {
      console.error('[Mission Step 4] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    // Validate at least some commitments are filled
    const filledRoleCommitments = roleCommitments.filter(c => c.commitment.trim()).length;
    const filledWellbeingCommitments = Object.values(wellbeingCommitments).filter(v => v.trim()).length;

    if (filledRoleCommitments < 2 || filledWellbeingCommitments < 2) {
      alert(language === 'ko'
        ? '역할별 헌신과 웰빙 영역별 헌신을 각각 최소 2개씩 작성해주세요.'
        : 'Please complete at least 2 role commitments and 2 wellbeing commitments.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 5,
          role_commitments: roleCommitments,
          wellbeing_commitments: wellbeingCommitments,
        }),
      });

      router.push('/discover/mission/step5');
    } catch (error) {
      console.error('[Mission Step 4] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 4, [1, 2, 3]);
  const filledRoleCount = roleCommitments.filter(c => c.commitment.trim()).length;
  const filledWellbeingCount = Object.values(wellbeingCommitments).filter(v => v.trim()).length;

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
      currentStep={4}
      totalSteps={5}
      title={language === 'ko' ? '역할과 헌신' : 'Roles & Commitment'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Life Rainbow Visualization */}
        <ModuleCard padding="normal">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '3. 삶의 역할 목록 (Life Roles Rainbow)' : '3. List Up All of Your Life Roles (Rainbow)'}
          </h2>
          <p className="text-gray-600 mb-4">
            {language === 'ko'
              ? '"톱날 갈기"라 불리는 자기 자신을 위한 역할을 포함하여 현재와 미래의 역할을 최대 8개까지 나열하세요. 미래의 역할을 입력할 때는 "[미래]교수" 또는 "CEO"처럼 작성할 수 있습니다.'
              : 'List up your current and future roles up to eight on this rainbow including the role to yourself, called "Sharpen the Saw." When you enter future roles, you can put "[future] professor" or "CEO" as your role.'}
          </p>

          {/* Rainbow Visualization */}
          <div className="p-6 bg-gradient-to-br from-gray-50 to-teal-50 rounded-lg mb-4">
            <div className="relative flex justify-center">
              <svg viewBox="0 0 400 220" className="w-full max-w-md">
                {/* Age markers */}
                {AGE_MARKERS.map((age, i) => (
                  <text
                    key={age}
                    x={50 + i * 43}
                    y={20}
                    className="text-xs fill-gray-500"
                    textAnchor="middle"
                  >
                    {age}
                  </text>
                ))}

                {/* Rainbow arcs */}
                {[...Array(8)].map((_, i) => (
                  <path
                    key={i}
                    d={`M 50 200 Q 200 ${20 + i * 20} 350 200`}
                    fill="none"
                    stroke={i < roleCommitments.length ? `hsl(${170 + i * 15}, 50%, 60%)` : '#e5e7eb'}
                    strokeWidth="4"
                    opacity={0.7}
                  />
                ))}

                {/* Current age marker */}
                <line x1={50 + (currentAge / 10) * 43} y1={25} x2={50 + (currentAge / 10) * 43} y2={195} stroke="#0d9488" strokeWidth="2" strokeDasharray="4 2" />
                <text x={50 + (currentAge / 10) * 43} y={210} className="text-xs fill-teal-600 font-medium" textAnchor="middle">
                  {language === 'ko' ? '현재' : 'Now'}
                </text>
              </svg>
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {language === 'ko'
                ? 'Life Roles Rainbow (Super, 1980)'
                : 'Life Roles Rainbow (Super, 1980)'}
            </p>
          </div>

          <div className="text-xs text-gray-500 p-3 bg-gray-100 rounded-lg">
            <span className="font-medium">{language === 'ko' ? '출처: ' : 'Source: '}</span>
            Super, D. E. (1980). A life-span, life-space approach to career development. <em>Journal of Vocational Behavior, 16</em>(3), 282-298.
          </div>
        </ModuleCard>

        {/* Roles & Commitment Table */}
        <ModuleCard padding="normal">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-gray-900">
              {language === 'ko' ? '4. 역할 및 헌신 (R&C) 테이블' : '4. Completing Roles and Commitment (R&C) Table'}
            </h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            {language === 'ko'
              ? '"헌신(Commitment)"은 의무나 압박이 아닌 진정한 자기 선택적 참여입니다. 각 역할에 대해 어떻게 헌신할 것인지 1-2문장으로 작성하세요.'
              : '"Commitment" is not a rigid obligation but a genuine, self-chosen involvement. Describe your commitment for each role in 1-2 sentences.'}
          </p>

          {/* Sharpen the Saw Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 p-2 bg-purple-50 rounded-lg">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                {language === 'ko' ? '톱날 갈기 (자기 관리)' : 'Sharpen the Saw (Self-care)'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 w-1/4">
                      {language === 'ko' ? '영역' : 'Dimension'}
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                      {language === 'ko' ? '헌신' : 'Commitment'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SHARPEN_SAW_ROLES.map((dim) => (
                    <tr key={dim.key}>
                      <td className="border border-gray-200 px-3 py-2 bg-white font-medium text-gray-700">
                        {language === 'ko' ? dim.labelKo : dim.label}
                      </td>
                      <td className="border border-gray-200 p-1 bg-white">
                        <input
                          type="text"
                          value={wellbeingCommitments[dim.key] || ''}
                          onChange={(e) => updateWellbeingCommitment(dim.key, e.target.value)}
                          placeholder={language === 'ko' ? '헌신 내용 입력...' : 'Enter commitment...'}
                          className="w-full px-2 py-1.5 border-0 focus:ring-2 focus:ring-teal-500 rounded text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Life Roles Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 p-2 bg-teal-50 rounded-lg">
              <Users className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-800">
                {language === 'ko' ? '삶의 역할' : 'Life Roles'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 w-1/4">
                      {language === 'ko' ? '역할' : 'Role'}
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                      {language === 'ko' ? '헌신' : 'Commitment'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roleCommitments.map((rc, index) => (
                    <tr key={index}>
                      <td className="border border-gray-200 px-3 py-2 bg-white font-medium text-gray-700">
                        {rc.role}
                      </td>
                      <td className="border border-gray-200 p-1 bg-white">
                        <input
                          type="text"
                          value={rc.commitment}
                          onChange={(e) => updateRoleCommitment(index, e.target.value)}
                          placeholder={language === 'ko' ? '이 역할에 대한 헌신...' : 'Your commitment to this role...'}
                          className="w-full px-2 py-1.5 border-0 focus:ring-2 focus:ring-teal-500 rounded text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ModuleCard>

        {/* Example Reference */}
        <ModuleCard padding="normal" className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-2">
                {language === 'ko' ? '예시' : 'Example'}
              </h4>
              <div className="text-sm text-amber-900 space-y-2">
                <p>
                  <span className="font-medium">{language === 'ko' ? '신체적: ' : 'Physical: '}</span>
                  {language === 'ko'
                    ? '신체적 웰빙과 에너지를 향상시키기 위해 규칙적인 운동에 참여한다.'
                    : 'Engage in regular exercise to enhance my physical well-being and energy.'}
                </p>
                <p>
                  <span className="font-medium">{language === 'ko' ? '자녀 역할: ' : 'Son/Daughter role: '}</span>
                  {language === 'ko'
                    ? '부모님께 정기적으로 연락하고 감사를 표현한다.'
                    : 'Contact parents regularly and express gratitude.'}
                </p>
              </div>
            </div>
          </div>
        </ModuleCard>

        {/* Progress Summary */}
        <ModuleCard padding="normal" className={
          filledRoleCount >= 2 && filledWellbeingCount >= 2
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50'
        }>
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <p className={filledWellbeingCount >= 2 ? 'text-green-700' : 'text-gray-600'}>
                {language === 'ko'
                  ? `웰빙 헌신: ${filledWellbeingCount}/5 완성 (최소 2개)`
                  : `Wellbeing commitments: ${filledWellbeingCount}/5 (min 2)`}
              </p>
              <p className={filledRoleCount >= 2 ? 'text-green-700' : 'text-gray-600'}>
                {language === 'ko'
                  ? `역할 헌신: ${filledRoleCount}/${roleCommitments.length} 완성 (최소 2개)`
                  : `Role commitments: ${filledRoleCount}/${roleCommitments.length} (min 2)`}
              </p>
            </div>
            {filledRoleCount >= 2 && filledWellbeingCount >= 2 && (
              <span className="text-green-600 text-lg">✓</span>
            )}
          </div>
        </ModuleCard>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <ModuleButton
            onClick={() => router.push('/discover/mission/step3')}
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
              disabled={saving || filledRoleCount < 2 || filledWellbeingCount < 2}
            >
              {language === 'ko' ? '다음: 사명 선언문' : 'Next: Mission Statement'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </ModuleButton>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
