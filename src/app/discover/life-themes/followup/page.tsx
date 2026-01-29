'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  MessageCircle,
  X,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useTranslation } from '@/lib/i18n';
import { FollowUpData, FindingEntry } from '@/lib/types/lifeThemes';

export default function FollowUpPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { updateStage } = useModuleProgress('life-themes');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [themes, setThemes] = useState<string[]>([]);
  const [formData, setFormData] = useState<FollowUpData>({
    enneagramConnection: '',
    integrationNotes: '',
    themePriorities: [],
    careerGuidance: '',
    selfLearning: '',
  });

  // Fetch findings to get theme names for priority ordering
  const fetchData = useCallback(async () => {
    try {
      // Get findings to show themes
      const findingsRes = await fetch('/api/life-themes/findings');
      if (findingsRes.ok) {
        const data = await findingsRes.json();
        const themeNames = (data.findings || []).map((f: FindingEntry) => f.theme);
        setThemes(themeNames);
        setFormData(prev => ({
          ...prev,
          themePriorities: themeNames,
        }));
      }

      // Get existing follow-up data if any
      const followupRes = await fetch('/api/life-themes/followup');
      if (followupRes.ok) {
        const data = await followupRes.json();
        if (data) {
          setFormData(data);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('[FollowUp] Error:', err);
      setError('Failed to load data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Drag and drop for theme priorities
  const moveTheme = (fromIndex: number, toIndex: number) => {
    const newPriorities = [...formData.themePriorities];
    const [moved] = newPriorities.splice(fromIndex, 1);
    newPriorities.splice(toIndex, 0, moved);
    setFormData({ ...formData, themePriorities: newPriorities });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      // Save follow-up data
      await fetch('/api/life-themes/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Update session to completed
      await fetch('/api/life-themes/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 'results',
          status: 'completed'
        }),
      });

      await updateStage('results', 100);
      router.push('/discover/life-themes/results');
    } catch (err) {
      console.error('[FollowUp] Submit error:', err);
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">{language === 'ko' ? '불러오는 중...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const questions = [
    {
      key: 'enneagramConnection',
      title: language === 'ko' ? '1. 에니어그램 연관성' : '1. Enneagram Connection',
      prompt: language === 'ko'
        ? '추출된 테마들이 에니어그램 유형의 특성과 어떻게 관련되어 있나요?'
        : 'How do the extracted themes relate to your Enneagram type characteristics?',
    },
    {
      key: 'integrationNotes',
      title: language === 'ko' ? '2. 통합 및 수정' : '2. Integration & Modification',
      prompt: language === 'ko'
        ? '에니어그램 결과와 통합하거나 추가, 수정할 것이 있나요?'
        : 'Is there anything you want to integrate or modify based on your Enneagram results?',
    },
    {
      key: 'careerGuidance',
      title: language === 'ko' ? '4. 커리어 가이드' : '4. Career Guidance',
      prompt: language === 'ko'
        ? '이 생애 주제들이 어떻게 당신의 커리어 개발을 안내할 수 있나요?'
        : 'How can these life themes guide your career development?',
    },
    {
      key: 'selfLearning',
      title: language === 'ko' ? '5. 자기 학습' : '5. Self Learning',
      prompt: language === 'ko'
        ? '이 활동을 통해 자신에 대해 무엇을 배웠나요?'
        : 'What did you learn about yourself through this activity?',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{language === 'ko' ? '8단계: 추가 질문' : 'Step 8: Follow-up'}</span>
            <span className="text-sm text-gray-500">85%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all" style={{ width: '85%' }} />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4 shadow-lg">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'ko' ? '추가 질문 (Follow-up)' : 'Follow-up Questions'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {language === 'ko'
              ? '발견한 테마에 대해 성찰해 보세요'
              : 'Reflect on the themes you discovered'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-5 h-5" /></button>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {/* Question 1 & 2 - Text areas */}
          {questions.slice(0, 2).map((q) => (
            <div key={q.key} className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{q.title}</h3>
              <p className="text-gray-600 mb-4">{q.prompt}</p>
              <textarea
                value={(formData as any)[q.key] || ''}
                onChange={(e) => setFormData({ ...formData, [q.key]: e.target.value })}
                placeholder={language === 'ko' ? '답변을 입력하세요...' : 'Enter your response...'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-32 resize-none"
              />
            </div>
          ))}

          {/* Question 3 - Theme Priority (Drag & Drop) */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'ko' ? '3. 테마 우선순위' : '3. Theme Priorities'}
            </h3>
            <p className="text-gray-600 mb-4">
              {language === 'ko'
                ? '테마를 드래그하여 중요도 순으로 정렬하세요 (위가 가장 중요)'
                : 'Drag themes to prioritize them (top = most important)'}
            </p>
            <div className="space-y-2">
              {formData.themePriorities.map((theme, index) => (
                <div
                  key={theme}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-move hover:bg-primary-50 hover:border-primary-200 transition-colors"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    moveTheme(fromIndex, index);
                  }}
                >
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <span className="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="flex-1 font-medium text-gray-900">{theme}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question 4 & 5 - Text areas */}
          {questions.slice(2).map((q) => (
            <div key={q.key} className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{q.title}</h3>
              <p className="text-gray-600 mb-4">{q.prompt}</p>
              <textarea
                value={(formData as any)[q.key] || ''}
                onChange={(e) => setFormData({ ...formData, [q.key]: e.target.value })}
                placeholder={language === 'ko' ? '답변을 입력하세요...' : 'Enter your response...'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-32 resize-none"
              />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => router.push('/discover/life-themes/findings')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {language === 'ko' ? '발견으로 돌아가기' : 'Back to Findings'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            {language === 'ko' ? '결과 보기' : 'View Results'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
