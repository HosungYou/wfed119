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
  Star,
  Edit2,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import {
  LifeTheme,
  LifeThemesPattern,
  ThemeSuggestion,
} from '@/lib/types/lifeThemes';

export default function ThemesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [patterns, setPatterns] = useState<LifeThemesPattern[]>([]);
  const [suggestions, setSuggestions] = useState<ThemeSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  const [newTheme, setNewTheme] = useState({
    theme_name: '',
    theme_description: '',
    related_pattern_ids: [] as string[],
    personal_reflection: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { updateStage } = useModuleProgress('life-themes');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/life-themes/themes');
      if (res.ok) {
        const data = await res.json();
        setThemes(data.themes || []);
        setPatterns(data.patterns || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('[Themes] Error:', err);
      setError('Failed to load themes');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchAiSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/life-themes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'themes' }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('[Themes] Suggestions error:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddTheme = async (fromSuggestion?: ThemeSuggestion) => {
    const themeData = fromSuggestion ? {
      theme_name: fromSuggestion.theme_name,
      theme_description: fromSuggestion.theme_description,
      related_pattern_ids: patterns
        .filter(p => fromSuggestion.related_patterns.includes(p.pattern_text))
        .map(p => p.id),
      personal_reflection: '',
    } : newTheme;

    if (!themeData.theme_name.trim()) {
      setError('Theme name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/life-themes/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'theme',
          theme_name: themeData.theme_name.trim(),
          theme_description: themeData.theme_description.trim() || null,
          related_pattern_ids: themeData.related_pattern_ids.length > 0 ? themeData.related_pattern_ids : null,
          personal_reflection: themeData.personal_reflection.trim() || null,
        }),
      });

      if (res.ok) {
        await fetchData();
        setIsAddingNew(false);
        setNewTheme({
          theme_name: '',
          theme_description: '',
          related_pattern_ids: [],
          personal_reflection: '',
        });
        // Remove used suggestion
        if (fromSuggestion) {
          setSuggestions(prev => prev.filter(s => s.theme_name !== fromSuggestion.theme_name));
        }
      }
    } catch (err) {
      console.error('[Themes] Add error:', err);
      setError('Failed to add theme');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTheme = async (id: string, updates: Partial<LifeTheme>) => {
    try {
      const res = await fetch(`/api/life-themes/themes?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        await fetchData();
        setEditingTheme(null);
      }
    } catch (err) {
      console.error('[Themes] Update error:', err);
    }
  };

  const handleDeleteTheme = async (id: string) => {
    if (!confirm('Delete this theme?')) return;

    try {
      const res = await fetch(`/api/life-themes/themes?id=${id}&type=theme`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('[Themes] Delete error:', err);
    }
  };

  const handleReorder = async (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= themes.length) return;

    const newOrder = [...themes];
    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];

    // Optimistic update
    setThemes(newOrder);

    try {
      await fetch('/api/life-themes/themes?action=reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_ids: newOrder.map(t => t.id) }),
      });
    } catch (err) {
      // Revert on error
      await fetchData();
    }
  };

  const handleContinue = async () => {
    if (themes.length === 0) {
      setError('Please add at least one theme before continuing');
      return;
    }

    setSaving(true);
    try {
      // Generate final synthesis analysis
      await fetch('/api/life-themes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analysis', analysis_type: 'final_synthesis' }),
      });

      await fetch('/api/life-themes/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_step: 'results', status: 'completed' }),
      });
      await updateStage('results', 100);
      router.push('/discover/life-themes/results');
    } catch (err) {
      console.error('[Themes] Continue error:', err);
    } finally {
      setSaving(false);
    }
  };

  const togglePatternSelection = (patternId: string) => {
    setNewTheme(prev => ({
      ...prev,
      related_pattern_ids: prev.related_pattern_ids.includes(patternId)
        ? prev.related_pattern_ids.filter(id => id !== patternId)
        : [...prev.related_pattern_ids, patternId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading themes...</p>
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
            <Star className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Life Themes</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Synthesize your patterns into core themes that define your identity. Rank them by importance.
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
              <h2 className="text-lg font-semibold text-gray-900">AI Theme Suggestions</h2>
            </div>
            <button
              onClick={fetchAiSuggestions}
              disabled={loadingSuggestions || patterns.length === 0}
              className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
            >
              {loadingSuggestions ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Suggest Themes
            </button>
          </div>

          {patterns.length === 0 && (
            <p className="text-gray-500 text-sm">
              Add patterns first to get AI theme suggestions.
            </p>
          )}

          {suggestions.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-900">{suggestion.theme_name}</h4>
                  <p className="text-sm text-purple-700 mt-1">{suggestion.theme_description}</p>
                  <p className="text-xs text-purple-600 mt-2">{suggestion.rationale}</p>
                  <button
                    onClick={() => handleAddTheme(suggestion)}
                    disabled={saving}
                    className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                  >
                    Add This Theme
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Themes List */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Themes ({themes.length})
            </h2>
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Theme
            </button>
          </div>

          {themes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No themes identified yet.</p>
              <p className="text-sm mt-2">Add themes manually or use AI suggestions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {themes.map((theme, idx) => (
                <div
                  key={theme.id}
                  className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleReorder(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <button
                        onClick={() => handleReorder(idx, 'down')}
                        disabled={idx === themes.length - 1}
                        className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      {editingTheme === theme.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            defaultValue={theme.theme_name}
                            className="w-full px-3 py-2 border rounded-lg"
                            onBlur={(e) => handleUpdateTheme(theme.id, { theme_name: e.target.value })}
                          />
                          <textarea
                            defaultValue={theme.theme_description || ''}
                            className="w-full px-3 py-2 border rounded-lg h-20"
                            placeholder="Description"
                            onBlur={(e) => handleUpdateTheme(theme.id, { theme_description: e.target.value })}
                          />
                          <button
                            onClick={() => setEditingTheme(null)}
                            className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-gray-900 text-lg">{theme.theme_name}</h3>
                          {theme.theme_description && (
                            <p className="text-gray-600 mt-1">{theme.theme_description}</p>
                          )}
                          {theme.personal_reflection && (
                            <p className="text-sm text-indigo-600 mt-2 italic">
                              &quot;{theme.personal_reflection}&quot;
                            </p>
                          )}
                          {theme.related_pattern_ids && theme.related_pattern_ids.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {theme.related_pattern_ids.map(patternId => {
                                const pattern = patterns.find(p => p.id === patternId);
                                return pattern ? (
                                  <span
                                    key={patternId}
                                    className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs"
                                  >
                                    {pattern.pattern_text}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingTheme(theme.id)}
                        className="p-2 text-gray-400 hover:text-indigo-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTheme(theme.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Theme Form */}
        {isAddingNew && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New Theme</h3>
                <button onClick={() => setIsAddingNew(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme Name *
                  </label>
                  <input
                    type="text"
                    value={newTheme.theme_name}
                    onChange={(e) => setNewTheme(prev => ({ ...prev, theme_name: e.target.value }))}
                    placeholder="e.g., Continuous Growth"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTheme.theme_description}
                    onChange={(e) => setNewTheme(prev => ({ ...prev, theme_description: e.target.value }))}
                    placeholder="Describe what this theme means to you"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Patterns
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {patterns.map(pattern => (
                      <button
                        key={pattern.id}
                        type="button"
                        onClick={() => togglePatternSelection(pattern.id)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          newTheme.related_pattern_ids.includes(pattern.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <span className="font-medium">{pattern.pattern_text}</span>
                        {pattern.pattern_description && (
                          <p className="text-xs text-gray-500 mt-1">{pattern.pattern_description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Reflection
                  </label>
                  <textarea
                    value={newTheme.personal_reflection}
                    onChange={(e) => setNewTheme(prev => ({ ...prev, personal_reflection: e.target.value }))}
                    placeholder="What does this theme mean for your life and future?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-24"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddTheme()}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Add Theme'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/life-themes/patterns')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Patterns
          </button>

          <button
            onClick={handleContinue}
            disabled={saving || themes.length === 0}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Complete & View Results
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
