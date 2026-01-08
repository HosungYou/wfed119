'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, Heart, Briefcase, Compass } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface ValueItem {
  type: 'terminal' | 'instrumental' | 'work';
  name: string;
  relevance: string;
  selected: boolean;
}

const STEPS = [
  { id: 'step1', label: 'Values Review', labelKo: '가치관 검토' },
  { id: 'step2', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step3', label: 'Self-Role Reflection', labelKo: '자기 역할 성찰' },
  { id: 'step4', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step5', label: 'Mission Statement', labelKo: '사명 선언문' },
];

export default function MissionStep1() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [selectedValues, setSelectedValues] = useState<ValueItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Get context (values from previous module)
      const contextRes = await fetch('/api/discover/mission/context');
      const contextData = await contextRes.json();
      setContext(contextData);

      // Get existing session to restore selections
      const sessionRes = await fetch('/api/discover/mission/session');
      const sessionData = await sessionRes.json();

      if (sessionData.values_used && sessionData.values_used.length > 0) {
        setSelectedValues(sessionData.values_used);
      } else {
        // Pre-populate with user's values
        const initialValues: ValueItem[] = [];

        if (contextData.values?.terminal?.top3) {
          contextData.values.terminal.top3.slice(0, 3).forEach((v: string) => {
            initialValues.push({ type: 'terminal', name: v, relevance: '', selected: false });
          });
        }
        if (contextData.values?.instrumental?.top3) {
          contextData.values.instrumental.top3.slice(0, 3).forEach((v: string) => {
            initialValues.push({ type: 'instrumental', name: v, relevance: '', selected: false });
          });
        }
        if (contextData.values?.work?.top3) {
          contextData.values.work.top3.slice(0, 3).forEach((v: string) => {
            initialValues.push({ type: 'work', name: v, relevance: '', selected: false });
          });
        }

        setSelectedValues(initialValues);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 1] Error:', error);
      setLoading(false);
    }
  }

  function toggleValue(index: number) {
    setSelectedValues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  }

  function updateRelevance(index: number, relevance: string) {
    setSelectedValues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], relevance };
      return updated;
    });
  }

  async function handleNext() {
    const selected = selectedValues.filter(v => v.selected);
    if (selected.length < 3) {
      alert(language === 'ko'
        ? '최소 3개의 가치를 선택해주세요.'
        : 'Please select at least 3 values.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 2,
          values_used: selected,
        }),
      });

      router.push('/discover/mission/step2');
    } catch (error) {
      console.error('[Mission Step 1] Save error:', error);
      alert(language === 'ko' ? '저장 실패. 다시 시도해주세요.' : 'Save failed. Please try again.');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 1, []);

  const getValueTypeIcon = (type: string) => {
    switch (type) {
      case 'terminal': return <Compass className="w-4 h-4 text-purple-600" />;
      case 'instrumental': return <Heart className="w-4 h-4 text-rose-600" />;
      case 'work': return <Briefcase className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  const getValueTypeLabel = (type: string) => {
    if (language === 'ko') {
      switch (type) {
        case 'terminal': return '궁극적 가치';
        case 'instrumental': return '수단적 가치';
        case 'work': return '직업 가치';
        default: return type;
      }
    }
    switch (type) {
      case 'terminal': return 'Terminal';
      case 'instrumental': return 'Instrumental';
      case 'work': return 'Work';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  const selectedCount = selectedValues.filter(v => v.selected).length;

  return (
    <ModuleShell
      moduleId="mission"
      currentStep={1}
      totalSteps={5}
      title={language === 'ko' ? '가치관 검토' : 'Values Review'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Instruction Card */}
        <ModuleCard padding="normal">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '사명에 반영할 가치관 선택' : 'Select Values for Your Mission'}
          </h2>
          <p className="text-gray-600">
            {language === 'ko'
              ? '가치관 모듈에서 발견한 핵심 가치들입니다. 사명 선언문에 반영하고 싶은 가치를 최소 3개 선택하고, 왜 중요한지 간단히 적어주세요.'
              : 'These are your core values from the Values module. Select at least 3 values to include in your mission statement and briefly explain why they matter.'}
          </p>
        </ModuleCard>

        {/* Values Selection */}
        {!context?.values ? (
          <ModuleCard padding="normal" className="bg-amber-50 border-amber-200">
            <p className="text-amber-800">
              {language === 'ko'
                ? '⚠️ 가치관 데이터가 없습니다. 가치관 모듈을 먼저 완료해주세요.'
                : '⚠️ No values data found. Please complete the Values module first.'}
            </p>
            <ModuleButton
              onClick={() => router.push('/discover/values')}
              variant="secondary"
              className="mt-4"
            >
              {language === 'ko' ? '가치관 모듈로 이동' : 'Go to Values Module'}
            </ModuleButton>
          </ModuleCard>
        ) : (
          <div className="space-y-4">
            {/* Terminal Values */}
            {selectedValues.filter(v => v.type === 'terminal').length > 0 && (
              <ModuleCard padding="normal">
                <div className="flex items-center gap-2 mb-4">
                  <Compass className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">
                    {language === 'ko' ? '궁극적 가치 (삶의 목표)' : 'Terminal Values (Life Goals)'}
                  </h3>
                </div>
                <div className="space-y-3">
                  {selectedValues.map((value, index) => value.type === 'terminal' && (
                    <ValueSelector
                      key={index}
                      value={value}
                      onToggle={() => toggleValue(index)}
                      onRelevanceChange={(r) => updateRelevance(index, r)}
                      language={language}
                    />
                  ))}
                </div>
              </ModuleCard>
            )}

            {/* Instrumental Values */}
            {selectedValues.filter(v => v.type === 'instrumental').length > 0 && (
              <ModuleCard padding="normal">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-rose-600" />
                  <h3 className="font-semibold text-gray-900">
                    {language === 'ko' ? '수단적 가치 (행동 원칙)' : 'Instrumental Values (Behaviors)'}
                  </h3>
                </div>
                <div className="space-y-3">
                  {selectedValues.map((value, index) => value.type === 'instrumental' && (
                    <ValueSelector
                      key={index}
                      value={value}
                      onToggle={() => toggleValue(index)}
                      onRelevanceChange={(r) => updateRelevance(index, r)}
                      language={language}
                    />
                  ))}
                </div>
              </ModuleCard>
            )}

            {/* Work Values */}
            {selectedValues.filter(v => v.type === 'work').length > 0 && (
              <ModuleCard padding="normal">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    {language === 'ko' ? '직업 가치 (일에서 중요한 것)' : 'Work Values (Career Priorities)'}
                  </h3>
                </div>
                <div className="space-y-3">
                  {selectedValues.map((value, index) => value.type === 'work' && (
                    <ValueSelector
                      key={index}
                      value={value}
                      onToggle={() => toggleValue(index)}
                      onRelevanceChange={(r) => updateRelevance(index, r)}
                      language={language}
                    />
                  ))}
                </div>
              </ModuleCard>
            )}
          </div>
        )}

        {/* Selection Summary */}
        <ModuleCard padding="normal" className={selectedCount >= 3 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
          <div className="flex items-center justify-between">
            <p className={selectedCount >= 3 ? 'text-green-800' : 'text-gray-600'}>
              {language === 'ko'
                ? `${selectedCount}개 선택됨 (최소 3개 필요)`
                : `${selectedCount} selected (minimum 3 required)`}
            </p>
            {selectedCount >= 3 && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
        </ModuleCard>

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => router.push('/discover/mission')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '뒤로' : 'Back'}
          </ModuleButton>
          <ModuleButton
            onClick={handleNext}
            disabled={saving || selectedCount < 3}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {language === 'ko' ? '다음 단계' : 'Next Step'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}

function ValueSelector({
  value,
  onToggle,
  onRelevanceChange,
  language,
}: {
  value: ValueItem;
  onToggle: () => void;
  onRelevanceChange: (r: string) => void;
  language: string;
}) {
  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      value.selected
        ? 'bg-teal-50 border-teal-300'
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value.selected}
          onChange={onToggle}
          className="w-5 h-5 mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <div className="flex-1">
          <p className="font-medium text-gray-900">{value.name}</p>
          {value.selected && (
            <input
              type="text"
              value={value.relevance}
              onChange={(e) => onRelevanceChange(e.target.value)}
              placeholder={language === 'ko' ? '이 가치가 왜 중요한가요?' : 'Why is this value important?'}
              className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </label>
    </div>
  );
}
