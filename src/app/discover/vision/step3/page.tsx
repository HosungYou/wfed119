'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save, Loader2, Sparkles } from 'lucide-react';
import StepProgress from '../components/StepProgress';
import ValuesSummary from '../components/ValuesSummary';
import AIChatBox from '../components/AIChatBox';

interface VisionSession {
  id: string;
  user_id: string;
  future_imagery: string | null;
  core_aspirations: { keyword: string; reason: string }[] | null;
  draft_versions: { style: string; text: string; timestamp: string }[] | null;
  final_statement: string | null;
  statement_style: string | null;
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

type VisionStyle = 'action' | 'state' | 'inspirational';

const STYLE_INFO: Record<VisionStyle, { label: string; description: string; example: string }> = {
  action: {
    label: '행동 지향형',
    description: '구체적인 행동과 영향에 초점',
    example: '나는 [행동]을 통해 [영향]을 만든다'
  },
  state: {
    label: '상태 지향형',
    description: '되고자 하는 역할이나 상태에 초점',
    example: '나는 [역할/상태]로서 [가치]를 실현한다'
  },
  inspirational: {
    label: '영감형',
    description: '은유적 표현과 이상에 초점',
    example: '[은유적 표현]으로 [이상]을 추구한다'
  }
};

export default function VisionStep3() {
  const router = useRouter();
  const [session, setSession] = useState<VisionSession | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<VisionStyle | null>(null);
  const [customStatement, setCustomStatement] = useState('');
  const [draftVersions, setDraftVersions] = useState<{ style: string; text: string; timestamp: string }[]>([]);
  const [generatedDrafts, setGeneratedDrafts] = useState<Record<VisionStyle, string>>({
    action: '',
    state: '',
    inspirational: ''
  });

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

      // Verify Step 2 is complete
      if (!sessionData.core_aspirations || sessionData.core_aspirations.length < 3) {
        alert('먼저 Step 2를 완료해주세요.');
        router.push('/discover/vision/step2');
        return;
      }

      setSession(sessionData);

      // Load existing drafts if any
      if (sessionData.draft_versions && Array.isArray(sessionData.draft_versions)) {
        setDraftVersions(sessionData.draft_versions);
      }

      if (sessionData.final_statement) {
        setCustomStatement(sessionData.final_statement);
      }

      if (sessionData.statement_style) {
        setSelectedStyle(sessionData.statement_style as VisionStyle);
      }

      // Load context
      const contextRes = await fetch('/api/discover/vision/context');
      if (!contextRes.ok) throw new Error('Failed to load context');
      const contextData = await contextRes.json();
      setContext(contextData);

    } catch (error) {
      console.error('[Step3] Load error:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function generateDrafts() {
    if (!session || !context) return;

    try {
      setGenerating(true);

      // Call AI to generate 3 style drafts
      const response = await fetch('/api/discover/vision/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3,
          userMessage: '앞서 발견한 핵심 열망을 바탕으로 세 가지 스타일의 비전 문장을 생성해주세요.',
          conversationHistory: [],
          context: {
            ...context,
            futureImagery: session.future_imagery,
            coreAspirations: session.core_aspirations
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate drafts');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              fullResponse += data.content;
            }
          }
        }
      }

      // Parse the three drafts from AI response
      const parsedDrafts = parseDraftsFromAI(fullResponse);
      setGeneratedDrafts(parsedDrafts);

    } catch (error) {
      console.error('[Step3] Generate error:', error);
      alert('비전 문장 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  }

  function parseDraftsFromAI(response: string): Record<VisionStyle, string> {
    const drafts: Record<VisionStyle, string> = {
      action: '',
      state: '',
      inspirational: ''
    };

    // Simple parsing: look for patterns like "1. 행동 지향형:" or "**행동 지향형**"
    const actionMatch = response.match(/(?:1\.|행동\s*지향형|Action)[:\s]*([^\n]+)/i);
    const stateMatch = response.match(/(?:2\.|상태\s*지향형|State)[:\s]*([^\n]+)/i);
    const inspirationalMatch = response.match(/(?:3\.|영감형|Inspirational)[:\s]*([^\n]+)/i);

    if (actionMatch) drafts.action = actionMatch[1].trim();
    if (stateMatch) drafts.state = stateMatch[1].trim();
    if (inspirationalMatch) drafts.inspirational = inspirationalMatch[1].trim();

    return drafts;
  }

  function selectDraft(style: VisionStyle, text: string) {
    setSelectedStyle(style);
    setCustomStatement(text);
  }

  function saveDraftVersion() {
    if (!customStatement.trim()) {
      alert('비전 문장을 입력해주세요.');
      return;
    }

    const newDraft = {
      style: selectedStyle || 'custom',
      text: customStatement.trim(),
      timestamp: new Date().toISOString()
    };

    setDraftVersions(prev => [...prev, newDraft]);
    alert('초안이 저장되었습니다.');
  }

  async function saveProgress() {
    if (!session) return;

    try {
      setSaving(true);

      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          draft_versions: draftVersions,
          final_statement: customStatement.trim() || null,
          statement_style: selectedStyle
        })
      });

