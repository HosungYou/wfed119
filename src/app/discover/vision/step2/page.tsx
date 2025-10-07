'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import StepProgress from '../components/StepProgress';
import ValuesSummary from '../components/ValuesSummary';
import AIChatBox from '../components/AIChatBox';

interface VisionSession {
  id: string;
  user_id: string;
  future_imagery: string | null;
  core_aspirations: { keyword: string; reason: string; strength_connection?: string }[] | null;
  current_step: number;
}

interface Context {
  values: {
    terminal: { rank: number; value: string; description: string }[];
    instrumental: { rank: number; value: string; description: string }[];
    work: { rank: number; value: string; description: string }[];
  };
  strengths: { rank: number; strength: string; description: string }[];
}

export default function VisionStep2() {
  const router = useRouter();
  const [session, setSession] = useState<VisionSession | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aspirations, setAspirations] = useState<{ keyword: string; reason: string; strength_connection?: string }[]>([]);
  const [selectedAspirations, setSelectedAspirations] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Load session
      const sessionRes = await fetch('/api/discover/vision/session');
      if (!sessionRes.ok) throw new Error('Failed to load session');
      const sessionData = await sessionRes.json();

      // Verify Step 1 is complete
      if (!sessionData.future_imagery) {
        alert('먼저 Step 1을 완료해주세요.');
        router.push('/discover/vision/step1');
        return;
      }

      setSession(sessionData);

      // Load existing aspirations if any
      if (sessionData.core_aspirations && Array.isArray(sessionData.core_aspirations)) {
        setAspirations(sessionData.core_aspirations);
        // Pre-select all existing aspirations
        setSelectedAspirations(new Set(sessionData.core_aspirations.map((_: any, idx: number) => idx)));
      }

      // Load context (values and strengths)
      const contextRes = await fetch('/api/discover/vision/context');
      if (!contextRes.ok) throw new Error('Failed to load context');
      const contextData = await contextRes.json();
      setContext(contextData);

    } catch (error) {
      console.error('[Step2] Load error:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function saveProgress() {
    if (!session) return;

    try {
      setSaving(true);

      // Only save selected aspirations
      const selectedAspirationsData = aspirations.filter((_, idx) => selectedAspirations.has(idx));

      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 2,
          core_aspirations: selectedAspirationsData
        })
      });

      if (!response.ok) throw new Error('Save failed');

      alert('저장되었습니다.');
    } catch (error) {
      console.error('[Step2] Save error:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function goToNextStep() {
    if (!session) return;

    // Validate: at least 3 aspirations selected
    if (selectedAspirations.size < 3) {
      alert('최소 3개의 핵심 열망을 선택해주세요.');
      return;
    }

    if (selectedAspirations.size > 5) {
      alert('최대 5개의 핵심 열망만 선택할 수 있습니다.');
      return;
    }

    try {
      setSaving(true);

      const selectedAspirationsData = aspirations.filter((_, idx) => selectedAspirations.has(idx));

      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          core_aspirations: selectedAspirationsData
        })
      });

      if (!response.ok) throw new Error('Save failed');

      router.push('/discover/vision/step3');
    } catch (error) {
      console.error('[Step2] Next step error:', error);
      alert('다음 단계로 이동하는데 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  function handleAIResponse(response: string) {
    // Parse AI response to extract aspirations
    // Expected format: AI suggests themes as bullet points or numbered list
    // User can then refine them
    console.log('[Step2] AI Response:', response);

    // Try to extract bullet points or numbered items
    const lines = response.split('\n').filter(line => line.trim());
    const newAspirations: { keyword: string; reason: string }[] = [];

    for (const line of lines) {
      // Match patterns like "1. keyword: reason" or "- keyword: reason"
      const match = line.match(/^[\d\-\*•]\s*\.?\s*(.+?)[:：]\s*(.+)$/);
      if (match) {
        newAspirations.push({
          keyword: match[1].trim(),
          reason: match[2].trim()
        });
      }
    }

    if (newAspirations.length > 0) {
      setAspirations(prev => {
        const combined = [...prev, ...newAspirations];
        // Auto-select newly added items
        const newIndices = new Set(selectedAspirations);
        for (let i = prev.length; i < combined.length; i++) {
          newIndices.add(i);
        }
        setSelectedAspirations(newIndices);
        return combined;
      });
    }
  }

  function toggleAspiration(index: number) {
    setSelectedAspirations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }

  function addManualAspiration() {
    const keyword = prompt('핵심 키워드를 입력하세요:');
    if (!keyword) return;

    const reason = prompt('이 열망이 중요한 이유를 입력하세요:');
    if (!reason) return;

    setAspirations(prev => {
      const newAspirations = [...prev, { keyword: keyword.trim(), reason: reason.trim() }];
      setSelectedAspirations(prevSelected => new Set([...prevSelected, prev.length]));
      return newAspirations;
    });
  }

  function removeAspiration(index: number) {
    setAspirations(prev => prev.filter((_, idx) => idx !== index));
    setSelectedAspirations(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      // Adjust indices
      const adjusted = new Set<number>();
      newSet.forEach(idx => {
        if (idx < index) adjusted.add(idx);
        else if (idx > index) adjusted.add(idx - 1);
      });
      return adjusted;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!session || !context) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">세션을 불러올 수 없습니다.</p>
          <button
            onClick={() => router.push('/discover/vision')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/discover/vision/step1')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            이전 단계로
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 2: 핵심 열망 발견</h1>
          <p className="text-gray-600">미래 상상에서 핵심 주제를 추출하고, '왜'라는 질문을 통해 깊이 탐구합니다.</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <StepProgress currentStep={2} />
        </div>

        {/* Main Content - 3 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column - Values Summary */}
          <div className="lg:col-span-3">
            <ValuesSummary values={context.values} mode="full" />
          </div>

          {/* Middle Column - AI Chat */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">AI와 대화하기</h2>
              <p className="text-sm text-gray-600 mb-4">
                AI가 Step 1에서 작성한 미래 상상을 분석하여 핵심 주제를 추출하고, '왜'라는 질문을 통해 깊이 탐구합니다.
              </p>

              <AIChatBox
                step={2}
                context={{
                  ...context,
                  futureImagery: session.future_imagery
                }}
                onResponseComplete={handleAIResponse}
                placeholder="AI에게 질문하거나 생각을 나눠보세요..."
                initialMessage="Step 1에서 작성한 미래 상상을 바탕으로 핵심 열망을 찾아주세요."
              />
            </div>
          </div>

          {/* Right Column - Aspirations List */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">핵심 열망 목록</h2>
                <button
                  onClick={addManualAspiration}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  + 직접 추가
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                3-5개의 핵심 열망을 선택하세요. (현재: {selectedAspirations.size}개)
              </p>

              {aspirations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>AI와 대화하거나 직접 추가하여</p>
                  <p>핵심 열망을 발견하세요.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {aspirations.map((aspiration, index) => (
                    <div
                      key={index}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAspirations.has(index)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAspirations.has(index)}
                          onChange={() => toggleAspiration(index)}
                          className="mt-1 w-5 h-5 text-purple-600 rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{aspiration.keyword}</h3>
                          <p className="text-sm text-gray-600 mt-1">{aspiration.reason}</p>
                          {aspiration.strength_connection && (
                            <p className="text-xs text-purple-600 mt-2">
                              🔗 {aspiration.strength_connection}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeAspiration(index)}
                          className="text-gray-400 hover:text-red-500 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={saveProgress}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            저장하기
          </button>

          <button
            onClick={goToNextStep}
            disabled={saving || selectedAspirations.size < 3 || selectedAspirations.size > 5}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 단계
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
