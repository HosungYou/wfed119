'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Sparkles, RefreshCw, Check, Edit2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface DraftVersion {
  version: number;
  text: string;
  createdAt: string;
  aiGenerated: boolean;
}

const STEPS = [
  { id: 'step1', label: 'Values Review', labelKo: '가치관 검토' },
  { id: 'step2', label: 'Purpose Questions', labelKo: '목적 질문' },
  { id: 'step3', label: 'Mission Draft', labelKo: '사명 초안' },
  { id: 'step4', label: 'Mission Refinement', labelKo: '사명 완성' },
];

export default function MissionStep3() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [drafts, setDrafts] = useState<DraftVersion[]>([]);
  const [currentDraft, setCurrentDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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

      if (sessionData.current_step < 3) {
        router.push(`/discover/mission/step${sessionData.current_step}`);
        return;
      }

      setSession(sessionData);
      setContext(contextData);

      if (sessionData.draft_versions && sessionData.draft_versions.length > 0) {
        setDrafts(sessionData.draft_versions);
        setCurrentDraft(sessionData.draft_versions[sessionData.draft_versions.length - 1].text);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 3] Error:', error);
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
          purposeAnswers: session?.purpose_answers,
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
      console.error('[Mission Step 3] Generate error:', error);
      alert(language === 'ko' ? '생성 실패' : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    if (!currentDraft.trim()) return;

    setSaving(true);
    try {
      // Check if this is a modified version of the latest draft
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
      console.error('[Mission Step 3] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    if (!currentDraft.trim()) {
      alert(language === 'ko'
        ? '먼저 사명 초안을 작성해주세요.'
        : 'Please create a mission draft first.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 4,
          draft_versions: drafts,
        }),
      });

      router.push('/discover/mission/step4');
    } catch (error) {
      console.error('[Mission Step 3] Next error:', error);
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 3, [1, 2]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <ModuleShell
      moduleId="mission"
      currentStep={3}
      totalSteps={4}
      title={language === 'ko' ? '사명 초안' : 'Mission Draft'}
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
                {language === 'ko' ? '목적 핵심' : 'Purpose Core'}
              </p>
              <p className="text-gray-600 text-xs">
                {session?.purpose_answers?.whatDoYouDo?.substring(0, 50)}...
              </p>
            </div>
          </div>
        </ModuleCard>

        {/* Draft Generation */}
        <ModuleCard padding="normal">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {language === 'ko' ? '사명 선언문 초안' : 'Mission Statement Draft'}
            </h2>
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
          </div>

          {!currentDraft && !generating ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {language === 'ko'
                  ? 'AI가 당신의 가치관과 목적을 바탕으로 사명 선언문 초안을 작성합니다.'
                  : 'AI will draft a mission statement based on your values and purpose.'}
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
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
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

        {/* Previous Drafts */}
        {drafts.length > 1 && (
          <ModuleCard padding="normal">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'ko' ? '이전 버전' : 'Previous Versions'}
            </h3>
            <div className="space-y-2">
              {drafts.slice(0, -1).reverse().map((draft, index) => (
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
            onClick={() => router.push('/discover/mission/step2')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <ModuleButton
            onClick={handleNext}
            disabled={saving || !currentDraft.trim()}
          >
            {language === 'ko' ? '다음: 사명 완성' : 'Next: Finalize'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
