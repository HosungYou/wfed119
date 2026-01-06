'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Plus, Minus, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface ExploredCareer {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  requirements: string;
  notes: string;
  interestLevel: number;
  userAdded: boolean;
}

const STEPS = [
  { id: 'step1', label: 'Holland Assessment', labelKo: 'Holland 적성 검사' },
  { id: 'step2', label: 'AI Career Suggestions', labelKo: 'AI 경력 추천' },
  { id: 'step3', label: 'Career Research', labelKo: '경력 조사' },
  { id: 'step4', label: 'Career Comparison', labelKo: '경력 비교' },
];

export default function CareerOptionsStep3() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [careers, setCareers] = useState<ExploredCareer[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/career-options/session');
      const data = await res.json();

      if (data.current_step < 3) {
        router.push(`/discover/career-options/step${data.current_step}`);
        return;
      }

      if (data.explored_careers && data.explored_careers.length > 0) {
        setCareers(data.explored_careers);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Career Step 3] Error:', error);
      setLoading(false);
    }
  }

  function updateCareer(index: number, updates: Partial<ExploredCareer>) {
    setCareers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }

  function addPro(index: number) {
    const newPros = [...careers[index].pros, ''];
    updateCareer(index, { pros: newPros });
  }

  function updatePro(careerIndex: number, proIndex: number, value: string) {
    const newPros = [...careers[careerIndex].pros];
    newPros[proIndex] = value;
    updateCareer(careerIndex, { pros: newPros });
  }

  function removePro(careerIndex: number, proIndex: number) {
    const newPros = careers[careerIndex].pros.filter((_, i) => i !== proIndex);
    updateCareer(careerIndex, { pros: newPros });
  }

  function addCon(index: number) {
    const newCons = [...careers[index].cons, ''];
    updateCareer(index, { cons: newCons });
  }

  function updateCon(careerIndex: number, conIndex: number, value: string) {
    const newCons = [...careers[careerIndex].cons];
    newCons[conIndex] = value;
    updateCareer(careerIndex, { cons: newCons });
  }

  function removeCon(careerIndex: number, conIndex: number) {
    const newCons = careers[careerIndex].cons.filter((_, i) => i !== conIndex);
    updateCareer(careerIndex, { cons: newCons });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/discover/career-options/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ explored_careers: careers }),
      });
      alert(language === 'ko' ? '저장됨!' : 'Saved!');
    } catch (error) {
      console.error('[Career Step 3] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    // Check if at least basic research is done
    const researched = careers.filter(c => c.pros.length > 0 || c.cons.length > 0 || c.notes);
    if (researched.length < 3) {
      alert(language === 'ko'
        ? '최소 3개 경력에 대해 장단점을 작성해주세요.'
        : 'Please research at least 3 careers with pros/cons.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/career-options/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 4,
          explored_careers: careers,
        }),
      });

      router.push('/discover/career-options/step4');
    } catch (error) {
      console.error('[Career Step 3] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/career-options', 3, [1, 2]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <ModuleShell
      moduleId="career-options"
      currentStep={3}
      totalSteps={4}
      title={language === 'ko' ? '경력 조사' : 'Career Research'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Instructions */}
        <ModuleCard padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'ko' ? '선택한 경력 심층 탐색' : 'Deep Dive into Selected Careers'}
          </h2>
          <p className="text-sm text-gray-600">
            {language === 'ko'
              ? '각 경력에 대해 장점, 단점, 요구 사항을 조사하고 기록하세요.'
              : 'Research and document the pros, cons, and requirements for each career.'}
          </p>
        </ModuleCard>

        {/* Career Research Cards */}
        <div className="space-y-4">
          {careers.map((career, index) => {
            const isExpanded = expandedIndex === index;
            const hasContent = career.pros.length > 0 || career.cons.length > 0 || career.notes;

            return (
              <ModuleCard
                key={index}
                padding="none"
                className={hasContent ? 'border-indigo-200' : ''}
              >
                {/* Header */}
                <div
                  className={`px-6 py-4 cursor-pointer flex items-center justify-between ${
                    isExpanded ? 'border-b border-gray-200' : ''
                  }`}
                  onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{career.title}</h3>
                    <p className="text-sm text-gray-500">{career.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasContent && (
                      <span className="text-xs text-indigo-600 font-medium">
                        {language === 'ko' ? '조사 완료' : 'Researched'}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 py-4 space-y-6">
                    {/* Interest Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ko' ? '관심도' : 'Interest Level'}
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(level => (
                          <button
                            key={level}
                            onClick={() => updateCareer(index, { interestLevel: level })}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${
                              career.interestLevel >= level
                                ? 'bg-indigo-500 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pros */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-green-700">
                          {language === 'ko' ? '장점' : 'Pros'} ({career.pros.length})
                        </label>
                        <button
                          onClick={() => addPro(index)}
                          className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          {language === 'ko' ? '추가' : 'Add'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {career.pros.map((pro, proIndex) => (
                          <div key={proIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={pro}
                              onChange={(e) => updatePro(index, proIndex, e.target.value)}
                              placeholder={language === 'ko' ? '장점 입력...' : 'Enter a pro...'}
                              className="flex-1 px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50"
                            />
                            <button
                              onClick={() => removePro(index, proIndex)}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {career.pros.length === 0 && (
                          <p className="text-sm text-gray-400 italic">
                            {language === 'ko' ? '장점을 추가하세요' : 'Add pros for this career'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cons */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-red-700">
                          {language === 'ko' ? '단점' : 'Cons'} ({career.cons.length})
                        </label>
                        <button
                          onClick={() => addCon(index)}
                          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          {language === 'ko' ? '추가' : 'Add'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {career.cons.map((con, conIndex) => (
                          <div key={conIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={con}
                              onChange={(e) => updateCon(index, conIndex, e.target.value)}
                              placeholder={language === 'ko' ? '단점 입력...' : 'Enter a con...'}
                              className="flex-1 px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50"
                            />
                            <button
                              onClick={() => removeCon(index, conIndex)}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {career.cons.length === 0 && (
                          <p className="text-sm text-gray-400 italic">
                            {language === 'ko' ? '단점을 추가하세요' : 'Add cons for this career'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Requirements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ko' ? '요구 사항 (학위, 자격증 등)' : 'Requirements (degree, certifications, etc.)'}
                      </label>
                      <textarea
                        value={career.requirements}
                        onChange={(e) => updateCareer(index, { requirements: e.target.value })}
                        placeholder={language === 'ko' ? '이 경력에 필요한 요구 사항을 기록하세요...' : 'Note down requirements for this career...'}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ko' ? '메모' : 'Notes'}
                      </label>
                      <textarea
                        value={career.notes}
                        onChange={(e) => updateCareer(index, { notes: e.target.value })}
                        placeholder={language === 'ko' ? '추가 메모...' : 'Additional notes...'}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </ModuleCard>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <ModuleButton
            onClick={() => router.push('/discover/career-options/step2')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <div className="flex gap-3">
            <ModuleButton onClick={handleSave} variant="ghost" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {language === 'ko' ? '저장' : 'Save'}
            </ModuleButton>
            <ModuleButton
              onClick={handleNext}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {language === 'ko' ? '경력 비교' : 'Compare Careers'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </ModuleButton>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
