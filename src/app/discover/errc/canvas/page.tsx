'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  X,
  Edit2,
  Trash2,
  Sparkles,
  Save,
  GripVertical,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import {
  ErrcItem,
  ErrcCategory,
  ERRC_CATEGORY_LABELS,
  WELLBEING_DIMENSION_LABELS,
  WellbeingDimension,
} from '@/lib/types/errc';

interface CategoryConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
  placeholder: string;
}

const CATEGORY_CONFIGS: Record<ErrcCategory, CategoryConfig> = {
  eliminate: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <Minus className="w-5 h-5" />,
    description: 'Behaviors, habits, or activities that harm your wellbeing and should be completely removed',
    placeholder: 'e.g., Late-night phone scrolling, Negative self-talk, Procrastination on important tasks...',
  },
  reduce: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: <ChevronDown className="w-5 h-5" />,
    description: 'Activities you do too much of that you should minimize but not eliminate entirely',
    placeholder: 'e.g., Social media time, Junk food consumption, Overtime work hours...',
  },
  raise: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: <ChevronUp className="w-5 h-5" />,
    description: 'Positive behaviors you already do but should do more of',
    placeholder: 'e.g., Exercise frequency, Reading time, Quality time with family...',
  },
  create: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: <Plus className="w-5 h-5" />,
    description: 'New habits or activities you want to introduce into your life',
    placeholder: 'e.g., Morning meditation, Weekly meal prep, Monthly skill learning...',
  },
};

