'use client';

import { useEffect, useState, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Sparkles, GripVertical, Plus, X, Users, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface LifeRole {
  id: string;
  entity: string;
  role: string;
}

interface SuggestedRole {
  id: string;
  entity: string;
  entityKo: string;
  role: string;
  roleKo: string;
  source?: string;
}

const STEPS = [
  { id: 'step1', label: 'Values Review', labelKo: '가치관 검토' },
  { id: 'step2', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step3', label: 'Self-Role Reflection', labelKo: '자기 역할 성찰' },
  { id: 'step4', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step5', label: 'Mission Statement', labelKo: '사명 선언문' },
];

const DEFAULT_SUGGESTIONS: SuggestedRole[] = [
  { id: 's1', entity: 'Family', entityKo: '가족', role: 'Son/Daughter', roleKo: '자녀', source: 'default' },
  { id: 's2', entity: 'Workplace', entityKo: '직장', role: 'Team Member', roleKo: '팀원', source: 'default' },
  { id: 's3', entity: 'Friends', entityKo: '친구들', role: 'Friend', roleKo: '친구', source: 'default' },
  { id: 's4', entity: 'School', entityKo: '학교', role: 'Student', roleKo: '학생', source: 'default' },
  { id: 's5', entity: 'Community', entityKo: '지역사회', role: 'Citizen', roleKo: '시민', source: 'default' },
  { id: 's6', entity: 'Church/Religion', entityKo: '종교단체', role: 'Member', roleKo: '신자', source: 'default' },
  { id: 's7', entity: 'Partner', entityKo: '파트너', role: 'Spouse/Partner', roleKo: '배우자', source: 'default' },
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

export default function MissionStep2() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lifeRoles, setLifeRoles] = useState<(LifeRole | null)[]>(Array(7).fill(null));
  const [suggestions, setSuggestions] = useState<SuggestedRole[]>(DEFAULT_SUGGESTIONS);
  const [aiLoading, setAiLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<SuggestedRole | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [customEntity, setCustomEntity] = useState('');
  const [customRole, setCustomRole] = useState('');

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

      // Load existing life roles
      if (data.life_roles && data.life_roles.length > 0) {
        const loadedRoles: (LifeRole | null)[] = Array(7).fill(null);
        data.life_roles.forEach((role: LifeRole, idx: number) => {
          if (idx < 7) loadedRoles[idx] = role;
        });
        setLifeRoles(loadedRoles);
      }

      setLoading(false);

      // Load AI suggestions
      loadAISuggestions();
    } catch (error) {
      console.error('[Mission Step 2] Error:', error);
      setLoading(false);
    }
  }

  async function loadAISuggestions() {
    setAiLoading(true);
    try {
      const res = await fetch('/api/discover/mission/ai-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'suggest_roles' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestions && data.suggestions.length > 0) {
          const aiSuggestions = data.suggestions.map((s: any, i: number) => ({
            id: `ai_${i}`,
            entity: s.entity,
            entityKo: s.entityKo || s.entity,
            role: s.role,
            roleKo: s.roleKo || s.role,
            source: 'ai',
          }));
          // Merge with defaults, prioritize AI suggestions
          setSuggestions([...aiSuggestions, ...DEFAULT_SUGGESTIONS.slice(aiSuggestions.length)]);
        }
      }
    } catch (error) {
      console.error('[Mission Step 2] AI suggestions error:', error);
    } finally {
      setAiLoading(false);
    }
  }

  // Drag and Drop handlers
  function handleDragStart(e: DragEvent, item: SuggestedRole) {
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
  const filledCount = lifeRoles.filter(r => r !== null).length;

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
              ? '왼쪽의 역할 카드를 드래그하여 오른쪽 다이어그램의 원에 배치하세요. "나"를 중심으로 4~7개의 관계를 매핑합니다.'
              : 'Drag role cards from the left and drop them onto the circles in the diagram. Map 4-7 relationships with "Self" at the center.'}
          </p>
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
            <p className="text-sm text-teal-800">
              {language === 'ko'
                ? '💡 드래그 앤 드롭: 카드를 원하는 위치의 원에 놓으세요'
                : '💡 Drag & Drop: Place cards onto the circles where you want them'}
            </p>
          </div>
        </ModuleCard>

        {/* Main Interactive Area */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Draggable Role Cards - Left Side */}
          <div className="lg:col-span-2">
            <ModuleCard padding="normal">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  {language === 'ko' ? '역할 카드' : 'Role Cards'}
                </h3>
                <button
                  onClick={loadAISuggestions}
                  disabled={aiLoading}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                >
                  {aiLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  {language === 'ko' ? 'AI 제안' : 'AI Suggest'}
                </button>
              </div>

              {/* AI Suggestions */}
              <div className="space-y-2 mb-4">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 bg-white border rounded-lg cursor-grab active:cursor-grabbing flex items-center gap-3 transition-all hover:shadow-md hover:border-teal-400 ${
                      item.source === 'ai' ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {language === 'ko' ? item.entityKo : item.entity}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {language === 'ko' ? `역할: ${item.roleKo}` : `Role: ${item.role}`}
                      </p>
                    </div>
                    {item.source === 'ai' && (
                      <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Custom Role Input */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {language === 'ko' ? '직접 추가' : 'Add Custom'}
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customEntity}
                    onChange={(e) => setCustomEntity(e.target.value)}
                    placeholder={language === 'ko' ? '대상/그룹' : 'Entity/Group'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder={language === 'ko' ? '나의 역할' : 'My Role'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={addCustomRole}
                    className="w-full py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    {language === 'ko' ? '추가' : 'Add'}
                  </button>
                </div>
              </div>
            </ModuleCard>
          </div>

          {/* Drop Zone Diagram - Right Side */}
          <div className="lg:col-span-3">
            <ModuleCard padding="normal" className="bg-gradient-to-br from-gray-50 to-teal-50 min-h-[500px]">
              <h3 className="font-semibold text-gray-900 text-center mb-4">
                {language === 'ko' ? '관계 다이어그램' : 'Relationship Diagram'}
              </h3>

              <div className="relative flex items-center justify-center h-[420px]">
                {/* Center - Me */}
                <div className="absolute w-24 h-24 bg-teal-600 rounded-full flex items-center justify-center shadow-lg z-20">
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
                      stroke={lifeRoles[idx] ? '#0d9488' : '#d1d5db'}
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
                        ? 'bg-white border-2 border-teal-500 shadow-md'
                        : dragOverIndex === idx
                        ? 'bg-teal-100 border-2 border-teal-400 border-dashed scale-110'
                        : 'bg-white/80 border-2 border-dashed border-gray-300 hover:border-teal-400'
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
                        <p className="text-xs text-teal-600 text-center px-2 truncate w-full">
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