      if (!response.ok) throw new Error('Save failed');

      alert('저장되었습니다.');
    } catch (error) {
      console.error('[Step3] Save error:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function goToNextStep() {
    if (!session) return;

    if (!customStatement.trim()) {
      alert('비전 문장을 작성해주세요.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 4,
          draft_versions: draftVersions,
          final_statement: customStatement.trim(),
          statement_style: selectedStyle
        })
      });

      if (!response.ok) throw new Error('Save failed');

      router.push('/discover/vision/step4');
    } catch (error) {
      console.error('[Step3] Next step error:', error);
      alert('다음 단계로 이동하는데 실패했습니다.');
    } finally {
      setSaving(false);
    }
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
            onClick={() => router.push('/discover/vision/step2')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            이전 단계로
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 3: 비전 초안 작성</h1>
          <p className="text-gray-600">세 가지 스타일의 비전 문장을 생성하고, AI와 협력하여 다듬어봅니다.</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <StepProgress currentStep={3} />
        </div>

        {/* Main Content - 3 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column - Core Aspirations Summary */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">핵심 열망</h2>
              <div className="space-y-3">
                {session.core_aspirations?.map((aspiration, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg">
                    <h3 className="font-medium text-purple-900 text-sm">{aspiration.keyword}</h3>
                    <p className="text-xs text-purple-600 mt-1">{aspiration.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <ValuesSummary values={context.values} mode="compact" />
          </div>

          {/* Middle Column - Draft Generation & Editing */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">비전 문장 생성</h2>
                <button
                  onClick={generateDrafts}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI 생성
                    </>
                  )}
                </button>
              </div>

              {/* Three Style Drafts */}
              <div className="space-y-4 mb-6">
                {(Object.keys(STYLE_INFO) as VisionStyle[]).map(style => (
                  <div
                    key={style}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedStyle === style
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => generatedDrafts[style] && selectDraft(style, generatedDrafts[style])}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{STYLE_INFO[style].label}</h3>
                        <p className="text-xs text-gray-500">{STYLE_INFO[style].description}</p>
                      </div>
                      {selectedStyle === style && (
                        <span className="text-purple-600 text-sm font-medium">✓ 선택됨</span>
                      )}
                    </div>
                    {generatedDrafts[style] ? (
                      <p className="text-sm text-gray-700 italic mt-2">"{generatedDrafts[style]}"</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">{STYLE_INFO[style].example}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Custom Editing Area */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비전 문장 수정 및 작성
                </label>
                <textarea
                  value={customStatement}
                  onChange={(e) => setCustomStatement(e.target.value)}
                  placeholder="AI가 생성한 문장을 선택하거나 직접 작성해보세요..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  간결하고 명확하며 영감을 주는 한 문장으로 작성하세요.
                </p>
              </div>

              <button
                onClick={saveDraftVersion}
                disabled={!customStatement.trim()}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                현재 버전 저장
              </button>
            </div>

            {/* AI Chat for Refinement */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">AI와 다듬기</h2>
              <p className="text-sm text-gray-600 mb-4">
                작성한 비전 문장에 대해 AI와 대화하며 더 나은 표현을 찾아보세요.
              </p>

              <AIChatBox
                step={3}
                context={{
                  ...context,
                  futureImagery: session.future_imagery,
                  coreAspirations: session.core_aspirations,
                  currentDraft: customStatement
                }}
                onResponseComplete={(response) => console.log('[Step3] AI refinement:', response)}
                placeholder="비전 문장에 대한 피드백을 요청하세요..."
              />
            </div>
          </div>

          {/* Right Column - Draft History */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">저장된 초안</h2>

              {draftVersions.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <p>아직 저장된 초안이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {draftVersions.map((draft, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => setCustomStatement(draft.text)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-purple-600">
                          {STYLE_INFO[draft.style as VisionStyle]?.label || '커스텀'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(draft.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 italic">"{draft.text}"</p>
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
            disabled={saving || !customStatement.trim()}
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
