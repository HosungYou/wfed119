'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Compass, ArrowRight, ArrowLeft, Plus, Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface Objective {
  id: string;
  role_id: string;
  objective_number: number;
  objective_text: string;
  goal_key_results?: KeyResult[];
}

interface KeyResult {
  id?: string;
  objective_id: string;
  key_result_number: number;
  key_result_text: string;
  success_criteria: string;
  deadline: string;
  status: string;
  progress_percentage: number;
}

interface Role {
  id: string;
  role_name: string;
  goal_objectives?: Objective[];
}

export default function GoalKeyResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [keyResults, setKeyResults] = useState<Record<string, KeyResult[]>>({});
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/goals/roles');
      const rolesData = await res.json();
      setRoles(rolesData);

      // Initialize key results from objectives
      const krMap: Record<string, KeyResult[]> = {};
      rolesData.forEach((role: Role) => {
        role.goal_objectives?.forEach((obj: Objective) => {
          krMap[obj.id] = obj.goal_key_results?.length
            ? obj.goal_key_results
            : [{
                objective_id: obj.id,
                key_result_number: 1,
                key_result_text: '',
                success_criteria: '',
                deadline: '',
                status: 'not_started',
                progress_percentage: 0,
              }];
        });
      });
      setKeyResults(krMap);

      // Expand first objective
      const firstObj = rolesData[0]?.goal_objectives?.[0];
      if (firstObj) {
        setExpandedObjective(firstObj.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Goal Key Results] Error:', error);
      setLoading(false);
    }
  }

  function updateKeyResult(objectiveId: string, index: number, updates: Partial<KeyResult>) {
    setKeyResults(prev => ({
      ...prev,
      [objectiveId]: prev[objectiveId].map((kr, i) =>
        i === index ? { ...kr, ...updates } : kr
      ),
    }));
  }

  function addKeyResult(objectiveId: string) {
    const current = keyResults[objectiveId] || [];
    if (current.length >= 3) return;

    setKeyResults(prev => ({
      ...prev,
      [objectiveId]: [...prev[objectiveId], {
        objective_id: objectiveId,
        key_result_number: prev[objectiveId].length + 1,
        key_result_text: '',
        success_criteria: '',
        deadline: '',
        status: 'not_started',
        progress_percentage: 0,
      }],
    }));
  }

  function removeKeyResult(objectiveId: string, index: number) {
    const current = keyResults[objectiveId] || [];
    if (current.length <= 1) return;

    setKeyResults(prev => ({
      ...prev,
      [objectiveId]: prev[objectiveId].filter((_, i) => i !== index).map((kr, i) => ({
        ...kr,
        key_result_number: i + 1,
      })),
    }));
  }

  async function handleSave() {
    setSaving(true);

    try {
      for (const objectiveId of Object.keys(keyResults)) {
        const objKeyResults = keyResults[objectiveId].filter(kr => kr.key_result_text.trim());
        if (objKeyResults.length > 0) {
          await fetch('/api/goals/key-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              objective_id: objectiveId,
              key_results: objKeyResults,
            }),
          });
        }
      }

      router.push('/discover/goals/actions');
    } catch (error) {
      console.error('[Goal Key Results] Error saving:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/discover/goals/objectives')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            목표 수립으로 돌아가기
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">3. 핵심 결과 (Key Results)</h1>
              <p className="text-sm text-gray-500">각 목표에 대해 측정 가능한 핵심 결과를 정의하세요</p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> 핵심 결과(KR)는 목표 달성 여부를 측정하는 구체적인 지표입니다.
            각 목표당 1-3개의 KR을 설정하고, 달성 기한과 성공 기준을 명확히 하세요.
          </p>
        </div>

        {/* Objectives with Key Results */}
        <div className="space-y-4 mb-6">
          {roles.map((role) => (
            role.goal_objectives?.map((obj) => (
              <div key={obj.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => setExpandedObjective(expandedObjective === obj.id ? null : obj.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      O{obj.objective_number}
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-purple-600 font-medium">{role.role_name}</p>
                      <h3 className="font-medium text-gray-900 line-clamp-1">
                        {obj.objective_text || '(목표 없음)'}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-600 font-medium">
                      {keyResults[obj.id]?.filter(kr => kr.key_result_text.trim()).length || 0} KR
                    </span>
                    {expandedObjective === obj.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedObjective === obj.id && (
                  <div className="p-4 border-t border-gray-100 space-y-4">
                    {keyResults[obj.id]?.map((kr, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-bold text-purple-600">KR{index + 1}</span>
                          {keyResults[obj.id].length > 1 && (
                            <button
                              onClick={() => removeKeyResult(obj.id, index)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <textarea
                          value={kr.key_result_text}
                          onChange={(e) => updateKeyResult(obj.id, index, { key_result_text: e.target.value })}
                          placeholder="예: 매일 7시간 이상 수면하기"
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-purple-500 outline-none resize-none"
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">성공 기준</label>
                            <input
                              type="text"
                              value={kr.success_criteria}
                              onChange={(e) => updateKeyResult(obj.id, index, { success_criteria: e.target.value })}
                              placeholder="예: 30일 중 25일 이상 달성"
                              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">목표 달성일</label>
                            <div className="relative">
                              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="date"
                                value={kr.deadline}
                                onChange={(e) => updateKeyResult(obj.id, index, { deadline: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg p-2 pl-8 text-sm focus:border-purple-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(keyResults[obj.id]?.length || 0) < 3 && (
                      <button
                        onClick={() => addKeyResult(obj.id)}
                        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 text-sm flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        핵심 결과 추가 (최대 3개)
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/goals/objectives')}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            이전
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 rounded-full font-semibold flex items-center gap-2 ${
              saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                다음: 실행 계획
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
