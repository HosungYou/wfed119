'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle, Target, Sparkles, RefreshCw, Edit2, Share2, Home } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface DraftVersion {
  version: number;
  text: string;
  createdAt: string;
  aiGenerated: boolean;
}

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
  { id: 'step2', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step3', label: 'Self-Role Reflection', labelKo: '자기 역할 성찰' },
  { id: 'step4', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step5', label: 'Mission Statement', labelKo: '사명 선언문' },
];

export default function MissionStep5() {
  const router = useRouter();
  const { language } = useLanguage();
  const { completeModule } = useModuleProgress('mission');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [drafts, setDrafts] = useState<DraftVersion[]>([]);
  const [currentDraft, setCurrentDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [sessionRes, contextRes] = await Promise.all([
        fetch('/api/discover/mission/session'),
        fetch('/api/discover/mission/context'),
      ]);

      const sessionData = await sessionRes.json();
      const contextData = await contextRes.json();

      if (sessionData.current_step < 5) {
        router.push(`/discover/mission/step${sessionData.current_step}`);
        return;
      }

      setSession(sessionData);
      setContext(contextData);

      // Load existing drafts
      if (sessionData.draft_versions && sessionData.draft_versions.length > 0) {
        setDrafts(sessionData.draft_versions);
        setCurrentDraft(sessionData.draft_versions[sessionData.draft_versions.length - 1].text);
      }

      // Check if already completed
      if (sessionData.final_statement) {
        setCurrentDraft(sessionData.final_statement);
        setIsCompleted(sessionData.status === 'completed');
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 5] Error:', error);
      setLoading(false);
    }
  }

  async function generateDraft() {
    setGenerating(true);
    try {
      const res = await fetch('/api/discover/mission/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: session?.values_used,
          lifeRoles: session?.life_roles,
          wellbeingReflections: session?.wellbeing_reflections,
          roleCommitments: session?.role_commitments,
          wellbeingCommitments: session?.wellbeing_commitments,
          context: {
            vision: context?.vision,
            strengths: context?.strengths,
          },
          type: 'draft',
        }),
      });

      const data = await res.json();

      if (data.suggestion) {
        const newDraft: DraftVersion = {
          version: drafts.length + 1,
          text: data.suggestion,
          createdAt: new Date().toISOString(),
          aiGenerated: true,
        };

        const updatedDrafts = [...drafts, newDraft];
        setDrafts(updatedDrafts);
        setCurrentDraft(data.suggestion);

        // Save to session
        await fetch('/api/discover/mission/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft_versions: updatedDrafts }),
        });
      }
    } catch (error) {
      console.error('[Mission Step 5] Generate error:', error);
      alert(language === 'ko' ? '생성 실패' : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function analyzeMission() {
    if (!currentDraft.trim()) return;

    setAnalyzing(true);
    try {
      const res = await fetch('/api/discover/mission/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: session?.values_used,
          lifeRoles: session?.life_roles,
          roleCommitments: session?.role_commitments,
          context: { currentDraft },
          type: 'feedback',
        }),
      });

      const data = await res.json();
      if (data.suggestion) {
        setFeedback(data.suggestion);
      }
    } catch (error) {
      console.error('[Mission Step 5] Analyze error:', error);
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveDraft() {
    if (!currentDraft.trim()) return;

    setSaving(true);
    try {
      const latestDraft = drafts[drafts.length - 1];
      let updatedDrafts = drafts;

      if (!latestDraft || currentDraft !== latestDraft.text) {
        const newDraft: DraftVersion = {
          version: drafts.length + 1,
          text: currentDraft,
          createdAt: new Date().toISOString(),
          aiGenerated: false,
        };
        updatedDrafts = [...drafts, newDraft];
        setDrafts(updatedDrafts);
      }

      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_versions: updatedDrafts }),
      });

      setIsEditing(false);
      alert(language === 'ko' ? '저장됨!' : 'Saved!');
    } catch (error) {
      console.error('[Mission Step 5] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    if (!currentDraft.trim()) {
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
          final_statement: currentDraft,
          status: 'completed',
        }),
      });

      await completeModule();
      setIsCompleted(true);
    } catch (error) {
      console.error('[Mission Step 5] Complete error:', error);
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

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 5, [1, 2, 3, 4]);

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
              ? '축하합니다! 당신의 삶의 역할과 헌신을 바탕으로 사명 선언문이 완성되었습니다.'
              : 'Congratulations! Your personal mission statement based on your life roles and commitments is now complete.'}
          </p>

          <ModuleCard padding="large" className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200 mb-8">
            <Target className="w-8 h-8 text-teal-600 mx-auto mb-4" />
            <p className="text-xl text-gray-900 leading-relaxed font-medium">
              "{currentDraft}"
            </p>
          </ModuleCard>

          {/* Summary of Life Roles */}
          {session?.life_roles && session.life_roles.length > 0 && (
            <ModuleCard padding="normal" className="mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">
                {language === 'ko' ? '나의 삶의 역할' : 'My Life Roles'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {session.life_roles.map((lr: any, i: number) => (
                  <span key={i} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                    {lr.role}
                  </span>
                ))}
              </div>
            </ModuleCard>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ModuleButton
              onClick={() => {
                navigator.clipboard.writeText(currentDraft);
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
      currentStep={5}
      totalSteps={5}
      title={language === 'ko' ? '사명 선언문' : 'Mission Statement'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Context Summary */}
        <ModuleCard padding="normal" className="bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">
            {language === 'ko' ? '입력 요약' : 'Your Input Summary'}
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">
                {language === 'ko' ? '선택한 가치' : 'Selected Values'}
              </p>
              <div className="flex flex-wrap gap-1">
                {session?.values_used?.map((v: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                    {v.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">
                {language === 'ko' ? '삶의 역할' : 'Life Roles'}
              </p>
              <div className="flex flex-wrap gap-1">
                {session?.life_roles?.map((lr: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                    {lr.role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ModuleCard>

        {/* Mission Statement Draft/Edit */}
        <ModuleCard padding="normal">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {language === 'ko' ? '사명 선언문 작성' : 'Mission Statement Draft'}
            </h2>
            <div className="flex gap-2">
              <ModuleButton
                onClick={generateDraft}
                variant="secondary"
                size="small"
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {drafts.length > 0
                  ? (language === 'ko' ? '새로 생성' : 'Regenerate')
                  : (language === 'ko' ? 'AI 초안 생성' : 'Generate with AI')}
              </ModuleButton>
              {currentDraft && (
                <ModuleButton
                  onClick={analyzeMission}
                  variant="ghost"
                  size="small"
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  {language === 'ko' ? 'AI 분석' : 'Analyze'}
                </ModuleButton>
              )}
            </div>
          </div>

          {!currentDraft && !generating ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {language === 'ko'
                  ? 'AI가 당신의 가치관, 삶의 역할, 헌신을 바탕으로 사명 선언문 초안을 작성합니다.'
                  : 'AI will draft a mission statement based on your values, life roles, and commitments.'}
              </p>
              <ModuleButton onClick={generateDraft} disabled={generating}>
                <Sparkles className="w-4 h-4 mr-2" />
                {language === 'ko' ? 'AI 초안 생성하기' : 'Generate AI Draft'}
              </ModuleButton>
            </div>
          ) : generating ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
              <p className="text-gray-600">
                {language === 'ko' ? 'AI가 사명 선언문을 작성하고 있습니다...' : 'AI is drafting your mission statement...'}
              </p>
            </div>
          ) : isEditing ? (
            <div className="space-y-4">
              <textarea
                value={currentDraft}
                onChange={(e) => setCurrentDraft(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-lg"
                placeholder={language === 'ko' ? '사명 선언문을 작성하세요...' : 'Write your mission statement...'}
              />
              <div className="flex gap-3">
                <ModuleButton onClick={saveDraft} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {language === 'ko' ? '저장' : 'Save'}
                </ModuleButton>
                <ModuleButton
                  onClick={() => {
                    setCurrentDraft(drafts[drafts.length - 1]?.text || '');
                    setIsEditing(false);
                  }}
                  variant="ghost"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </ModuleButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {currentDraft}
                </p>
              </div>
              <div className="flex gap-3">
                <ModuleButton onClick={() => setIsEditing(true)} variant="secondary">
                  <Edit2 className="w-4 h-4 mr-2" />
                  {language === 'ko' ? '수정하기' : 'Edit'}
                </ModuleButton>
                <ModuleButton onClick={generateDraft} variant="ghost" disabled={generating}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {language === 'ko' ? '다시 생성' : 'Regenerate'}
                </ModuleButton>
              </div>
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

        {/* Previous Drafts */}
        {drafts.length > 1 && (
          <ModuleCard padding="normal">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'ko' ? '이전 버전' : 'Previous Versions'}
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {drafts.slice(0, -1).reverse().map((draft) => (
                <div
                  key={draft.version}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setCurrentDraft(draft.text);
                    setIsEditing(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {language === 'ko' ? `버전 ${draft.version}` : `Version ${draft.version}`}
                      {draft.aiGenerated && (
                        <span className="ml-2 text-xs text-teal-600">(AI)</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(draft.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{draft.text}</p>
                </div>
              ))}
            </div>
          </ModuleCard>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => router.push('/discover/mission/step4')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <ModuleButton
            onClick={handleComplete}
            disabled={saving || !currentDraft.trim()}
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
