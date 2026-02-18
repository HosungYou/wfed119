'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle, Target, Sparkles, Share2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

const STEPS = [
  { id: 'step1', label: 'Values Summary', labelKo: '가치관 요약' },
  { id: 'step2', label: 'Mission Components', labelKo: '사명 구성요소' },
  { id: 'step3', label: 'Mission Drafting', labelKo: '사명 작성' },
  { id: 'step4', label: 'Reflection', labelKo: '성찰' },
];

interface Reflections {
  inspiration: string;
  alignment: string;
  feedback: string;
}

export default function MissionStep4() {
  const router = useRouter();
  const { language } = useLanguage();
  const { completeModule } = useModuleProgress('mission');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalStatement, setFinalStatement] = useState('');
  const [session, setSession] = useState<any>(null);

  const [reflections, setReflections] = useState<Reflections>({
    inspiration: '',
    alignment: '',
    feedback: '',
  });

  // AI insights
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

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
      setFinalStatement(data.final_statement || '');

      // Restore reflections
      if (data.reflections && typeof data.reflections === 'object') {
        setReflections({
          inspiration: data.reflections.inspiration || '',
          alignment: data.reflections.alignment || '',
          feedback: data.reflections.feedback || '',
        });
      }

      // Restore AI insights
      if (data.ai_insights?.follow_up_insights) {
        setAiInsights(data.ai_insights.follow_up_insights);
        setShowInsights(true);
      }

      // Check if already completed
      if (data.status === 'completed') {
        setIsCompleted(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 4] Error:', error);
      setLoading(false);
    }
  }

  function updateReflection(key: keyof Reflections, value: string) {
    setReflections(prev => ({ ...prev, [key]: value }));
  }

  function getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  async function handleComplete() {
    // Validate reflections
    if (getWordCount(reflections.inspiration) < 20) {
      alert(language === 'ko' ? '질문 1에 더 자세히 답변해주세요 (최소 20단어 권장).' : 'Please provide a more detailed answer to Question 1 (min 20 words recommended).');
      return;
    }
    if (getWordCount(reflections.alignment) < 20) {
      alert(language === 'ko' ? '질문 2에 더 자세히 답변해주세요 (최소 20단어 권장).' : 'Please provide a more detailed answer to Question 2 (min 20 words recommended).');
      return;
    }
    if (getWordCount(reflections.feedback) < 10) {
      alert(language === 'ko' ? '질문 3에 답변해주세요 (최소 10단어 권장).' : 'Please answer Question 3 (min 10 words recommended).');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflections,
          status: 'completed',
        }),
      });

      await completeModule();
      setIsCompleted(true);

      // Load AI insights in background
      loadAiInsights();
    } catch (error) {
      console.error('[Mission Step 4] Complete error:', error);
      alert(language === 'ko' ? '완료 실패' : 'Completion failed');
    } finally {
      setSaving(false);
    }
  }

  async function loadAiInsights() {
    setAiInsightLoading(true);
    try {
      const contextRes = await fetch('/api/discover/mission/context');
      const context = await contextRes.json();

      const res = await fetch('/api/discover/mission/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reflection_guide',
          finalStatement,
          values: session?.values_used || [],
          enneagram: context?.enneagram,
          lifeThemes: context?.lifeThemes?.themes || [],
          reflections,
        }),
      });

      const data = await res.json();
      if (data.suggestion?.insights) {
        setAiInsights(data.suggestion.insights);
        setShowInsights(true);

        // Save AI insights to session
        await fetch('/api/discover/mission/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ai_insights: {
              ...(session?.ai_insights || {}),
              follow_up_insights: data.suggestion.insights,
            },
          }),
        });
      }
    } catch (error) {
      console.error('[Mission Step 4] AI insights error:', error);
    } finally {
      setAiInsightLoading(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 4, [1, 2, 3]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  // ============ COMPLETION SCREEN ============
  if (isCompleted) {
    return (
      <ModuleShell moduleId="mission" showProgress={false}>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'ko' ? '사명 선언문 완성!' : 'Mission Statement Complete!'}
          </h1>

          <p className="text-gray-600 mb-8">
            {language === 'ko'
              ? '축하합니다! 당신만의 사명 선언문이 완성되었습니다.'
              : 'Congratulations! Your personal mission statement is now complete.'}
          </p>

          <ModuleCard padding="large" className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200 mb-8">
            <Target className="w-8 h-8 text-teal-600 mx-auto mb-4" />
            <p className="text-xl text-gray-900 leading-relaxed font-medium">
              &ldquo;{finalStatement}&rdquo;
            </p>
          </ModuleCard>

          {/* AI Insights */}
          {(showInsights || aiInsightLoading) && (
            <ModuleCard padding="normal" className="mb-8 text-left bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">
                  {language === 'ko' ? 'AI 인사이트' : 'AI Insights'}
                </h3>
              </div>
              {aiInsightLoading ? (
                <div className="flex items-center gap-2 text-purple-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{language === 'ko' ? '인사이트를 생성하고 있습니다...' : 'Generating insights...'}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">-</span>
                      <p className="text-sm text-purple-800">{insight}</p>
                    </div>
                  ))}
                </div>
              )}
            </ModuleCard>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ModuleButton
              onClick={() => {
                navigator.clipboard.writeText(finalStatement);
                alert(language === 'ko' ? '복사됨!' : 'Copied!');
              }}
              variant="secondary"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {language === 'ko' ? '복사하기' : 'Copy'}
            </ModuleButton>
            <ModuleButton onClick={() => router.push('/dashboard')}>
              {language === 'ko' ? '대시보드로 이동' : 'Go to Dashboard'}
            </ModuleButton>
            <ModuleButton
              onClick={() => router.push('/discover/life-roles')}
              variant="secondary"
            >
              {language === 'ko' ? '다음 모듈: 생애 역할' : 'Next: Life Roles'}
            </ModuleButton>
          </div>
        </div>
      </ModuleShell>
    );
  }

  // ============ REFLECTION FORM ============
  return (
    <ModuleShell
      moduleId="mission"
      currentStep={4}
      totalSteps={4}
      title={language === 'ko' ? '성찰' : 'Reflection'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Mission Statement Display */}
        <ModuleCard padding="normal" className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-teal-900">
              {language === 'ko' ? '나의 사명 선언문' : 'My Mission Statement'}
            </h3>
          </div>
          <p className="text-lg text-gray-900 leading-relaxed font-medium">
            &ldquo;{finalStatement}&rdquo;
          </p>
        </ModuleCard>

        {/* Reflection Question 1 */}
        <ModuleCard padding="normal">
          <h3 className="font-semibold text-gray-900 mb-2">
            {language === 'ko' ? '질문 1' : 'Question 1'}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {language === 'ko'
              ? '사명 선언문을 완성한 후, 그것이 당신에게 무엇을 의미하는지 성찰하세요. 어떻게 당신에게 영감을 주나요? 미래의 행동과 결정을 어떻게 이끌어줄까요?'
              : 'After completing your mission statement, reflect on what it means to you. How does it inspire you? How will it guide your future actions and decisions?'}
          </p>
          <textarea
            value={reflections.inspiration}
            onChange={(e) => updateReflection('inspiration', e.target.value)}
            rows={6}
            placeholder={language === 'ko' ? '20단어 이상...' : 'Write at least 20 words...'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
          <p className={`text-xs mt-1 ${getWordCount(reflections.inspiration) >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
            {getWordCount(reflections.inspiration)} {language === 'ko' ? '단어' : 'words'} ({language === 'ko' ? '20단어 이상 권장' : '20+ recommended'})
          </p>
        </ModuleCard>

        {/* Reflection Question 2 */}
        <ModuleCard padding="normal">
          <h3 className="font-semibold text-gray-900 mb-2">
            {language === 'ko' ? '질문 2' : 'Question 2'}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {language === 'ko'
              ? '이 사명 선언문에 맞춰 행동하는 것이 어떻게 의미 있고 충만한 삶과 커리어로 이어질 수 있을까요?'
              : 'How can acting in alignment with this mission statement lead to a meaningful and fulfilling life and career?'}
          </p>
          <textarea
            value={reflections.alignment}
            onChange={(e) => updateReflection('alignment', e.target.value)}
            rows={6}
            placeholder={language === 'ko' ? '20단어 이상...' : 'Write at least 20 words...'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
          <p className={`text-xs mt-1 ${getWordCount(reflections.alignment) >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
            {getWordCount(reflections.alignment)} {language === 'ko' ? '단어' : 'words'} ({language === 'ko' ? '20단어 이상 권장' : '20+ recommended'})
          </p>
        </ModuleCard>

        {/* Reflection Question 3 */}
        <ModuleCard padding="normal">
          <h3 className="font-semibold text-gray-900 mb-2">
            {language === 'ko' ? '질문 3' : 'Question 3'}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {language === 'ko'
              ? '이 활동은 어땠나요? 얼마나 쉬웠거나 어려웠나요? 다른 사람들을 더 잘 도울 수 있도록 피드백을 해주세요.'
              : 'How was this activity? How easy or difficult was it? Please provide feedback so we can help others better.'}
          </p>
          <textarea
            value={reflections.feedback}
            onChange={(e) => updateReflection('feedback', e.target.value)}
            rows={4}
            placeholder={language === 'ko' ? '10단어 이상...' : 'Write at least 10 words...'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
          <p className={`text-xs mt-1 ${getWordCount(reflections.feedback) >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
            {getWordCount(reflections.feedback)} {language === 'ko' ? '단어' : 'words'} ({language === 'ko' ? '10단어 이상 권장' : '10+ recommended'})
          </p>
        </ModuleCard>

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => router.push('/discover/mission/step3')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <ModuleButton
            onClick={handleComplete}
            disabled={saving || !reflections.inspiration.trim() || !reflections.alignment.trim() || !reflections.feedback.trim()}
            size="large"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            {language === 'ko' ? '사명 선언문 완성' : 'Complete Mission Statement'}
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
