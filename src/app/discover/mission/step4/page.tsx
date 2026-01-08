'use client';

import { useEffect, useState, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, ClipboardList, HelpCircle, Users, Target, GripVertical, Sparkles, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface RoleCommitment {
  role: string;
  commitment: string;
}

interface LifeRole {
  id: string;
  entity: string;
  role: string;
}

interface RainbowSlot {
  role: LifeRole | null;
  ageRange: string;
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

const RAINBOW_COLORS = [
  'rgb(239, 68, 68)',   // red
  'rgb(249, 115, 22)',  // orange
  'rgb(234, 179, 8)',   // yellow
  'rgb(34, 197, 94)',   // green
  'rgb(59, 130, 246)',  // blue
  'rgb(139, 92, 246)',  // purple
  'rgb(236, 72, 153)',  // pink
  'rgb(20, 184, 166)',  // teal
];

export default function MissionStep4() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [lifeRoles, setLifeRoles] = useState<LifeRole[]>([]);
  const [rainbowSlots, setRainbowSlots] = useState<RainbowSlot[]>(
    Array(8).fill(null).map((_, i) => ({ role: null, ageRange: `${AGE_MARKERS[i] || 80}+` }))
  );
  const [roleCommitments, setRoleCommitments] = useState<RoleCommitment[]>([]);
  const [wellbeingCommitments, setWellbeingCommitments] = useState<Record<string, string>>({});
  const [currentAge, setCurrentAge] = useState<number>(25);
  const [draggedRole, setDraggedRole] = useState<LifeRole | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});

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

      // Load life roles from session
      if (data.life_roles && data.life_roles.length > 0) {
        setLifeRoles(data.life_roles);

        // Initialize role commitments
        const existingCommitments = data.role_commitments || [];
        const commitments = data.life_roles.map((lr: any) => {
          const existing = existingCommitments.find((c: any) => c.role === lr.role);
          return {
            role: lr.role,
            commitment: existing?.commitment || '',
          };
        });
        setRoleCommitments(commitments);

        // Initialize rainbow slots with existing roles
        const slots: RainbowSlot[] = Array(8).fill(null).map((_, i) => ({
          role: i < data.life_roles.length ? data.life_roles[i] : null,
          ageRange: `${AGE_MARKERS[i] || 80}+`
        }));
        setRainbowSlots(slots);
      }

      // Initialize wellbeing commitments
      if (data.wellbeing_commitments) {
        setWellbeingCommitments(data.wellbeing_commitments);
      } else if (data.wellbeing_reflections) {
        setWellbeingCommitments(data.wellbeing_reflections);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 4] Error:', error);
      setLoading(false);
    }
  }

  // Drag and Drop for Rainbow
  function handleDragStart(e: DragEvent, role: LifeRole) {
    setDraggedRole(role);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    setDraggedRole(null);
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
    if (draggedRole) {
      const newSlots = [...rainbowSlots];
      newSlots[index] = { ...newSlots[index], role: draggedRole };
      setRainbowSlots(newSlots);
    }
    setDraggedRole(null);
    setDragOverIndex(null);
  }

  function removeFromRainbow(index: number) {
    const newSlots = [...rainbowSlots];
    newSlots[index] = { ...newSlots[index], role: null };
    setRainbowSlots(newSlots);
  }

  // AI Commitment Suggestions
  async function loadAICommitmentSuggestions() {
    setAiLoading(true);
    try {
      const res = await fetch('/api/discover/mission/ai-commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'suggest_commitments',
          lifeRoles: lifeRoles,
          wellbeingReflections: session?.wellbeing_reflections || {},
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestions) {
          setAiSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('[Mission Step 4] AI suggestions error:', error);
    } finally {
      setAiLoading(false);
    }
  }

  function applyAISuggestion(key: string, isWellbeing: boolean) {
    const suggestion = aiSuggestions[key];
    if (!suggestion) return;

    if (isWellbeing) {
      setWellbeingCommitments(prev => ({ ...prev, [key]: suggestion }));
    } else {
      const index = roleCommitments.findIndex(rc => rc.role === key);
      if (index !== -1) {
        updateRoleCommitment(index, suggestion);
      }
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
  const rainbowFilledCount = rainbowSlots.filter(s => s.role !== null).length;

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
        {/* Life Rainbow Visualization with Drag & Drop */}
        <ModuleCard padding="normal">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '3. 삶의 역할 목록 (Life Roles Rainbow)' : '3. List Up All of Your Life Roles (Rainbow)'}
          </h2>
          <p className="text-gray-600 mb-4">
            {language === 'ko'
              ? '왼쪽의 역할 카드를 드래그하여 무지개 아크에 배치하세요. 나이대별로 어떤 역할이 중요해지는지 시각화합니다.'
              : 'Drag role cards from the left onto the rainbow arcs. Visualize which roles become important at different life stages.'}
          </p>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Draggable Role Cards */}
            <div className="lg:col-span-1">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {language === 'ko' ? '역할 카드' : 'Role Cards'}
                </h4>
                <div className="space-y-2">
                  {/* Sharpen the Saw card */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, { id: 'sharpen', entity: 'Self', role: 'Sharpen the Saw' })}
                    onDragEnd={handleDragEnd}
                    className="p-2 bg-purple-100 border border-purple-300 rounded-lg cursor-grab active:cursor-grabbing flex items-center gap-2"
                  >
                    <GripVertical className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-800 font-medium">Sharpen the Saw</span>
                  </div>
                  {/* Life roles */}
                  {lifeRoles.map((role) => (
                    <div
                      key={role.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, role)}
                      onDragEnd={handleDragEnd}
                      className="p-2 bg-white border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing flex items-center gap-2 hover:border-teal-400"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{role.entity}</p>
                        <p className="text-xs text-gray-500 truncate">{role.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rainbow Drop Zones */}
            <div className="lg:col-span-2">
              <div className="p-4 bg-gradient-to-br from-gray-50 to-teal-50 rounded-lg">
                {/* Age labels */}
                <div className="flex justify-between mb-2 px-4">
                  {AGE_MARKERS.map((age) => (
                    <span key={age} className="text-xs text-gray-500 font-medium">{age}</span>
                  ))}
                </div>

                {/* Rainbow arcs as drop zones */}
                <div className="relative space-y-1">
                  {rainbowSlots.map((slot, index) => (
                    <div
                      key={index}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`h-8 rounded-full flex items-center justify-center transition-all ${
                        slot.role
                          ? 'bg-opacity-80'
                          : dragOverIndex === index
                          ? 'bg-teal-200 border-2 border-dashed border-teal-400'
                          : 'bg-gray-200 border-2 border-dashed border-gray-300'
                      }`}
                      style={{
                        backgroundColor: slot.role ? RAINBOW_COLORS[index] : undefined,
                        marginLeft: `${index * 8}px`,
                        marginRight: `${index * 8}px`,
                      }}
                    >
                      {slot.role ? (
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-medium px-2 truncate max-w-[150px]">
                            {slot.role.role === 'Sharpen the Saw' ? 'Sharpen the Saw' : `${slot.role.entity}: ${slot.role.role}`}
                          </span>
                          <button
                            onClick={() => removeFromRainbow(index)}
                            className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/50"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {language === 'ko' ? `역할 ${index + 1}` : `Role ${index + 1}`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-center text-xs text-gray-500 mt-3">
                  Life Roles Rainbow (Super, 1980) - {rainbowFilledCount}/8 {language === 'ko' ? '배치됨' : 'placed'}
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 p-3 bg-gray-100 rounded-lg mt-4">
            <span className="font-medium">{language === 'ko' ? '출처: ' : 'Source: '}</span>
            Super, D. E. (1980). A life-span, life-space approach to career development. <em>Journal of Vocational Behavior, 16</em>(3), 282-298.
          </div>
        </ModuleCard>

        {/* Roles & Commitment Table with AI Suggestions */}
        <ModuleCard padding="normal">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-gray-900">
                {language === 'ko' ? '4. 역할 및 헌신 (R&C) 테이블' : '4. Completing Roles and Commitment (R&C) Table'}
              </h3>
            </div>
            <button
              onClick={loadAICommitmentSuggestions}
              disabled={aiLoading}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {language === 'ko' ? 'AI 제안 받기' : 'Get AI Suggestions'}
            </button>
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
                        <div className="flex items-center justify-between">
                          <span>{language === 'ko' ? dim.labelKo : dim.label}</span>
                          {aiSuggestions[dim.key] && (
                            <button
                              onClick={() => applyAISuggestion(dim.key, true)}
                              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              {language === 'ko' ? '적용' : 'Apply'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-200 p-1 bg-white">
                        <input
                          type="text"
                          value={wellbeingCommitments[dim.key] || ''}
                          onChange={(e) => updateWellbeingCommitment(dim.key, e.target.value)}
                          placeholder={
                            aiSuggestions[dim.key]
                              ? `AI: ${aiSuggestions[dim.key].substring(0, 50)}...`
                              : language === 'ko' ? '헌신 내용 입력...' : 'Enter commitment...'
                          }
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
                        <div className="flex items-center justify-between">
                          <span>{rc.role}</span>
                          {aiSuggestions[rc.role] && (
                            <button
                              onClick={() => applyAISuggestion(rc.role, false)}
                              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              {language === 'ko' ? '적용' : 'Apply'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-200 p-1 bg-white">
                        <input
                          type="text"
                          value={rc.commitment}
                          onChange={(e) => updateRoleCommitment(index, e.target.value)}
                          placeholder={
                            aiSuggestions[rc.role]
                              ? `AI: ${aiSuggestions[rc.role].substring(0, 50)}...`
                              : language === 'ko' ? '이 역할에 대한 헌신...' : 'Your commitment to this role...'
                          }
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
