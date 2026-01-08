'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Plus, X, Users, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface LifeRole {
  id: string;
  entity: string;
  role: string;
}

const STEPS = [
  { id: 'step1', label: 'Values Review', labelKo: '가치관 검토' },
  { id: 'step2', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step3', label: 'Self-Role Reflection', labelKo: '자기 역할 성찰' },
  { id: 'step4', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step5', label: 'Mission Statement', labelKo: '사명 선언문' },
];

const EXAMPLE_ENTITIES = [
  { ko: '부모님', en: 'Parents' },
  { ko: '직장/동료', en: 'Work/Colleagues' },
  { ko: '학교', en: 'School' },
  { ko: '친구들', en: 'Friends' },
  { ko: '교회/종교', en: 'Church/Religion' },
  { ko: '지역사회', en: 'Community' },
  { ko: '배우자/파트너', en: 'Spouse/Partner' },
];

const EXAMPLE_ROLES = [
  { ko: '자녀', en: 'Son/Daughter' },
  { ko: '직원/팀원', en: 'Employee/Team member' },
  { ko: '학생/멘티', en: 'Student/Mentee' },
  { ko: '친구', en: 'Friend' },
  { ko: '봉사자', en: 'Volunteer' },
  { ko: '시민', en: 'Citizen' },
  { ko: '배우자', en: 'Spouse' },
];

export default function MissionStep2() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lifeRoles, setLifeRoles] = useState<LifeRole[]>([]);

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

      // Load existing life roles if any
      if (data.life_roles && data.life_roles.length > 0) {
        setLifeRoles(data.life_roles);
      } else {
        // Initialize with 4 empty roles
        setLifeRoles([
          { id: '1', entity: '', role: '' },
          { id: '2', entity: '', role: '' },
          { id: '3', entity: '', role: '' },
          { id: '4', entity: '', role: '' },
        ]);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 2] Error:', error);
      setLoading(false);
    }
  }

  function addRole() {
    if (lifeRoles.length >= 7) {
      alert(language === 'ko' ? '최대 7개까지 추가할 수 있습니다.' : 'Maximum 7 roles allowed.');
      return;
    }
    setLifeRoles([...lifeRoles, { id: Date.now().toString(), entity: '', role: '' }]);
  }

  function removeRole(id: string) {
    if (lifeRoles.length <= 4) {
      alert(language === 'ko' ? '최소 4개의 역할이 필요합니다.' : 'Minimum 4 roles required.');
      return;
    }
    setLifeRoles(lifeRoles.filter(r => r.id !== id));
  }

  function updateRole(id: string, field: 'entity' | 'role', value: string) {
    setLifeRoles(lifeRoles.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  async function handleNext() {
    const filledRoles = lifeRoles.filter(r => r.entity.trim() && r.role.trim());
    if (filledRoles.length < 4) {
      alert(language === 'ko'
        ? '최소 4개의 역할을 완성해주세요.'
        : 'Please complete at least 4 roles.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          life_roles: filledRoles,
        }),
      });

      router.push('/discover/mission/step3');
    } catch (error) {
      console.error('[Mission Step 2] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 2, [1]);
  const filledCount = lifeRoles.filter(r => r.entity.trim() && r.role.trim()).length;

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
      totalSteps={5}
      title={language === 'ko' ? '삶의 역할 탐색' : 'Exploring Life Roles'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Instruction Card */}
        <ModuleCard padding="normal">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '1. 삶의 역할 매핑' : '1. Mapping Life Roles'}
          </h2>
          <p className="text-gray-600 mb-4">
            {language === 'ko'
              ? '삶의 역할은 가족, 학교, 직장, 지역사회, 여가 활동 등 다양한 삶의 공간에서 당신이 수행하는 역할을 의미합니다. 당신의 자아개념은 사명 선언문을 통해 시간과 공간을 넘어 확장됩니다.'
              : 'Life roles indicate the roles you play in different life spaces such as family, school, workplace, community, and leisure groups. Your self-concept crystallizes through your mission statement extended through time and space.'}
          </p>
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <p className="text-sm text-teal-800">
              {language === 'ko'
                ? '💡 "나"를 중심으로 4~7개의 관계/그룹을 식별하고, 각각에서 당신의 역할을 정의하세요.'
                : '💡 Identify 4-7 relationships/groups with "Self" at the center, and define your role in each.'}
            </p>
          </div>
        </ModuleCard>

        {/* Relationship Diagram Visualization */}
        <ModuleCard padding="normal" className="bg-gradient-to-br from-gray-50 to-teal-50">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {/* Center - Me */}
              <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center shadow-lg z-10 relative">
                <span className="text-white font-bold text-lg">
                  {language === 'ko' ? '나' : 'Me'}
                </span>
              </div>
              {/* Connecting lines visual hint */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-dashed border-teal-300 rounded-full opacity-50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 border-2 border-dashed border-teal-200 rounded-full opacity-30" />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">
            {language === 'ko'
              ? '위 다이어그램처럼 "나"를 중심으로 주변 관계를 생각해보세요'
              : 'Think about relationships around "Me" as shown in the diagram above'}
          </p>
        </ModuleCard>

        {/* Role Input Cards */}
        <ModuleCard padding="normal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              {language === 'ko' ? '관계 및 역할 입력' : 'Relationships & Roles'}
            </h3>
            <ModuleButton
              onClick={addRole}
              variant="secondary"
              size="small"
              disabled={lifeRoles.length >= 7}
            >
              <Plus className="w-4 h-4 mr-1" />
              {language === 'ko' ? '추가' : 'Add'}
            </ModuleButton>
          </div>

          <div className="space-y-4">
            {lifeRoles.map((role, index) => (
              <div key={role.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">
                    {language === 'ko' ? `관계 ${index + 1}` : `Relationship ${index + 1}`}
                  </span>
                  {lifeRoles.length > 4 && (
                    <button
                      onClick={() => removeRole(role.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {language === 'ko' ? '대상/그룹' : 'Entity/Group'}
                    </label>
                    <input
                      type="text"
                      value={role.entity}
                      onChange={(e) => updateRole(role.id, 'entity', e.target.value)}
                      placeholder={language === 'ko' ? '예: 부모님, 직장' : 'e.g., Parents, Work'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {language === 'ko' ? '나의 역할' : 'My Role'}
                    </label>
                    <input
                      type="text"
                      value={role.role}
                      onChange={(e) => updateRole(role.id, 'role', e.target.value)}
                      placeholder={language === 'ko' ? '예: 자녀, 팀원' : 'e.g., Son/Daughter, Team member'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress indicator */}
          <div className={`mt-4 p-3 rounded-lg ${filledCount >= 4 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
            <p className={`text-sm ${filledCount >= 4 ? 'text-green-700' : 'text-gray-600'}`}>
              {language === 'ko'
                ? `${filledCount}개 완성됨 (최소 4개 필요)`
                : `${filledCount} completed (minimum 4 required)`}
            </p>
          </div>
        </ModuleCard>

        {/* Examples Card */}
        <ModuleCard padding="normal" className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-2">
                {language === 'ko' ? '예시 참고' : 'Examples'}
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-amber-700 mb-1">
                    {language === 'ko' ? '대상/그룹 예시:' : 'Entity/Group examples:'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {EXAMPLE_ENTITIES.map((ex, i) => (
                      <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
                        {language === 'ko' ? ex.ko : ex.en}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-amber-700 mb-1">
                    {language === 'ko' ? '역할 예시:' : 'Role examples:'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {EXAMPLE_ROLES.map((ex, i) => (
                      <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
                        {language === 'ko' ? ex.ko : ex.en}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModuleCard>

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => router.push('/discover/mission/step1')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <ModuleButton
            onClick={handleNext}
            disabled={saving || filledCount < 4}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {language === 'ko' ? '다음 단계' : 'Next Step'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
