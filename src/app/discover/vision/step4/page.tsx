'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Loader2, Check, Sparkles } from 'lucide-react';
import StepProgress from '../components/StepProgress';
import AIChatBox from '../components/AIChatBox';

interface VisionSession {
  id: string;
  user_id: string;
  future_imagery: string | null;
  core_aspirations: { keyword: string; reason: string }[] | null;
  final_statement: string | null;
  statement_style: string | null;
  selected_template_id: string | null;
  is_completed: boolean;
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

interface VisionCardTemplate {
  id: string;
  name: string;
  design_config: {
    background: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

export default function VisionStep4() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<VisionSession | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [templates, setTemplates] = useState<VisionCardTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [finalStatement, setFinalStatement] = useState('');
  const [firstAction, setFirstAction] = useState('');
  const [validationPassed, setValidationPassed] = useState(false);

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

      // Verify Step 3 is complete
      if (!sessionData.final_statement) {
        alert('먼저 Step 3를 완료해주세요.');
        router.push('/discover/vision/step3');
        return;
      }

      setSession(sessionData);
      setFinalStatement(sessionData.final_statement);
      setSelectedTemplateId(sessionData.selected_template_id);

      // Load context
      const contextRes = await fetch('/api/discover/vision/context');
      if (!contextRes.ok) throw new Error('Failed to load context');
      const contextData = await contextRes.json();
      setContext(contextData);

      // Load templates
      const templatesRes = await fetch('/api/discover/vision/templates');
      if (!templatesRes.ok) throw new Error('Failed to load templates');
      const templatesData = await templatesRes.json();
      setTemplates(templatesData);

      // Select first template if none selected
      if (!sessionData.selected_template_id && templatesData.length > 0) {
        setSelectedTemplateId(templatesData[0].id);
      }

    } catch (error) {
      console.error('[Step4] Load error:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function validateStatement() {
    if (!finalStatement.trim()) {
      alert('비전 문장을 입력해주세요.');
      return;
    }

    // Simple validation criteria
    const isSimple = finalStatement.length <= 100;
    const isClear = finalStatement.split(' ').length >= 5;
    const isUnique = true; // Assume uniqueness for now

    if (isSimple && isClear && isUnique) {
      setValidationPassed(true);
      alert('✓ 비전 문장이 검증되었습니다!');
    } else {
      alert('비전 문장을 조금 더 다듬어보세요. (간결하고 명확하게)');
    }
  }

  async function exportCard() {
    if (!cardRef.current) return;

    try {
      setExporting(true);

      // Dynamic import to reduce bundle size
      const htmlToImage = await import('html-to-image');

      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2
      });

      // Download
      const link = document.createElement('a');
      link.download = `vision-card-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();

      alert('비전 카드가 다운로드되었습니다!');
    } catch (error) {
      console.error('[Step4] Export error:', error);
      alert('비전 카드 내보내기에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  }

  async function completeModule() {
    if (!session) return;

    if (!validationPassed) {
      alert('먼저 비전 문장을 검증해주세요.');
      return;
    }

    if (!selectedTemplateId) {
      alert('비전 카드 템플릿을 선택해주세요.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 4,
          final_statement: finalStatement.trim(),
          selected_template_id: selectedTemplateId,
          is_completed: true
        })
      });

      if (!response.ok) throw new Error('Save failed');

      alert('🎉 Vision Statement 모듈을 완료했습니다!');

      // Redirect to SWOT analysis (or dashboard)
      router.push('/dashboard'); // TODO: Change to SWOT module when ready
    } catch (error) {
      console.error('[Step4] Complete error:', error);
      alert('완료 처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

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
            onClick={() => router.push('/discover/vision/step3')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            이전 단계로
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 4: 완성 및 비전 카드</h1>
          <p className="text-gray-600">비전 문장을 최종 검증하고, 아름다운 비전 카드로 시각화합니다.</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <StepProgress currentStep={4} />
        </div>

        {/* Main Content - 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Validation & First Action */}
          <div className="space-y-6">
            {/* Final Statement */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">최종 비전 문장</h2>

              <textarea
                value={finalStatement}
                onChange={(e) => {
                  setFinalStatement(e.target.value);
                  setValidationPassed(false); // Reset validation
                }}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none mb-4"
                placeholder="최종 비전 문장을 입력하세요..."
              />

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={validateStatement}
                  disabled={!finalStatement.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  검증하기
                </button>

                {validationPassed && (
                  <span className="text-green-600 font-medium text-sm flex items-center gap-1">
                    <Check className="w-5 h-5" />
                    검증 완료
                  </span>
                )}
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900 text-sm mb-2">검증 기준</h3>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>✓ 간결함: 한 문장으로 표현 (100자 이내)</li>
                  <li>✓ 명확함: 의미가 분명하고 이해하기 쉬움</li>
                  <li>✓ 영감: 나를 움직이게 만드는 힘이 있음</li>
                  <li>✓ 고유함: 나만의 독특한 표현</li>
                </ul>
              </div>
            </div>

            {/* First Action Item */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">첫 번째 실천 항목</h2>
              <p className="text-sm text-gray-600 mb-4">
                비전을 실현하기 위해 오늘부터 시작할 수 있는 작은 행동은 무엇인가요?
              </p>

              <textarea
                value={firstAction}
                onChange={(e) => setFirstAction(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="예: 매일 30분씩 관련 분야 공부하기"
              />
            </div>

            {/* AI Timeline Connection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">과거-현재-미래 연결</h2>
              <p className="text-sm text-gray-600 mb-4">
                AI와 대화하며 비전이 당신의 과거, 현재, 미래와 어떻게 연결되는지 탐구해보세요.
              </p>

              <AIChatBox
                step={4}
                context={{
                  ...context,
                  futureImagery: session.future_imagery,
                  coreAspirations: session.core_aspirations,
                  finalStatement: finalStatement
                }}
                onResponseComplete={(response) => console.log('[Step4] Timeline reflection:', response)}
                placeholder="비전과 나의 이야기를 연결해보세요..."
                initialMessage="내 비전 문장이 과거의 경험, 현재의 강점, 그리고 미래의 열망과 어떻게 연결되는지 설명해주세요."
              />
            </div>
          </div>

          {/* Right Column - Vision Card */}
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">비전 카드 템플릿</h2>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedTemplateId === template.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      background: template.design_config.background
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: template.design_config.textColor }}>
                      {template.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vision Card Preview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">비전 카드 미리보기</h2>
                <button
                  onClick={exportCard}
                  disabled={exporting || !selectedTemplateId}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      내보내는 중...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      PNG 다운로드
                    </>
                  )}
                </button>
              </div>

              {/* Card */}
              <div
                ref={cardRef}
                className="w-full aspect-[4/3] rounded-xl shadow-2xl flex flex-col items-center justify-center p-8 text-center"
                style={{
                  background: selectedTemplate?.design_config.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontFamily: selectedTemplate?.design_config.fontFamily || 'inherit'
                }}
              >
                <div className="mb-6">
                  <Sparkles
                    className="w-12 h-12 mx-auto mb-4"
                    style={{ color: selectedTemplate?.design_config.accentColor || '#fbbf24' }}
                  />
                  <h3
                    className="text-sm font-medium tracking-wider uppercase mb-2"
                    style={{ color: selectedTemplate?.design_config.textColor || '#ffffff' }}
                  >
                    My Vision
                  </h3>
                </div>

                <p
                  className="text-2xl font-bold leading-relaxed max-w-lg"
                  style={{ color: selectedTemplate?.design_config.textColor || '#ffffff' }}
                >
                  {finalStatement || '당신의 비전 문장이 여기에 표시됩니다'}
                </p>

                <div className="mt-8">
                  <div
                    className="h-1 w-16 mx-auto rounded-full mb-4"
                    style={{ background: selectedTemplate?.design_config.accentColor || '#fbbf24' }}
                  />
                  <p
                    className="text-sm opacity-90"
                    style={{ color: selectedTemplate?.design_config.textColor || '#ffffff' }}
                  >
                    {new Date().getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            {/* Core Aspirations Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">핵심 열망</h3>
              <div className="flex flex-wrap gap-2">
                {session.core_aspirations?.map((aspiration, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {aspiration.keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <div className="flex justify-center">
          <button
            onClick={completeModule}
            disabled={saving || !validationPassed || !selectedTemplateId}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Check className="w-6 h-6" />
                Vision Statement 완성하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