export default function ERRCCanvasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ErrcItem[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<Record<ErrcCategory, string[]>>({
    eliminate: [],
    reduce: [],
    raise: [],
    create: [],
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [newItem, setNewItem] = useState<{
    category: ErrcCategory | null;
    content: string;
    dimension: WellbeingDimension | null;
  }>({
    category: null,
    content: '',
    dimension: null,
  });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { updateStage } = useModuleProgress('errc');

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/errc/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('[ERRC Canvas] Error:', err);
      setError('Failed to load items');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const fetchAiSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/errc/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ based_on: 'wellbeing' }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.suggestions || {
          eliminate: [],
          reduce: [],
          raise: [],
          create: [],
        });
      }
    } catch (err) {
      console.error('[ERRC Canvas] Suggestions error:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.category || !newItem.content.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/errc/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newItem.category,
          content: newItem.content.trim(),
          wellbeing_dimension: newItem.dimension,
        }),
      });

      if (res.ok) {
        await fetchItems();
        setNewItem({ category: null, content: '', dimension: null });
      }
    } catch (err) {
      console.error('[ERRC Canvas] Add error:', err);
      setError('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<ErrcItem>) => {
    try {
      const res = await fetch(`/api/errc/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        await fetchItems();
        setEditingItem(null);
      }
    } catch (err) {
      console.error('[ERRC Canvas] Update error:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/errc/items/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchItems();
      }
    } catch (err) {
      console.error('[ERRC Canvas] Delete error:', err);
    }
  };

  const handleAddSuggestion = (category: ErrcCategory, suggestion: string) => {
    setNewItem({
      category,
      content: suggestion,
      dimension: null,
    });
  };

  const handleContinue = async () => {
    if (items.length === 0) {
      setError('Please add at least one ERRC item before continuing');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/errc/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_step: 'action_steps' }),
      });
      await updateStage('action_steps', 40);
      router.push('/discover/errc/actions');
    } catch (err) {
      console.error('[ERRC Canvas] Continue error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getItemsByCategory = (category: ErrcCategory) =>
    items.filter(item => item.category === category);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading ERRC Canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ERRC Canvas</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Identify behaviors to Eliminate, Reduce, Raise, and Create for improved wellbeing
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* AI Suggestions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Suggestions</h2>
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
              Get Suggestions Based on Wellbeing
            </button>
          </div>

          {Object.values(aiSuggestions).some(s => s.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(CATEGORY_CONFIGS) as ErrcCategory[]).map(category => {
                const config = CATEGORY_CONFIGS[category];
                const suggestions = aiSuggestions[category] || [];

                if (suggestions.length === 0) return null;

                return (
                  <div key={category} className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
                    <h3 className={`font-semibold ${config.color} mb-2`}>
                      {ERRC_CATEGORY_LABELS[category]}
                    </h3>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAddSuggestion(category, suggestion)}
                          className="w-full text-left p-2 bg-white rounded-lg text-sm text-gray-700 hover:shadow-md transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4 flex-shrink-0 text-gray-400" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ERRC Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {(Object.keys(CATEGORY_CONFIGS) as ErrcCategory[]).map(category => {
            const config = CATEGORY_CONFIGS[category];
            const categoryItems = getItemsByCategory(category);

            return (
              <div
                key={category}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${config.borderColor}`}
              >
                {/* Category Header */}
                <div className={`p-4 ${config.bgColor} border-b ${config.borderColor}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white ${config.color}`}>
                      {config.icon}
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${config.color}`}>
                        {ERRC_CATEGORY_LABELS[category]}
                      </h2>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 min-h-[200px]">
                  <div className="space-y-3">
                    {categoryItems.map(item => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border ${config.borderColor} ${config.bgColor} group`}
                      >
                        {editingItem === item.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              defaultValue={item.content}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                              onBlur={(e) => {
                                if (e.target.value.trim() !== item.content) {
                                  handleUpdateItem(item.id, { content: e.target.value.trim() });
                                } else {
                                  setEditingItem(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                                if (e.key === 'Escape') {
                                  setEditingItem(null);
                                }
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2">
                              <GripVertical className="w-4 h-4 text-gray-300 mt-1 cursor-move" />
                              <div>
                                <p className="text-gray-800">{item.content}</p>
                                {item.wellbeing_dimension && (
                                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color}`}>
                                    {WELLBEING_DIMENSION_LABELS[item.wellbeing_dimension]}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingItem(item.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Edit2 className="w-4 h-4 text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {categoryItems.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <p>No items yet</p>
                        <p className="text-sm">{config.placeholder}</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Add Button */}
                  <button
                    onClick={() => setNewItem({ category, content: '', dimension: null })}
                    className={`mt-4 w-full p-3 rounded-xl border-2 border-dashed ${config.borderColor} ${config.color} hover:${config.bgColor} transition-colors flex items-center justify-center gap-2`}
                  >
                    <Plus className="w-5 h-5" />
                    Add Item
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Item Modal */}
        {newItem.category && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Add to {ERRC_CATEGORY_LABELS[newItem.category]}
                </h3>
                <button
                  onClick={() => setNewItem({ category: null, content: '', dimension: null })}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What would you like to {newItem.category}?
                  </label>
                  <textarea
                    value={newItem.content}
                    onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={CATEGORY_CONFIGS[newItem.category].placeholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none h-24"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Wellbeing Dimension (Optional)
                  </label>
                  <select
                    value={newItem.dimension || ''}
                    onChange={(e) => setNewItem(prev => ({
                      ...prev,
                      dimension: e.target.value as WellbeingDimension || null,
                    }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Select dimension...</option>
                    {(Object.keys(WELLBEING_DIMENSION_LABELS) as WellbeingDimension[]).map(dim => (
                      <option key={dim} value={dim}>
                        {WELLBEING_DIMENSION_LABELS[dim]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setNewItem({ category: null, content: '', dimension: null })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItem}
                    disabled={saving || !newItem.content.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Add Item'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(CATEGORY_CONFIGS) as ErrcCategory[]).map(category => {
              const config = CATEGORY_CONFIGS[category];
              const count = getItemsByCategory(category).length;

              return (
                <div key={category} className={`p-4 rounded-xl ${config.bgColor} text-center`}>
                  <div className={`text-3xl font-bold ${config.color}`}>{count}</div>
                  <div className="text-sm text-gray-600">{ERRC_CATEGORY_LABELS[category]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/errc/wellbeing')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Wellbeing
          </button>

          <button
            onClick={handleContinue}
            disabled={saving || items.length === 0}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Continue to Action Steps
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
