'use client';

import { useEffect, useState, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, GripVertical, Plus, X, Users } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

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

const DEFAULT_ROLE_CARDS = [
  { entity: 'School', role: 'Learner', entityKo: '학교', roleKo: '학습자' },
  { entity: 'Friends', role: 'Friend', entityKo: '친구', roleKo: '친구' },
  { entity: 'Parents', role: 'Daughter', entityKo: '부모님', roleKo: '딸' },
  { entity: 'Parents', role: 'Son', entityKo: '부모님', roleKo: '아들' },
  { entity: 'Children', role: 'Parent', entityKo: '자녀', roleKo: '부모' },
  { entity: 'Spouse', role: 'Partner', entityKo: '배우자', roleKo: '파트너' },
  { entity: 'Partner', role: 'Partner', entityKo: '파트너', roleKo: '파트너' },
  { entity: 'Workplace', role: 'Worker', entityKo: '직장', roleKo: '직장인' },
];

// 7 positions around the center circle
const CIRCLE_POSITIONS = [
  { angle: -90, x: 0, y: -120 },   // top
  { angle: -45, x: 85, y: -85 },   // top-right
  { angle: 0, x: 120, y: 0 },      // right
  { angle: 45, x: 85, y: 85 },     // bottom-right
  { angle: 135, x: -85, y: 85 },   // bottom-left
  { angle: 180, x: -120, y: 0 },   // left
  { angle: -135, x: -85, y: -85 }, // top-left
];

