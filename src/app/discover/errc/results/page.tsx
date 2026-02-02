'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Star,
  Target,
  Heart,
  Download,
  Share2,
  Home,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import {
  ErrcSessionFull,
  ERRC_CATEGORY_LABELS,
  WELLBEING_DIMENSION_LABELS,
  WellbeingDimension,
  ErrcCategory,
  compareWellbeing,
} from '@/lib/types/errc';

const DIMENSION_COLORS: Record<WellbeingDimension, string> = {
  career: '#3B82F6',
  relationships: '#EC4899',
  health: '#22C55E',
  finances: '#EAB308',
  personal_growth: '#8B5CF6',
  leisure: '#14B8A6',
};

const CATEGORY_ICONS: Record<ErrcCategory, React.ReactNode> = {
  eliminate: <Minus className="w-5 h-5" />,
  reduce: <ChevronDown className="w-5 h-5" />,
  raise: <ChevronUp className="w-5 h-5" />,
  create: <Plus className="w-5 h-5" />,
};

const CATEGORY_COLORS: Record<ErrcCategory, string> = {
  eliminate: 'text-red-600 bg-red-50 border-red-200',
  reduce: 'text-orange-600 bg-orange-50 border-orange-200',
  raise: 'text-blue-600 bg-blue-50 border-blue-200',
  create: 'text-green-600 bg-green-50 border-green-200',
};

export default function ERRCResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ErrcSessionFull | null>(null);
  const [comparison, setComparison] = useState<ReturnType<typeof compareWellbeing> | null>(null);

  const { completeModule } = useModuleProgress('errc');

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/errc/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);

        // Calculate comparison if both assessments exist
        if (data.wellbeing_before && data.wellbeing_after) {
          const comp = compareWellbeing(
            data.wellbeing_before.scores,
            data.wellbeing_after.scores
          );
          setComparison(comp);
        }

        // Mark module as complete
        if (data.status === 'completed') {
          await completeModule();
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('[ERRC Results] Error:', err);
      setLoading(false);
    }
  }, [completeModule]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const getCompletedStepsCount = () => {
    if (!session?.items) return 0;
    return session.items.reduce((acc, item) => {
      const steps = item.action_steps || [];
      return acc + steps.filter(s => s.status === 'completed').length;
    }, 0);
  };

  const getTotalStepsCount = () => {
    if (!session?.items) return 0;
    return session.items.reduce((acc, item) => {
      return acc + (item.action_steps?.length || 0);
    }, 0);
  };

  const getItemsByCategory = (category: ErrcCategory) => {
    return session?.items?.filter(item => item.category === category) || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mb-6 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Congratulations!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            You&apos;ve completed your ERRC Action Plan journey
          </p>
        </div>

        {/* Wellbeing Comparison */}
        {comparison && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-rose-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Wellbeing Comparison</h2>
            </div>

            {/* Overall Change */}
            <div className={`p-6 rounded-xl mb-6 ${
              comparison.overallChange > 0 ? 'bg-green-50' :
              comparison.overallChange < 0 ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {comparison.overallChange > 0 ? (
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  ) : comparison.overallChange < 0 ? (
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  ) : (
                    <Target className="w-8 h-8 text-gray-600" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Overall Wellbeing</h3>
                    <p className="text-sm text-gray-600">
                      Average across all dimensions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${
                    comparison.overallChange > 0 ? 'text-green-600' :
                    comparison.overallChange < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {comparison.overallChange > 0 ? '+' : ''}{comparison.overallChange.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {comparison.afterAverage.toFixed(1)} / 10
                  </div>
                </div>
              </div>
            </div>

            {/* Dimension-by-Dimension */}
            <div className="space-y-4">
              {(Object.keys(WELLBEING_DIMENSION_LABELS) as WellbeingDimension[]).map(dimension => {
                const change = comparison.byDimension[dimension];
                const before = session?.wellbeing_before?.scores[dimension] || 0;
                const after = session?.wellbeing_after?.scores[dimension] || 0;

                return (
                  <div key={dimension} className="flex items-center gap-4">
                    <div className="w-36 font-medium text-gray-700">
                      {WELLBEING_DIMENSION_LABELS[dimension]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500 rounded-full"
                            style={{
                              width: `${after * 10}%`,
                              backgroundColor: DIMENSION_COLORS[dimension],
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{after}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Before: {before}</span>
                        <span>→</span>
                        <span className={
                          change > 0 ? 'text-green-600 font-medium' :
                          change < 0 ? 'text-red-600 font-medium' : ''
                        }>
                          {change > 0 ? '+' : ''}{change}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Improvements Summary */}
            {comparison.improved.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-xl">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" /> Areas of Improvement
                </h4>
                <div className="flex flex-wrap gap-2">
                  {comparison.improved.map(dim => (
                    <span
                      key={dim}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {WELLBEING_DIMENSION_LABELS[dim]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ERRC Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your ERRC Summary</h2>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-3xl font-bold text-gray-900">{session?.items?.length || 0}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600">{getCompletedStepsCount()}</div>
              <div className="text-sm text-gray-500">Steps Completed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">{getTotalStepsCount()}</div>
              <div className="text-sm text-gray-500">Total Steps</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">{session?.reflections?.length || 0}</div>
              <div className="text-sm text-gray-500">Reflections</div>
            </div>
          </div>

          {/* Items by Category */}
          <div className="grid md:grid-cols-2 gap-4">
            {(Object.keys(ERRC_CATEGORY_LABELS) as ErrcCategory[]).map(category => {
              const items = getItemsByCategory(category);
              const colors = CATEGORY_COLORS[category];

              return (
                <div key={category} className={`p-4 rounded-xl border-2 ${colors}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {CATEGORY_ICONS[category]}
                    <h3 className="font-semibold">{ERRC_CATEGORY_LABELS[category]}</h3>
                    <span className="ml-auto text-sm opacity-75">{items.length} items</span>
                  </div>
                  <ul className="space-y-1">
                    {items.map(item => (
                      <li key={item.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{item.content}</span>
                      </li>
                    ))}
                    {items.length === 0 && (
                      <li className="text-sm opacity-50">No items in this category</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What&apos;s Next?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/discover/errc/progress')}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-left"
            >
              <TrendingUp className="w-6 h-6 text-rose-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Continue Tracking</h3>
              <p className="text-sm text-gray-600">Keep monitoring your progress</p>
            </button>

            <button
              onClick={() => router.push('/discover/errc/journal')}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-left"
            >
              <Star className="w-6 h-6 text-rose-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Add Reflection</h3>
              <p className="text-sm text-gray-600">Document your insights</p>
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-left"
            >
              <Home className="w-6 h-6 text-rose-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Explore More</h3>
              <p className="text-sm text-gray-600">Discover other modules</p>
            </button>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <h2 className="text-2xl font-semibold mb-4">Key Takeaways</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <span>
                You&apos;ve identified {session?.items?.length || 0} specific behaviors to change using the ERRC framework
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <span>
                You&apos;ve created {getTotalStepsCount()} actionable steps and completed {getCompletedStepsCount()} of them
              </span>
            </li>
            {comparison && comparison.overallChange > 0 && (
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span>
                  Your overall wellbeing improved by {comparison.overallChange.toFixed(1)} points
                </span>
              </li>
            )}
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <span>
                Continue tracking your progress and adjust your plan as needed
              </span>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => router.push('/discover/errc')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Overview
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Continue to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
