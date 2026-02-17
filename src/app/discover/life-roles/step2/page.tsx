'use client';

import { useEffect, useState, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, GripVertical, Table2, BarChart3, StickyNote, Info } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface LifeRole {
  id: string;
  entity: string;
  role: string;
}

interface RainbowSlot {
  roleId: string;
  roleName: string;
  ageStart: number;
  ageEnd: number;
  intensity: number; // 1-3
}

interface RainbowData {
  currentAge: number;
  slots: RainbowSlot[];
  notes: string;
}

const STEPS = [
  { id: 'step1', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step2', label: 'Life Rainbow', labelKo: '인생 무지개' },
  { id: 'step3', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step4', label: 'Reflection', labelKo: '성찰' },
];

const AGE_MARKERS = [10, 20, 30, 40, 50, 60, 70, 80];

const RAINBOW_COLORS = [
  { bg: 'rgb(239, 68, 68)',   label: 'red',    tailwind: 'bg-red-500' },
  { bg: 'rgb(249, 115, 22)',  label: 'orange', tailwind: 'bg-orange-500' },
  { bg: 'rgb(234, 179, 8)',   label: 'yellow', tailwind: 'bg-yellow-500' },
  { bg: 'rgb(34, 197, 94)',   label: 'green',  tailwind: 'bg-green-500' },
  { bg: 'rgb(59, 130, 246)',  label: 'blue',   tailwind: 'bg-blue-500' },
  { bg: 'rgb(99, 102, 241)',  label: 'indigo', tailwind: 'bg-indigo-500' },
  { bg: 'rgb(139, 92, 246)',  label: 'violet', tailwind: 'bg-violet-500' },
  { bg: 'rgb(20, 184, 166)',  label: 'teal',   tailwind: 'bg-teal-500' },
];

const SHARPEN_SAW_SLOT: RainbowSlot = {
  roleId: 'sharpen-the-saw',
  roleName: 'Sharpen the Saw',
  ageStart: 10,
  ageEnd: 80,
  intensity: 3,
};

const DEFAULT_RAINBOW_DATA: RainbowData = {
  currentAge: 25,
  slots: [SHARPEN_SAW_SLOT],
  notes: '',
};

function ageToPercent(age: number): number {
  // Map age 10-80 to 0-100%
  return Math.max(0, Math.min(100, ((age - 10) / 70) * 100));
}

export default function LifeRolesStep2() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lifeRoles, setLifeRoles] = useState<LifeRole[]>([]);
  const [rainbowData, setRainbowData] = useState<RainbowData>(DEFAULT_RAINBOW_DATA);
  const [viewMode, setViewMode] = useState<'arc' | 'table'>('arc');
  const [draggedRole, setDraggedRole] = useState<LifeRole | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

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

      // Load life roles from step1
      if (data.life_roles && data.life_roles.length > 0) {
        setLifeRoles(data.life_roles);
      }

      // Load existing rainbow data
      if (data.rainbow_data) {
        const loadedSlots = data.rainbow_data.slots ?? [];
        // Ensure Sharpen the Saw is always in slot 0
        const hasSharpenSaw = loadedSlots.length > 0 && loadedSlots[0]?.roleId === 'sharpen-the-saw';
        const slots = hasSharpenSaw
          ? [SHARPEN_SAW_SLOT, ...loadedSlots.slice(1)]
          : [SHARPEN_SAW_SLOT, ...loadedSlots];

        setRainbowData({
          currentAge: data.rainbow_data.currentAge ?? 25,
          slots,
          notes: data.rainbow_data.notes ?? '',
        });
      } else {
        // Pre-populate currentAge from session if available
        const age = data.current_age ?? 25;
        setRainbowData(prev => ({ ...prev, currentAge: age }));
      }

      setLoading(false);
    } catch (error) {
      console.error('[Life Roles Step 2] Error:', error);
      setLoading(false);
    }
  }

  // Check if a slot is the read-only Sharpen the Saw slot
  function isSharpenSawSlot(index: number): boolean {
    return index === 0;
  }

  // Drag and Drop handlers
  function handleDragStart(e: DragEvent, role: LifeRole) {
    setDraggedRole(role);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    setDraggedRole(null);
    setDragOverSlot(null);
  }

  function handleDragOver(e: DragEvent, slotIndex: number) {
    if (isSharpenSawSlot(slotIndex)) return; // Can't drop on Sharpen the Saw
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotIndex);
  }

  function handleDragLeave() {
    setDragOverSlot(null);
  }

  function handleDrop(e: DragEvent, slotIndex: number) {
    e.preventDefault();
    if (!draggedRole || isSharpenSawSlot(slotIndex)) {
      setDragOverSlot(null);
      return;
    }

    const newSlots = [...rainbowData.slots];
    const currentSlotEntry = newSlots[slotIndex];

    if (currentSlotEntry) {
      newSlots[slotIndex] = {
        ...currentSlotEntry,
        roleId: draggedRole.id,
        roleName: draggedRole.role,
      };
    } else {
      // Fill sparse array up to slotIndex
      while (newSlots.length <= slotIndex) {
        newSlots.push({ roleId: '', roleName: '', ageStart: 10, ageEnd: 80, intensity: 2 });
      }
      newSlots[slotIndex] = {
        roleId: draggedRole.id,
        roleName: draggedRole.role,
        ageStart: 20,
        ageEnd: 50,
        intensity: 2,
      };
    }

    setRainbowData(prev => ({ ...prev, slots: newSlots }));
    setDraggedRole(null);
    setDragOverSlot(null);
  }

  function removeFromRainbow(slotIndex: number) {
    if (isSharpenSawSlot(slotIndex)) return; // Can't remove Sharpen the Saw
    const newSlots = [...rainbowData.slots];
    newSlots[slotIndex] = { roleId: '', roleName: '', ageStart: 10, ageEnd: 80, intensity: 2 };
    setRainbowData(prev => ({ ...prev, slots: newSlots }));
  }

  function updateSlotField(slotIndex: number, field: keyof RainbowSlot, value: number | string) {
    if (isSharpenSawSlot(slotIndex)) return; // Can't modify Sharpen the Saw
    const newSlots = [...rainbowData.slots];
    if (newSlots[slotIndex]) {
      newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
      setRainbowData(prev => ({ ...prev, slots: newSlots }));
    }
  }

  function getSlot(index: number): RainbowSlot | null {
    const slot = rainbowData.slots[index];
    return slot && slot.roleId ? slot : null;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/discover/life-roles/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rainbow_data: rainbowData }),
      });
      alert(language === 'ko' ? '저장되었습니다.' : 'Saved!');
    } catch (error) {
      console.error('[Life Roles Step 2] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    // Count placed roles (excluding the auto Sharpen the Saw in slot 0)
    const placedCount = rainbowData.slots.filter((s, i) => i > 0 && s.roleId).length;
    if (placedCount < 3) {
      alert(language === 'ko'
        ? '최소 3개의 역할을 무지개에 배치해주세요.'
        : 'Please place at least 3 roles on the rainbow.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/life-roles/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          rainbow_data: rainbowData,
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
  // Count user-placed roles (excluding slot 0 = Sharpen the Saw)
  const placedCount = rainbowData.slots.filter((s, i) => i > 0 && s.roleId).length;

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
      totalSteps={4}
      title={language === 'ko' ? '인생 무지개' : 'Life Rainbow'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Instruction Card with citation */}
        <ModuleCard padding="normal">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '인생 무지개 시각화' : 'Life Rainbow Visualization'}
          </h2>
          <p className="text-gray-600 mb-4">
            {language === 'ko'
              ? 'Donald Super의 삶의 역할 이론을 바탕으로, 인생의 여러 시기에 걸쳐 어떤 역할들을 수행하게 될지 시각화해보세요. 왼쪽의 역할 카드를 드래그하여 무지개 슬롯에 배치하고, 연령 범위와 강도를 설정하세요.'
              : "Based on Donald Super's life-role theory, visualize which roles you'll fulfill across different life stages. Drag role cards from the left onto rainbow slots and set age ranges and intensity."}
          </p>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">
                {language === 'ko' ? '출처: ' : 'Source: '}
              </span>
              Super, D. E. (1980). A life-span, life-space approach to career development. <em>Journal of Vocational Behavior, 16</em>(3), 282-298.
            </p>
          </div>
        </ModuleCard>

        {/* Sharpen the Saw Info Card */}
        <ModuleCard padding="normal" className="bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-800 mb-1">
                {language === 'ko' ? 'Sharpen the Saw (자기관리)' : 'Sharpen the Saw (Self-Renewal)'}
              </h4>
              <p className="text-sm text-purple-700">
                {language === 'ko'
                  ? 'Sharpen the Saw (자기관리)는 인생 전체에 걸쳐 자동으로 포함됩니다. 신체적, 지적, 사회적/정서적, 영적 차원에서의 지속적인 자기 갱신을 나타냅니다.'
                  : 'Sharpen the Saw (Self-Renewal) is automatically included across your entire lifespan. It represents ongoing self-renewal in physical, intellectual, social/emotional, and spiritual dimensions.'}
              </p>
            </div>
          </div>
        </ModuleCard>

        {/* Current Age Input */}
        <ModuleCard padding="normal">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {language === 'ko' ? '현재 나이' : 'Current Age'}
            </label>
            <input
              type="number"
              min={10}
              max={80}
              value={rainbowData.currentAge}
              onChange={(e) => setRainbowData(prev => ({ ...prev, currentAge: Number(e.target.value) }))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-center font-semibold"
            />
            <p className="text-sm text-gray-500">
              {language === 'ko'
                ? '현재 나이를 입력하면 무지개 시각화에 현재 위치가 표시됩니다.'
                : 'Enter your current age to see your position marked on the rainbow visualization.'}
            </p>
          </div>
        </ModuleCard>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('arc')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'arc'
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {language === 'ko' ? '아크 뷰' : 'Arc View'}
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Table2 className="w-4 h-4" />
            {language === 'ko' ? '테이블 뷰' : 'Table View'}
          </button>
        </div>

        {/* Two-panel layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left panel: Role cards */}
          <div className="lg:col-span-1">
            <ModuleCard padding="normal">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                {language === 'ko' ? '역할 카드 (드래그하여 배치)' : 'Role Cards (Drag to Place)'}
              </h4>
              <div className="space-y-2">
                {/* Life role cards from step1 */}
                {lifeRoles.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    {language === 'ko'
                      ? '1단계에서 역할을 추가해주세요.'
                      : 'Add roles in Step 1 first.'}
                  </p>
                )}
                {lifeRoles.map((role) => (
                  <div
                    key={role.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, role)}
                    onDragEnd={handleDragEnd}
                    className="p-2 bg-white border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing flex items-center gap-2 hover:border-teal-400 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{role.role}</p>
                      <p className="text-xs text-gray-500 truncate">{role.entity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ModuleCard>
          </div>

          {/* Right panel: Rainbow visualization */}
          <div className="lg:col-span-2">
            <ModuleCard padding="normal">
              {viewMode === 'arc' ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    {language === 'ko' ? '인생 무지개 (Super, 1980)' : 'Life Rainbow (Super, 1980)'}
                  </h4>

                  {/* Age axis labels */}
                  <div className="flex justify-between mb-2 px-1">
                    {AGE_MARKERS.map((age) => (
                      <span key={age} className="text-xs text-gray-500 font-medium w-8 text-center">
                        {age}
                      </span>
                    ))}
                  </div>

                  {/* Rainbow slots (8 rows) */}
                  <div className="space-y-1.5 relative">
                    {/* Current age indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-800 opacity-40 z-10 pointer-events-none"
                      style={{
                        left: `${ageToPercent(rainbowData.currentAge)}%`,
                      }}
                    >
                      <div className="absolute -top-5 -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap font-medium">
                        {language === 'ko' ? '현재' : 'Now'} ({rainbowData.currentAge})
                      </div>
                    </div>

                    {Array.from({ length: 8 }, (_, index) => {
                      const slot = getSlot(index);
                      const color = RAINBOW_COLORS[index];
                      const isDragOver = dragOverSlot === index;
                      const isReadOnly = isSharpenSawSlot(index);

                      return (
                        <div
                          key={index}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`h-9 rounded-full relative flex items-center transition-all ${
                            isDragOver
                              ? 'ring-2 ring-teal-400 ring-offset-1'
                              : ''
                          }`}
                          style={{
                            marginLeft: `${index * 5}px`,
                            marginRight: `${index * 5}px`,
                            backgroundColor: slot ? 'transparent' : (isDragOver ? 'rgb(204, 251, 241)' : 'rgb(229, 231, 235)'),
                            border: slot ? 'none' : '2px dashed rgb(156, 163, 175)',
                          }}
                        >
                          {slot ? (
                            /* Filled slot: show arc bar spanning ageStart-ageEnd */
                            <>
                              <div
                                className="absolute h-full rounded-full flex items-center px-2"
                                style={{
                                  left: `${ageToPercent(slot.ageStart)}%`,
                                  width: `${ageToPercent(slot.ageEnd) - ageToPercent(slot.ageStart)}%`,
                                  backgroundColor: color.bg,
                                  opacity: slot.intensity === 1 ? 0.5 : slot.intensity === 2 ? 0.75 : 1,
                                  minWidth: '60px',
                                }}
                              >
                                <span className="text-white text-xs font-medium truncate">
                                  {slot.roleName}
                                </span>
                              </div>

                              {/* Remove button (not for Sharpen the Saw) */}
                              {!isReadOnly && (
                                <button
                                  onClick={() => removeFromRainbow(index)}
                                  className="absolute right-2 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:text-red-500 text-xs z-10"
                                >
                                  x
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs w-full text-center">
                              {language === 'ko' ? `역할 ${index + 1} — 드롭하세요` : `Role ${index + 1} — drop here`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Slot detail editors */}
                  <div className="mt-6 space-y-2">
                    {Array.from({ length: 8 }, (_, index) => {
                      const slot = getSlot(index);
                      if (!slot) return null;
                      const color = RAINBOW_COLORS[index];
                      const isReadOnly = isSharpenSawSlot(index);
                      return (
                        <div key={index} className={`flex items-center gap-3 p-2 rounded-lg ${isReadOnly ? 'bg-purple-50' : 'bg-gray-50'}`}>
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color.bg }}
                          />
                          <span className="text-xs font-medium text-gray-700 w-32 truncate">
                            {slot.roleName}
                            {isReadOnly && <span className="ml-1 text-purple-500 text-xs">(auto)</span>}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">{language === 'ko' ? '시작' : 'Start'}</span>
                            <input
                              type="number"
                              min={10}
                              max={80}
                              value={slot.ageStart}
                              onChange={(e) => updateSlotField(index, 'ageStart', Number(e.target.value))}
                              disabled={isReadOnly}
                              className={`w-14 px-1 py-0.5 text-xs border border-gray-300 rounded text-center ${isReadOnly ? 'bg-gray-100 text-gray-400' : ''}`}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">{language === 'ko' ? '종료' : 'End'}</span>
                            <input
                              type="number"
                              min={10}
                              max={80}
                              value={slot.ageEnd}
                              onChange={(e) => updateSlotField(index, 'ageEnd', Number(e.target.value))}
                              disabled={isReadOnly}
                              className={`w-14 px-1 py-0.5 text-xs border border-gray-300 rounded text-center ${isReadOnly ? 'bg-gray-100 text-gray-400' : ''}`}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">{language === 'ko' ? '강도' : 'Intensity'}</span>
                            <select
                              value={slot.intensity}
                              onChange={(e) => updateSlotField(index, 'intensity', Number(e.target.value))}
                              disabled={isReadOnly}
                              className={`text-xs border border-gray-300 rounded px-1 py-0.5 ${isReadOnly ? 'bg-gray-100 text-gray-400' : ''}`}
                            >
                              <option value={1}>{language === 'ko' ? '낮음' : 'Low'}</option>
                              <option value={2}>{language === 'ko' ? '중간' : 'Medium'}</option>
                              <option value={3}>{language === 'ko' ? '높음' : 'High'}</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    Life Roles Rainbow — {placedCount}/7 {language === 'ko' ? '배치됨 (최소 3개)' : 'placed (min 3)'}
                  </p>
                </div>
              ) : (
                /* Table View */
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    {language === 'ko' ? '역할 테이블 뷰' : 'Role Table View'}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                            #
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                            {language === 'ko' ? '역할' : 'Role'}
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                            {language === 'ko' ? '시작 나이' : 'Start Age'}
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                            {language === 'ko' ? '종료 나이' : 'End Age'}
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                            {language === 'ko' ? '강도' : 'Intensity'}
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                            {language === 'ko' ? '작업' : 'Actions'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 8 }, (_, index) => {
                          const slot = getSlot(index);
                          const color = RAINBOW_COLORS[index];
                          const isReadOnly = isSharpenSawSlot(index);
                          return (
                            <tr key={index} className={slot ? (isReadOnly ? 'bg-purple-50' : 'bg-white') : 'bg-gray-50'}>
                              <td className="border border-gray-200 px-3 py-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: color.bg }}
                                />
                              </td>
                              <td className="border border-gray-200 px-3 py-2">
                                {slot ? (
                                  <span className="font-medium text-gray-900">
                                    {slot.roleName}
                                    {isReadOnly && <span className="ml-1 text-purple-500 text-xs">(auto)</span>}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs italic">
                                    {language === 'ko' ? '(비어있음)' : '(empty)'}
                                  </span>
                                )}
                              </td>
                              <td className="border border-gray-200 px-3 py-2">
                                {slot ? (
                                  <input
                                    type="number"
                                    min={10}
                                    max={80}
                                    value={slot.ageStart}
                                    onChange={(e) => updateSlotField(index, 'ageStart', Number(e.target.value))}
                                    disabled={isReadOnly}
                                    className={`w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center ${isReadOnly ? 'bg-gray-100 text-gray-400' : ''}`}
                                  />
                                ) : '-'}
                              </td>
                              <td className="border border-gray-200 px-3 py-2">
                                {slot ? (
                                  <input
                                    type="number"
                                    min={10}
                                    max={80}
                                    value={slot.ageEnd}
                                    onChange={(e) => updateSlotField(index, 'ageEnd', Number(e.target.value))}
                                    disabled={isReadOnly}
                                    className={`w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center ${isReadOnly ? 'bg-gray-100 text-gray-400' : ''}`}
                                  />
                                ) : '-'}
                              </td>
                              <td className="border border-gray-200 px-3 py-2">
                                {slot ? (
                                  <select
                                    value={slot.intensity}
                                    onChange={(e) => updateSlotField(index, 'intensity', Number(e.target.value))}
                                    disabled={isReadOnly}
                                    className={`text-sm border border-gray-300 rounded px-2 py-1 ${isReadOnly ? 'bg-gray-100 text-gray-400' : ''}`}
                                  >
                                    <option value={1}>{language === 'ko' ? '낮음' : 'Low'}</option>
                                    <option value={2}>{language === 'ko' ? '중간' : 'Medium'}</option>
                                    <option value={3}>{language === 'ko' ? '높음' : 'High'}</option>
                                  </select>
                                ) : '-'}
                              </td>
                              <td className="border border-gray-200 px-3 py-2">
                                {slot && !isReadOnly ? (
                                  <button
                                    onClick={() => removeFromRainbow(index)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                  >
                                    {language === 'ko' ? '제거' : 'Remove'}
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </ModuleCard>
          </div>
        </div>

        {/* Notes */}
        <ModuleCard padding="normal">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-semibold text-gray-700">
              {language === 'ko' ? '메모 (선택사항)' : 'Notes (Optional)'}
            </h4>
          </div>
          <textarea
            value={rainbowData.notes}
            onChange={(e) => setRainbowData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder={language === 'ko'
              ? '인생 무지개에 대한 생각이나 통찰을 자유롭게 적어보세요...'
              : 'Freely write your thoughts or insights about your life rainbow...'}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </ModuleCard>

        {/* Progress Summary */}
        <ModuleCard padding="normal" className={placedCount >= 3 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
          <div className="flex items-center justify-between">
            <p className={placedCount >= 3 ? 'text-green-700' : 'text-gray-600'}>
              {language === 'ko'
                ? `${placedCount}/7 역할 배치 완성 (최소 3개 필요)`
                : `${placedCount}/7 roles placed (minimum 3 required)`}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: 8 }, (_, i) => {
                const placed = !!getSlot(i);
                return (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: placed ? RAINBOW_COLORS[i].bg : 'rgb(209, 213, 219)' }}
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
              disabled={saving || placedCount < 3}
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
