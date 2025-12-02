'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Sparkles,
  Target,
  Edit2,
  Trash2,
  CheckCircle2,
  Users,
  Tv,
  Palette,
  Quote,
  BookOpen,
  Brain,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import {
  LifeThemesPattern,
  PatternSuggestion,
  QuestionNumber,
  QUESTION_CONFIG,
} from '@/lib/types/lifeThemes';

const QUESTION_ICONS: Record<QuestionNumber, React.ReactNode> = {
  1: <Users className="w-4 h-4" />,
  2: <Tv className="w-4 h-4" />,
  3: <Palette className="w-4 h-4" />,
  4: <Quote className="w-4 h-4" />,
  5: <BookOpen className="w-4 h-4" />,
  6: <Brain className="w-4 h-4" />,
};

export default function PatternsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patterns, setPatterns] = useState<LifeThemesPattern[]>([]);
  const [suggestions, setSuggestions] = useState<PatternSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPattern, setNewPattern] = useState({
    pattern_text: '',
    pattern_description: '',
    related_questions: [] as QuestionNumber[],
    evidence: [] as string[],
  });
  const [newEvidence, setNewEvidence] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { updateStage } = useModuleProgress('life-themes');

  const fetchPatterns = useCallback(async () => {
    try {
      const res = await fetch('/api/life-themes/themes?type=patterns');
      if (res.ok) {
        const data = await res.json();
        setPatterns(data || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('[Patterns] Error:', err);
      setError('Failed to load patterns');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  const fetchAiSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/life-themes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'patterns' }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        // Refresh patterns list
        await fetchPatterns();
      }
    } catch (err) {
      console.error('[Patterns] Suggestions error:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddPattern = async () => {
    if (!newPattern.pattern_text.trim()) {
      setError('Pattern name is required');
      return;
    }

    if (newPattern.related_questions.length === 0) {
      setError('Please select at least one related question');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/life-themes/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pattern',
          pattern_text: newPattern.pattern_text.trim(),
          pattern_description: newPattern.pattern_description.trim() || null,
          related_questions: newPattern.related_questions,
          evidence: newPattern.evidence.length > 0 ? newPattern.evidence : null,
          source: 'user',
        }),
      });

      if (res.ok) {
        await fetchPatterns();
        setIsAddingNew(false);
        setNewPattern({
          pattern_text: '',
          pattern_description: '',
          related_questions: [],
          evidence: [],
        });
      }
    } catch (err) {
      console.error('[Patterns] Add error:', err);
      setError('Failed to add pattern');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePattern = async (id: string) => {
    if (!confirm('Delete this pattern?')) return;

    try {
      const res = await fetch(`/api/life-themes/themes?id=${id}&type=pattern`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchPatterns();
      }
    } catch (err) {
      console.error('[Patterns] Delete error:', err);
    }
  };

  const toggleQuestionSelection = (q: QuestionNumber) => {
    setNewPattern(prev => ({
      ...prev,
      related_questions: prev.related_questions.includes(q)
        ? prev.related_questions.filter(x => x !== q)
        : [...prev.related_questions, q],
    }));
  };

  const addEvidence = () => {
    if (newEvidence.trim()) {
      setNewPattern(prev => ({
        ...prev,
        evidence: [...prev.evidence, newEvidence.trim()],
      }));
      setNewEvidence('');
    }
  };

  const handleContinue = async () => {
    if (patterns.length === 0) {
      setError('Please add at least one pattern before continuing');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/life-themes/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_step: 'themes' }),
      });
      await updateStage('themes', 70);
      router.push('/discover/life-themes/themes');
    } catch (err) {
      console.error('[Patterns] Continue error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Patterns</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Identify recurring themes that appear across your responses to different questions
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-5 h-5" /></button>
          </div>
        )}

        {/* AI Suggestions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Pattern Discovery</h2>
            </div>
            <button
              onClick={fetchAiSuggestions}
              disabled={loadingSuggestions}
              className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
            >
              {loadingSuggestions ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Discover Patterns with AI
            </button>
          </div>

          <p className="text-gray-600 text-sm mb-4">
            Let AI analyze your responses to find patterns you might have missed. The suggestions will be added automatically.
          </p>

          {suggestions.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="p-4 bg-purple-50 rounded-xl">
                  <h4 className="font-semibold text-purple-900">{suggestion.pattern_text}</h4>
                  <p className="text-sm text-purple-700 mt-1">{suggestion.pattern_description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {suggestion.related_questions.map(q => (
                      <span key={q} className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded text-xs">
                        Q{q}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patterns List */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Patterns ({patterns.length})</h2>
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pattern
            </button>
          </div>

          {patterns.length === 0 && !isAddingNew ? (
            <div className="text-center py-12 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No patterns identified yet.</p>
              <p className="text-sm mt-2">Use AI to discover patterns or add them manually.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {patterns.map(pattern => (
                <div
                  key={pattern.id}
                  className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{pattern.pattern_text}</h3>
                        {pattern.source === 'ai' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">AI</span>
                        )}
                        {pattern.confidence_score && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {Math.round(pattern.confidence_score * 100)}% confidence
                          </span>
                        )}
                      </div>
                      {pattern.pattern_description && (
                        <p className="text-gray-600 mt-1">{pattern.pattern_description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {pattern.related_questions.map(q => (
                          <span
                            key={q}
                            className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs"
                          >
                            {QUESTION_ICONS[q]}
                            {QUESTION_CONFIG[q].title}
                          </span>
                        ))}
                      </div>
                      {pattern.evidence && pattern.evidence.length > 0 && (
                        <div className="mt-3 text-sm text-gray-500">
                          <span className="font-medium">Evidence: </span>
                          {pattern.evidence.join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePattern(pattern.id)}
                      className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Pattern Form */}
        {isAddingNew && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New Pattern</h3>
                <button onClick={() => setIsAddingNew(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pattern Name *
                  </label>
                  <input
                    type="text"
                    value={newPattern.pattern_text}
                    onChange={(e) => setNewPattern(prev => ({ ...prev, pattern_text: e.target.value }))}
                    placeholder="e.g., Growth and Learning"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newPattern.pattern_description}
                    onChange={(e) => setNewPattern(prev => ({ ...prev, pattern_description: e.target.value }))}
                    placeholder="Describe how this pattern shows up in your responses"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Questions *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {([1, 2, 3, 4, 5, 6] as QuestionNumber[]).map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => toggleQuestionSelection(q)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          newPattern.related_questions.includes(q)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {newPattern.related_questions.includes(q) ? (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                          )}
                          <span className="text-sm font-medium">Q{q}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{QUESTION_CONFIG[q].title}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Evidence (Optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newEvidence}
                      onChange={(e) => setNewEvidence(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addEvidence()}
                      placeholder="Add specific examples from your responses"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={addEvidence}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>
                  {newPattern.evidence.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newPattern.evidence.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"
                        >
                          {item}
                          <button
                            onClick={() => setNewPattern(prev => ({
                              ...prev,
                              evidence: prev.evidence.filter((_, i) => i !== idx),
                            }))}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPattern}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Add Pattern'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/life-themes/questions/6')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Questions
          </button>

          <button
            onClick={handleContinue}
            disabled={saving || patterns.length === 0}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Continue to Themes
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
