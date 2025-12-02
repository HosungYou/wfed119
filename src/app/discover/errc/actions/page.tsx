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
  Check,
  Circle,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import {
  ErrcItem,
  ErrcActionStep,
  ErrcCategory,
  ERRC_CATEGORY_LABELS,
} from '@/lib/types/errc';

const CATEGORY_STYLES: Record<ErrcCategory, { bg: string; border: string; icon: React.ReactNode }> = {
  eliminate: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: <Minus className="w-5 h-5 text-red-600" />,
  },
  reduce: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: <ChevronDown className="w-5 h-5 text-orange-600" />,
  },
  raise: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <ChevronUp className="w-5 h-5 text-blue-600" />,
  },
  create: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: <Plus className="w-5 h-5 text-green-600" />,
  },
};

interface ItemWithSteps extends ErrcItem {
  steps?: ErrcActionStep[];
}

export default function ERRCActionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ItemWithSteps[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [newStep, setNewStep] = useState<{
    itemId: string | null;
    description: string;
    targetDate: string;
  }>({
    itemId: null,
    description: '',
    targetDate: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { updateStage } = useModuleProgress('errc');

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/errc/items');
      if (res.ok) {
        const data: ErrcItem[] = await res.json();

        // Fetch steps for each item
        const itemsWithSteps = await Promise.all(
          data.map(async (item) => {
            const stepsRes = await fetch(`/api/errc/items/${item.id}/steps`);
            const steps = stepsRes.ok ? await stepsRes.json() : [];
            return { ...item, steps };
          })
        );

        setItems(itemsWithSteps);

        // Auto-expand first item
        if (itemsWithSteps.length > 0 && !expandedItem) {
          setExpandedItem(itemsWithSteps[0].id);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('[ERRC Actions] Error:', err);
      setError('Failed to load items');
      setLoading(false);
    }
  }, [expandedItem]);

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddStep = async () => {
    if (!newStep.itemId || !newStep.description.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/errc/items/${newStep.itemId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_description: newStep.description.trim(),
          target_date: newStep.targetDate || null,
        }),
      });

      if (res.ok) {
        await fetchItems();
        setNewStep({ itemId: null, description: '', targetDate: '' });
      }
    } catch (err) {
      console.error('[ERRC Actions] Add step error:', err);
      setError('Failed to add step');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStepStatus = async (itemId: string, stepId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      const res = await fetch(`/api/errc/items/${itemId}/steps?id=${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Update local state
        setItems(prev =>
          prev.map(item => {
            if (item.id === itemId && item.steps) {
              return {
                ...item,
                steps: item.steps.map(step =>
                  step.id === stepId ? { ...step, status: newStatus } : step
                ),
              };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.error('[ERRC Actions] Toggle error:', err);
    }
  };

  const handleDeleteStep = async (itemId: string, stepId: string) => {
    if (!confirm('Delete this step?')) return;

    try {
      const res = await fetch(`/api/errc/items/${itemId}/steps?id=${stepId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Update local state
        setItems(prev =>
          prev.map(item => {
            if (item.id === itemId && item.steps) {
              return {
                ...item,
                steps: item.steps.filter(step => step.id !== stepId),
              };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.error('[ERRC Actions] Delete error:', err);
    }
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      await fetch('/api/errc/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_step: 'progress_tracking' }),
      });
      await updateStage('progress_tracking', 60);
      router.push('/discover/errc/progress');
    } catch (err) {
      console.error('[ERRC Actions] Continue error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getItemProgress = (item: ItemWithSteps) => {
    if (!item.steps || item.steps.length === 0) return 0;
    const completed = item.steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / item.steps.length) * 100);
  };

  const getTotalProgress = () => {
    const allSteps = items.flatMap(item => item.steps || []);
    if (allSteps.length === 0) return 0;
    const completed = allSteps.filter(s => s.status === 'completed').length;
    return Math.round((completed / allSteps.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading action steps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Action Steps</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Break down each ERRC item into concrete, achievable action steps
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

        {/* Overall Progress */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
            <span className="text-2xl font-bold text-rose-600">{getTotalProgress()}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-600 transition-all duration-500"
              style={{ width: `${getTotalProgress()}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {items.reduce((acc, item) => acc + (item.steps?.filter(s => s.status === 'completed').length || 0), 0)} of{' '}
            {items.reduce((acc, item) => acc + (item.steps?.length || 0), 0)} steps completed
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4 mb-8">
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <p className="text-gray-500">No ERRC items yet. Go back to the canvas to add some.</p>
              <button
                onClick={() => router.push('/discover/errc/canvas')}
                className="mt-4 px-6 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200"
              >
                Go to Canvas
              </button>
            </div>
          ) : (
            items.map(item => {
              const style = CATEGORY_STYLES[item.category];
              const isExpanded = expandedItem === item.id;
              const progress = getItemProgress(item);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${style.border}`}
                >
                  {/* Item Header */}
                  <button
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    className={`w-full p-4 ${style.bg} flex items-center justify-between text-left`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        {style.icon}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {ERRC_CATEGORY_LABELS[item.category]}
                        </span>
                        <h3 className="font-semibold text-gray-900">{item.content}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{progress}%</div>
                        <div className="text-xs text-gray-500">
                          {item.steps?.length || 0} steps
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Steps List */}
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {item.steps && item.steps.length > 0 ? (
                        item.steps.map((step, idx) => (
                          <div
                            key={step.id}
                            className={`flex items-start gap-3 p-3 rounded-xl ${
                              step.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <button
                              onClick={() => handleToggleStepStatus(item.id, step.id, step.status)}
                              className="mt-0.5"
                            >
                              {step.status === 'completed' ? (
                                <Check className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            <div className="flex-1">
                              <p className={`${step.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                {idx + 1}. {step.step_description}
                              </p>
                              {step.target_date && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(step.target_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteStep(item.id, step.id)}
                              className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-400 py-4">
                          No steps added yet
                        </p>
                      )}

                      {/* Add Step Button */}
                      <button
                        onClick={() => setNewStep({ itemId: item.id, description: '', targetDate: '' })}
                        className="w-full p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add Action Step
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Step Modal */}
        {newStep.itemId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Add Action Step</h3>
                <button
                  onClick={() => setNewStep({ itemId: null, description: '', targetDate: '' })}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Step Description
                  </label>
                  <textarea
                    value={newStep.description}
                    onChange={(e) => setNewStep(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What specific action will you take?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none h-24"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newStep.targetDate}
                    onChange={(e) => setNewStep(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setNewStep({ itemId: null, description: '', targetDate: '' })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStep}
                    disabled={saving || !newStep.description.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Add Step'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/errc/canvas')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Canvas
          </button>

          <button
            onClick={handleContinue}
            disabled={saving}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Continue to Progress Tracking
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
