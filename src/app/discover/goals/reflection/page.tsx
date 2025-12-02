'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { REFLECTION_LABELS, type ReflectionType } from '@/lib/types/goalSetting';

interface Reflection {
  reflection_type: ReflectionType;
  reflection_text: string;
}

const REFLECTION_ORDER: ReflectionType[] = [
  'identity_alignment',
  'deliberation',
  'incompleteness',
  'diversity',
  'connectivity',
  'feasibility',
  'execution_ease',
];

export default function GoalReflectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reflections, setReflections] = useState<Record<ReflectionType, string>>({
    identity_alignment: '',
    deliberation: '',
    incompleteness: '',
    diversity: '',
    connectivity: '',
    feasibility: '',
    execution_ease: '',
  });
  const [expandedPrinciple, setExpandedPrinciple] = useState<ReflectionType | null>('identity_alignment');

  useEffect(() => {
    fetchReflections();
  }, []);

  async function fetchReflections() {
    try {
      const res = await fetch('/api/goals/reflections');
      if (res.ok) {
        const data: Reflection[] = await res.json();
        const refMap: Record<string, string> = {};
        data.forEach(r => {
          refMap[r.reflection_type] = r.reflection_text;
        });
        setReflections(prev => ({ ...prev, ...refMap }));
      }
      setLoading(false);
    } catch (error) {
      console.error('[Goal Reflections] Error:', error);
      setLoading(false);
    }
  }

  function updateReflection(type: ReflectionType, text: string) {
    setReflections(prev => ({
      ...prev,
      [type]: text,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const reflectionsList = REFLECTION_ORDER
        .filter(type => reflections[type].trim())
        .map(type => ({
          reflection_type: type,
          reflection_text: reflections[type],
        }));

      // Save reflections
      const reflectionsRes = await fetch('/api/goals/reflections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflections: reflectionsList }),
      });

      if (!reflectionsRes.ok) {
        const data = await reflectionsRes.json();
        throw new Error(data.error || '성찰 저장에 실패했습니다.');
      }

      // Mark session as completed
      const sessionRes = await fetch('/api/goals/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!sessionRes.ok) {
        const data = await sessionRes.json();
        throw new Error(data.error || '세션 완료 처리에 실패했습니다.');
      }

      router.push('/discover/goals');
    } catch (err) {
      console.error('[Goal Reflections] Error saving:', err);
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  const completedCount = REFLECTION_ORDER.filter(type => reflections[type].trim().length >= 20).length;

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
            onClick={() => router.push('/discover/goals/actions')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            실행 계획으로 돌아가기
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">5. 목표 설정 7가지 원칙</h1>
              <p className="text-sm text-gray-500">각 원칙에 대해 성찰하고 기록하세요</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">성찰 진행률</span>
            <span className="text-sm text-purple-600 font-bold">{completedCount}/7</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${(completedCount / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-700 mt-1 underline"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* Principles */}
        <div className="space-y-3 mb-6">
          {REFLECTION_ORDER.map((type, index) => {
            const label = REFLECTION_LABELS[type];
            const isCompleted = reflections[type].trim().length >= 20;
            const isExpanded = expandedPrinciple === type;

            return (
              <div key={type} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => setExpandedPrinciple(isExpanded ? null : type)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">{label.korean}</h3>
                      <p className="text-xs text-gray-500">{label.english}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-100">
                    <div className="bg-purple-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-purple-800">{label.description}</p>
                    </div>

                    <textarea
                      value={reflections[type]}
                      onChange={(e) => updateReflection(type, e.target.value)}
                      placeholder="이 원칙에 대한 성찰을 작성하세요... (최소 20자)"
                      rows={4}
                      className="w-full border border-gray-200 rounded-lg p-3 text-gray-700 focus:border-purple-500 outline-none resize-none"
                    />

                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${
                        reflections[type].length >= 20 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {reflections[type].length}자 / 최소 20자
                      </span>
                      {index < 6 && (
                        <button
                          onClick={() => setExpandedPrinciple(REFLECTION_ORDER[index + 1])}
                          className="text-sm text-purple-600 hover:text-purple-700"
                        >
                          다음 원칙 →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 mb-6 text-white">
          <h2 className="font-bold text-lg mb-2">목표 설정 완료!</h2>
          <p className="text-sm text-purple-100 mb-4">
            OKR 기반 목표 설정을 통해 인생의 각 역할에 대한 구체적인 목표와 행동 계획을 수립했습니다.
            정기적으로 진행 상황을 점검하고 필요에 따라 조정하세요.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xl font-bold">OKR</div>
              <div className="text-xs">프레임워크</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xl font-bold">7</div>
              <div className="text-xs">원칙</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xl font-bold">{completedCount}</div>
              <div className="text-xs">성찰 완료</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/goals/actions')}
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
                완료 중...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                목표 설정 완료
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
