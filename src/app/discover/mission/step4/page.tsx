'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle, Target, Sparkles, Download, Share2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface Feedback {
  clarity: { score: number; feedback: string };
  values_alignment: { score: number; feedback: string };
  impact: { score: number; feedback: string };
  actionability: { score: number; feedback: string };
  overall: { score: number; summary: string };
  suggestions: string[];
}

const STEPS = [
  { id: 'step1', label: 'Values Review', labelKo: '가치관 검토' },
  { id: 'step2', label: 'Purpose Questions', labelKo: '목적 질문' },
  { id: 'step3', label: 'Mission Draft', labelKo: '사명 초안' },
  { id: 'step4', label: 'Mission Refinement', labelKo: '사명 완성' },
];

export default function MissionStep4() {
  const router = useRouter();
  const { language } = useLanguage();
  const { completeModule } = useModuleProgress('mission');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [finalStatement, setFinalStatement] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

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

      // Use final statement if exists, otherwise use latest draft
      if (data.final_statement) {
        setFinalStatement(data.final_statement);
        setIsCompleted(data.status === 'completed');
      } else if (data.draft_versions && data.draft_versions.length > 0) {
        setFinalStatement(data.draft_versions[data.draft_versions.length - 1].text);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 4] Error:', error);
      setLoading(false);
    }
  }

  async function analyzeMission() {
    if (!finalStatement.trim()) return;

    setAnalyzing(true);
    try {
      const res = await fetch('/api/discover/mission/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: session?.values_used,
          purposeAnswers: session?.purpose_answers,
          context: { currentDraft: finalStatement },
          type: 'feedback',
        }),
      });

      const data = await res.json();
      if (data.suggestion) {
        setFeedback(data.suggestion);
      }
    } catch (error) {
      console.error('[Mission Step 4] Analyze error:', error);
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveStatement() {
    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_statement: finalStatement }),
      });
      setIsEditing(false);
      alert(language === 'ko' ? '저장됨!' : 'Saved!');
    } catch (error) {
      console.error('[Mission Step 4] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    if (!finalStatement.trim()) {
      alert(language === 'ko'
        ? '사명 선언문을 완성해주세요.'
        : 'Please finalize your mission statement.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          final_statement: finalStatement,
          status: 'completed',
        }),
      });

      await completeModule();
      setIsCompleted(true);
    } catch (error) {
      console.error('[Mission Step 4] Complete error:', error);
      alert(language === 'ko' ? '완료 실패' : 'Completion failed');
    } finally {
      setSaving(false);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getScoreEmoji(score: number) {
    if (score >= 8) return '✅';
    if (score >= 6) return '⚠️';
    return '❌';
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 4, [1, 2, 3]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  // Completion Screen
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
              ? '축하합니다! 당신의 사명 선언문이 완성되었습니다.'
              : 'Congratulations! Your personal mission statement is now complete.'}
          </p>

          <ModuleCard padding="large" className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200 mb-8">
            <Target className="w-8 h-8 text-teal-600 mx-auto mb-4" />
            <p className="text-xl text-gray-900 leading-relaxed font-medium">
              "{finalStatement}"
            </p>
          </ModuleCard>

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
              onClick={() => router.push('/discover/career-options')}
              variant="secondary"
            >
              {language === 'ko' ? '다음 모듈: 경력 탐색' : 'Next: Career Options'}
            </ModuleButton>
          </div>
        </div>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell
      moduleId="mission"
      currentStep={4}
      totalSteps={4}
      title={language === 'ko' ? '사명 완성' : 'Mission Refinement'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Final Statement */}
        <ModuleCard padding="normal">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {language === 'ko' ? '최종 사명 선언문' : 'Final Mission Statement'}
            </h2>
            <ModuleButton
              onClick={analyzeMission}
              variant="secondary"
              size="small"
              disabled={analyzing || !finalStatement.trim()}
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {language === 'ko' ? 'AI 분석' : 'AI Analysis'}
            </ModuleButton>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={finalStatement}
                onChange={(e) => setFinalStatement(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-lg"
              />
              <div className="flex gap-3">
                <ModuleButton onClick={saveStatement} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {language === 'ko' ? '저장' : 'Save'}
                </ModuleButton>
                <ModuleButton
                  onClick={() => setIsEditing(false)}
                  variant="ghost"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </ModuleButton>
              </div>
            </div>
          ) : (
            <div
              className="p-6 bg-teal-50 border border-teal-200 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors"
              onClick={() => setIsEditing(true)}
            >
              <p className="text-lg text-gray-900 leading-relaxed">
                {finalStatement || (language === 'ko' ? '클릭하여 편집...' : 'Click to edit...')}
              </p>
              <p className="text-sm text-teal-600 mt-3">
                {language === 'ko' ? '클릭하여 수정' : 'Click to edit'}
              </p>
            </div>
          )}
        </ModuleCard>

        {/* AI Feedback */}
        {feedback && (
          <ModuleCard padding="normal">
            <h3 className="font-semibold text-gray-900 mb-4">
              {language === 'ko' ? 'AI 피드백' : 'AI Feedback'}
            </h3>

            {/* Overall Score */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">
                  {language === 'ko' ? '종합 점수' : 'Overall Score'}
                </span>
                <span className={`text-2xl font-bold ${getScoreColor(feedback.overall.score)}`}>
                  {feedback.overall.score}/10
                </span>
              </div>
              <p className="text-sm text-gray-600">{feedback.overall.summary}</p>
            </div>

            {/* Individual Scores */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { key: 'clarity', label: language === 'ko' ? '명확성' : 'Clarity', data: feedback.clarity },
                { key: 'values_alignment', label: language === 'ko' ? '가치 일치' : 'Values Alignment', data: feedback.values_alignment },
                { key: 'impact', label: language === 'ko' ? '영향력' : 'Impact', data: feedback.impact },
                { key: 'actionability', label: language === 'ko' ? '실행 가능성' : 'Actionability', data: feedback.actionability },
              ].map((item) => (
                <div key={item.key} className="p-3 bg-white border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className={getScoreColor(item.data.score)}>
                      {getScoreEmoji(item.data.score)} {item.data.score}/10
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{item.data.feedback}</p>
                </div>
              ))}
            </div>

            {/* Suggestions */}
            {feedback.suggestions && feedback.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  {language === 'ko' ? '개선 제안' : 'Suggestions'}
                </h4>
                <ul className="space-y-2">
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-teal-500">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ModuleCard>
        )}

        {/* Values Reference */}
        <ModuleCard padding="normal" className="bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">
            {language === 'ko' ? '선택한 가치관' : 'Selected Values'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {session?.values_used?.map((v: any, i: number) => (
              <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                {v.name}
              </span>
            ))}
          </div>
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
            disabled={saving || !finalStatement.trim()}
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
