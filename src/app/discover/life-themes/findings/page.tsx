'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lightbulb,
  Edit2,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useTranslation } from '@/lib/i18n';

interface FindingEntry {
  theme: string;
  relevantStories: string[];
}

export default function FindingsPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { updateStage } = useModuleProgress('life-themes');

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [findings, setFindings] = useState<FindingEntry[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FindingEntry | null>(null);

  // Fetch existing findings or generate new ones
  const fetchFindings = useCallback(async () => {
    try {
      const res = await fetch('/api/life-themes/findings');
      if (res.ok) {
        const data = await res.json();
        if (data.findings?.length > 0) {
          setFindings(data.findings);
        } else {
          // No existing findings, generate with AI
          await generateFindings();
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('[Findings] Error:', err);
      setError('Failed to load findings');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  const generateFindings = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/life-themes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'findings' }),
      });

      if (res.ok) {
        const data = await res.json();
        setFindings(data.findings || []);
      } else {
        setError('Failed to generate findings');
      }
    } catch (err) {
      console.error('[Findings] Generate error:', err);
      setError('Failed to generate findings with AI');
    } finally {
      setGenerating(false);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...findings[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editForm) {
      const newFindings = [...findings];
      newFindings[editingIndex] = editForm;
      setFindings(newFindings);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const handleContinue = async () => {
    if (findings.length === 0) {
      setError(language === 'ko' ? '계속하려면 발견 항목이 필요합니다' : 'Findings are required to continue');
      return;
    }

    setSaving(true);
    try {
      // Save findings
      await fetch('/api/life-themes/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findings }),
      });

      await updateStage('followup', 75);
      router.push('/discover/life-themes/followup');
    } catch (err) {
      console.error('[Findings] Save error:', err);
      setError('Failed to save findings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">{language === 'ko' ? '발견 내용 불러오는 중...' : 'Loading findings...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{language === 'ko' ? '7단계: 발견' : 'Step 7: Findings'}</span>
            <span className="text-sm text-gray-500">75%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all" style={{ width: '75%' }} />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4 shadow-lg">
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'ko' ? '발견 (Findings)' : 'Findings'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {language === 'ko'
              ? 'AI가 당신의 응답을 분석하여 발견한 테마와 관련 스토리입니다'
              : 'AI has analyzed your responses to find themes and relevant stories'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-5 h-5" /></button>
          </div>
        )}

        {/* AI Generation Status */}
        {generating && (
          <div className="mb-6 p-6 bg-secondary-50 border border-secondary-200 rounded-xl text-center">
            <Sparkles className="w-8 h-8 text-secondary-600 mx-auto mb-3 animate-pulse" />
            <p className="text-secondary-700 font-medium">
              {language === 'ko' ? 'AI가 테마를 분석하고 있습니다...' : 'AI is analyzing themes...'}
            </p>
          </div>
        )}

        {/* Regenerate Button */}
        {!generating && findings.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={generateFindings}
              className="flex items-center px-4 py-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {language === 'ko' ? 'AI로 다시 생성' : 'Regenerate with AI'}
            </button>
          </div>
        )}

        {/* Findings Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-primary-50 to-secondary-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-1/3">
                  {language === 'ko' ? '테마' : 'Theme'}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  {language === 'ko' ? '관련 스토리' : 'Relevant Stories'}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-24">
                  {language === 'ko' ? '편집' : 'Edit'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {findings.map((finding, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {editingIndex === index && editForm ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.theme}
                          onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          value={editForm.relevantStories.join('\n')}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            relevantStories: e.target.value.split('\n').filter(s => s.trim())
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 h-24"
                          placeholder={language === 'ko' ? '각 스토리를 새 줄에 입력' : 'Enter each story on a new line'}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                            <Check className="w-5 h-5" />
                          </button>
                          <button onClick={cancelEditing} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{finding.theme}</span>
                      </td>
                      <td className="px-6 py-4">
                        <ul className="list-disc list-inside space-y-1">
                          {finding.relevantStories.map((story, i) => (
                            <li key={i} className="text-gray-600 text-sm">{story}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => startEditing(index)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {findings.length === 0 && !generating && (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                {language === 'ko' ? '발견된 테마가 없습니다' : 'No findings yet'}
              </p>
              <button
                onClick={generateFindings}
                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {language === 'ko' ? 'AI로 생성하기' : 'Generate with AI'}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/life-themes/questions/6')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {language === 'ko' ? '질문으로 돌아가기' : 'Back to Questions'}
          </button>

          <button
            onClick={handleContinue}
            disabled={saving || findings.length === 0}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            {language === 'ko' ? '추가 질문으로' : 'Continue to Follow-up'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
