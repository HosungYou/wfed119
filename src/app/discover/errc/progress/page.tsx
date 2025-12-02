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
  Check,
  Circle,
  Clock,
  TrendingUp,
  Target,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import {
  ErrcItem,
  ErrcActionStep,
  ErrcCategory,
  ERRC_CATEGORY_LABELS,
} from '@/lib/types/errc';

const CATEGORY_COLORS: Record<ErrcCategory, { text: string; bg: string; progress: string }> = {
  eliminate: { text: 'text-red-600', bg: 'bg-red-100', progress: 'bg-red-500' },
  reduce: { text: 'text-orange-600', bg: 'bg-orange-100', progress: 'bg-orange-500' },
  raise: { text: 'text-blue-600', bg: 'bg-blue-100', progress: 'bg-blue-500' },
  create: { text: 'text-green-600', bg: 'bg-green-100', progress: 'bg-green-500' },
};

const CATEGORY_ICONS: Record<ErrcCategory, React.ReactNode> = {
  eliminate: <Minus className="w-4 h-4" />,
  reduce: <ChevronDown className="w-4 h-4" />,
  raise: <ChevronUp className="w-4 h-4" />,
  create: <Plus className="w-4 h-4" />,
};

interface ItemWithSteps extends ErrcItem {
  steps?: ErrcActionStep[];
}

interface ProgressStats {
  totalItems: number;
  totalSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  pendingSteps: number;
  byCategory: Record<ErrcCategory, { items: number; completed: number; total: number }>;
}

export default function ERRCProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ItemWithSteps[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);

  const { updateStage } = useModuleProgress('errc');

  const fetchProgress = useCallback(async () => {
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
        calculateStats(itemsWithSteps);
      }
      setLoading(false);
    } catch (err) {
      console.error('[ERRC Progress] Error:', err);
      setLoading(false);
    }
  }, []);

  const calculateStats = (itemsData: ItemWithSteps[]) => {
    const allSteps = itemsData.flatMap(item => item.steps || []);

    const byCategory: ProgressStats['byCategory'] = {
      eliminate: { items: 0, completed: 0, total: 0 },
      reduce: { items: 0, completed: 0, total: 0 },
      raise: { items: 0, completed: 0, total: 0 },
      create: { items: 0, completed: 0, total: 0 },
    };

    itemsData.forEach(item => {
      const steps = item.steps || [];
      byCategory[item.category].items++;
      byCategory[item.category].total += steps.length;
      byCategory[item.category].completed += steps.filter(s => s.status === 'completed').length;
    });

    setStats({
      totalItems: itemsData.length,
      totalSteps: allSteps.length,
      completedSteps: allSteps.filter(s => s.status === 'completed').length,
      inProgressSteps: allSteps.filter(s => s.status === 'in_progress').length,
      pendingSteps: allSteps.filter(s => s.status === 'pending').length,
      byCategory,
    });
  };

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handleToggleStep = async (itemId: string, stepId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      const res = await fetch(`/api/errc/items/${itemId}/steps?id=${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchProgress();
      }
    } catch (err) {
      console.error('[ERRC Progress] Toggle error:', err);
    }
  };

  const handleContinue = async () => {
    try {
      await fetch('/api/errc/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_step: 'reflection' }),
      });
      await updateStage('reflection', 70);
      router.push('/discover/errc/journal');
    } catch (err) {
      console.error('[ERRC Progress] Continue error:', err);
    }
  };

  const getOverallProgress = () => {
    if (!stats || stats.totalSteps === 0) return 0;
    return Math.round((stats.completedSteps / stats.totalSteps) * 100);
  };

  const getCategoryProgress = (category: ErrcCategory) => {
    if (!stats || stats.byCategory[category].total === 0) return 0;
    return Math.round((stats.byCategory[category].completed / stats.byCategory[category].total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Tracking</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Monitor your progress and celebrate your achievements
          </p>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Overall Progress</h2>
                <p className="text-sm text-gray-500">Your ERRC action plan completion</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-rose-600">{getOverallProgress()}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>

          <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-600 transition-all duration-500"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{stats?.totalItems || 0}</div>
              <div className="text-sm text-gray-500">ERRC Items</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{stats?.completedSteps || 0}</div>
              <div className="text-sm text-gray-500">Completed Steps</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{stats?.inProgressSteps || 0}</div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-600">{stats?.pendingSteps || 0}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>
        </div>

        {/* Category Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {(Object.keys(CATEGORY_COLORS) as ErrcCategory[]).map(category => {
            const colors = CATEGORY_COLORS[category];
            const progress = getCategoryProgress(category);
            const categoryStats = stats?.byCategory[category];

            return (
              <div key={category} className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                      {CATEGORY_ICONS[category]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{ERRC_CATEGORY_LABELS[category]}</h3>
                      <p className="text-xs text-gray-500">
                        {categoryStats?.items || 0} items • {categoryStats?.total || 0} steps
                      </p>
                    </div>
                  </div>
                  <span className={`text-xl font-bold ${colors.text}`}>{progress}%</span>
                </div>

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.progress} transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {categoryStats?.completed || 0} of {categoryStats?.total || 0} steps completed
                </div>
              </div>
            );
          })}
        </div>

        {/* Items with Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            Detailed Progress
          </h2>

          <div className="space-y-4">
            {items.map(item => {
              const colors = CATEGORY_COLORS[item.category];
              const itemSteps = item.steps || [];
              const completedSteps = itemSteps.filter(s => s.status === 'completed').length;
              const itemProgress = itemSteps.length > 0
                ? Math.round((completedSteps / itemSteps.length) * 100)
                : 0;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border-2 ${
                    itemProgress === 100 ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>
                        {CATEGORY_ICONS[item.category]}
                      </div>
                      <div>
                        <span className={`text-xs font-medium uppercase ${colors.text}`}>
                          {ERRC_CATEGORY_LABELS[item.category]}
                        </span>
                        <h4 className="font-medium text-gray-900">{item.content}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {itemProgress === 100 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Complete
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-600">
                        {completedSteps}/{itemSteps.length}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full ${itemProgress === 100 ? 'bg-green-500' : colors.progress} transition-all`}
                      style={{ width: `${itemProgress}%` }}
                    />
                  </div>

                  {/* Steps */}
                  {itemSteps.length > 0 && (
                    <div className="space-y-2">
                      {itemSteps.map((step, idx) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <button
                            onClick={() => handleToggleStep(item.id, step.id, step.status)}
                            className="flex-shrink-0"
                          >
                            {step.status === 'completed' ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : step.status === 'in_progress' ? (
                              <Clock className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-300" />
                            )}
                          </button>
                          <span className={step.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}>
                            {idx + 1}. {step.step_description}
                          </span>
                          {step.target_date && (
                            <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(step.target_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/errc/actions')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Actions
          </button>

          <button
            onClick={handleContinue}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Continue to Journal
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