export default function LifeRolesStep1() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lifeRoles, setLifeRoles] = useState<(LifeRole | null)[]>(Array(7).fill(null));
  const [draggedItem, setDraggedItem] = useState<{ entity: string; entityKo: string; role: string; roleKo: string } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [customEntity, setCustomEntity] = useState('');
  const [customRole, setCustomRole] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/life-roles/session');
      const data = await res.json();

      if (data.current_step < 1) {
        router.push('/discover/life-roles');
        return;
      }

      // Load existing life roles
      if (data.life_roles && data.life_roles.length > 0) {
        const loadedRoles: (LifeRole | null)[] = Array(7).fill(null);
        data.life_roles.forEach((role: LifeRole, idx: number) => {
          if (idx < 7) loadedRoles[idx] = role;
        });
        setLifeRoles(loadedRoles);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Life Roles Step 1] Error:', error);
      setLoading(false);
    }
  }

  // Check if a default card is already added to the diagram
  function isCardAdded(card: typeof DEFAULT_ROLE_CARDS[0]): boolean {
    return lifeRoles.some(r => {
      if (!r) return false;
      const entityMatch = r.entity === card.entity || r.entity === card.entityKo;
      const roleMatch = r.role === card.role || r.role === card.roleKo;
      return entityMatch && roleMatch;
    });
  }

  // Add a default card to the first empty slot
  function addDefaultCard(card: typeof DEFAULT_ROLE_CARDS[0]) {
    if (isCardAdded(card)) return;

    const emptyIndex = lifeRoles.findIndex(r => r === null);
    if (emptyIndex === -1) {
      alert(language === 'ko' ? '모든 슬롯이 채워져 있습니다.' : 'All slots are filled.');
      return;
    }

    const newRoles = [...lifeRoles];
    newRoles[emptyIndex] = {
      id: `default_${Date.now()}_${emptyIndex}`,
      entity: language === 'ko' ? card.entityKo : card.entity,
      role: language === 'ko' ? card.roleKo : card.role,
    };
    setLifeRoles(newRoles);
  }

  // Drag and Drop handlers
  function handleDragStart(e: DragEvent, item: typeof DEFAULT_ROLE_CARDS[0]) {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    setDraggedItem(null);
    setDragOverIndex(null);
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(e: DragEvent, index: number) {
    e.preventDefault();
    if (draggedItem) {
      const newRoles = [...lifeRoles];
      newRoles[index] = {
        id: `${Date.now()}_${index}`,
        entity: language === 'ko' ? draggedItem.entityKo : draggedItem.entity,
        role: language === 'ko' ? draggedItem.roleKo : draggedItem.role,
      };
      setLifeRoles(newRoles);
    }
    setDraggedItem(null);
    setDragOverIndex(null);
  }

  function removeRole(index: number) {
    const newRoles = [...lifeRoles];
    newRoles[index] = null;
    setLifeRoles(newRoles);
  }

  function addCustomRole() {
    if (!customEntity.trim() || !customRole.trim()) {
      alert(language === 'ko' ? '대상과 역할을 모두 입력해주세요.' : 'Please enter both entity and role.');
      return;
    }

    // Find first empty slot
    const emptyIndex = lifeRoles.findIndex(r => r === null);
    if (emptyIndex === -1) {
      alert(language === 'ko' ? '모든 슬롯이 채워져 있습니다.' : 'All slots are filled.');
      return;
    }

    const newRoles = [...lifeRoles];
    newRoles[emptyIndex] = {
      id: `custom_${Date.now()}`,
      entity: customEntity.trim(),
      role: customRole.trim(),
    };
    setLifeRoles(newRoles);
    setCustomEntity('');
    setCustomRole('');
  }

  async function handleNext() {
    const filledRoles = lifeRoles.filter((r): r is LifeRole => r !== null);
    if (filledRoles.length < 4) {
      alert(language === 'ko'
        ? '최소 4개의 역할을 배치해주세요.'
        : 'Please place at least 4 roles on the diagram.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/life-roles/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 2,
          life_roles: filledRoles.map(r => ({
            id: r.id,
            entity: r.entity,
            role: r.role,
          })),
        }),
      });

      router.push('/discover/life-roles/step2');
    } catch (error) {
      console.error('[Life Roles Step 1] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/life-roles', 1, []);
  const filledCount = lifeRoles.filter(r => r !== null).length;
  const filledRoles = lifeRoles.filter((r): r is LifeRole => r !== null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <ModuleShell
      moduleId="life-roles"
      currentStep={1}
      totalSteps={4}
      title={language === 'ko' ? '삶의 역할 탐색' : 'Life Roles Mapping'}
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
              ? '아래의 기본 역할 카드를 클릭하여 추가하거나, 드래그하여 다이어그램에 배치하세요. "나"를 중심으로 4~7개의 관계를 매핑합니다. 직접 입력도 가능합니다.'
              : 'Click default role cards below to add them, or drag them onto the diagram. Map 4-7 relationships with "Self" at the center. You can also add custom roles.'}
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              {language === 'ko'
                ? '💡 카드를 클릭하면 자동으로 빈 슬롯에 추가됩니다. 드래그 앤 드롭도 가능합니다.'
                : '💡 Click a card to auto-add to an empty slot. Drag & drop also works.'}
            </p>
          </div>
        </ModuleCard>

        {/* Default Role Cards as suggestion chips */}
        <ModuleCard padding="normal">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            {language === 'ko' ? '기본 역할 카드' : 'Default Role Cards'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_ROLE_CARDS.map((card, idx) => {
              const added = isCardAdded(card);
              return (
                <button
                  key={idx}
                  onClick={() => !added && addDefaultCard(card)}
                  draggable={!added}
                  onDragStart={(e) => !added && handleDragStart(e, card)}
                  onDragEnd={handleDragEnd}
                  disabled={added}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    added
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-default opacity-60'
                      : 'bg-white border-amber-300 text-gray-800 hover:bg-amber-50 hover:border-amber-400 cursor-grab active:cursor-grabbing shadow-sm hover:shadow'
                  }`}
                >
                  <span className="font-medium">
                    {language === 'ko' ? card.entityKo : card.entity}
                  </span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-amber-700">
                    {language === 'ko' ? card.roleKo : card.role}
                  </span>
                  {added && <span className="ml-1 text-xs text-gray-400">(added)</span>}
                </button>
              );
            })}
          </div>
        </ModuleCard>

        {/* Main Interactive Area */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Custom Role Input - Left Side */}
          <div className="lg:col-span-2">
            <ModuleCard padding="normal">
              <h3 className="font-semibold text-gray-900 mb-4">
                {language === 'ko' ? '직접 추가' : 'Add Custom Role'}
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={customEntity}
                  onChange={(e) => setCustomEntity(e.target.value)}
                  placeholder={language === 'ko' ? '대상/그룹 (예: 동아리)' : 'Entity/Group (e.g., Club)'}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder={language === 'ko' ? '나의 역할 (예: 회장)' : 'My Role (e.g., President)'}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={addCustomRole}
                  className="w-full py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'ko' ? '추가' : 'Add'}
                </button>
              </div>
            </ModuleCard>
          </div>

          {/* Drop Zone Diagram - Right Side */}
          <div className="lg:col-span-3">
            <ModuleCard padding="normal" className="bg-gradient-to-br from-gray-50 to-amber-50 min-h-[500px]">
              <h3 className="font-semibold text-gray-900 text-center mb-4">
                {language === 'ko' ? '관계 다이어그램' : 'Relationship Diagram'}
              </h3>

              <div className="relative flex items-center justify-center h-[420px]">
                {/* Center - Me */}
                <div className="absolute w-24 h-24 bg-amber-600 rounded-full flex items-center justify-center shadow-lg z-20">
                  <span className="text-white font-bold text-xl">
                    {language === 'ko' ? '나' : 'Me'}
                  </span>
                </div>

                {/* Connecting lines */}
                <svg className="absolute w-full h-full" style={{ zIndex: 5 }}>
                  {CIRCLE_POSITIONS.map((pos, idx) => (
                    <line
                      key={idx}
                      x1="50%"
                      y1="50%"
                      x2={`calc(50% + ${pos.x}px)`}
                      y2={`calc(50% + ${pos.y}px)`}
                      stroke={lifeRoles[idx] ? '#d97706' : '#d1d5db'}
                      strokeWidth="2"
                      strokeDasharray={lifeRoles[idx] ? 'none' : '5,5'}
                    />
                  ))}
                </svg>

                {/* Drop zones */}
                {CIRCLE_POSITIONS.map((pos, idx) => (
                  <div
                    key={idx}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`absolute w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all z-10 ${
                      lifeRoles[idx]
                        ? 'bg-white border-2 border-amber-500 shadow-md'
                        : dragOverIndex === idx
                        ? 'bg-amber-100 border-2 border-amber-400 border-dashed scale-110'
                        : 'bg-white/80 border-2 border-dashed border-gray-300 hover:border-amber-400'
                    }`}
                    style={{
                      left: `calc(50% + ${pos.x}px - 56px)`,
                      top: `calc(50% + ${pos.y}px - 56px)`,
                    }}
                  >
                    {lifeRoles[idx] ? (
                      <>
                        <button
                          onClick={() => removeRole(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-30"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="text-xs font-medium text-gray-900 text-center px-2 truncate w-full">
                          {lifeRoles[idx]!.entity}
                        </p>
                        <p className="text-xs text-amber-600 text-center px-2 truncate w-full">
                          {lifeRoles[idx]!.role}
                        </p>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs text-center">
                        {language === 'ko' ? '드롭' : 'Drop'}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className={`mt-4 p-3 rounded-lg text-center ${
                filledCount >= 4 ? 'bg-green-100 border border-green-300' : 'bg-amber-50 border border-amber-200'
              }`}>
                <p className={`text-sm font-medium ${filledCount >= 4 ? 'text-green-700' : 'text-amber-700'}`}>
                  {language === 'ko'
                    ? `${filledCount}/7 역할 배치됨 (최소 4개)`
                    : `${filledCount}/7 roles placed (minimum 4)`}
                </p>
              </div>
            </ModuleCard>
          </div>
        </div>

        {/* Roles Table */}
        {filledRoles.length > 0 && (
          <ModuleCard padding="normal">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'ko' ? '배치된 역할 목록' : 'Placed Roles Summary'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium w-10">#</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      {language === 'ko' ? '대상' : 'Entity'}
                    </th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      {language === 'ko' ? '역할' : 'Role'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filledRoles.map((role, idx) => (
                    <tr key={role.id} className="border-b border-gray-100 hover:bg-amber-50">
                      <td className="py-2 px-3 text-gray-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-gray-900">{role.entity}</td>
                      <td className="py-2 px-3 text-gray-700">{role.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModuleCard>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => router.push('/discover/life-roles')}
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
