'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { REFLECTION_LABELS, type ReflectionType } from '@/lib/types/goalSetting';

interface Reflection {
  reflection_type: ReflectionType;
  reflection_text: string;
}

const REFLECTION_ORDER: ReflectionType[] = [
  'identity_alignment',
  'connectivity',
  'execution_ease',
];

export default function GoalReflectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    roleCount: 0,
    objectiveCount: 0,
    keyResultCount: 0,
    actionCount: 0,
    durationMonths: 6,
  });
  const [showWhy, setShowWhy] = useState(false);
  const [reflections, setReflections] = useState<Record<ReflectionType, string>>({
    identity_alignment: '',
    deliberation: '',
    incompleteness: '',
    diversity: '',
    connectivity: '',
    feasibility: '',
    execution_ease: '',
  });
  const [expandedPrinciple, setExpandedPrinciple] = useState<ReflectionType | null>('identity_alignment');

  useEffect(() => {
    fetchReflections();
    fetchSummary();
  }, []);

  async function fetchReflections() {
    try {
      const res = await fetch('/api/goals/reflections');
      if (res.ok) {
        const data: Reflection[] = await res.json();
        const refMap: Record<string, string> = {};
        data.forEach(r => {
          refMap[r.reflection_type] = r.reflection_text;
        });
        setReflections(prev => ({ ...prev, ...refMap }));
      }
      setLoading(false);
    } catch (error) {
      console.error('[Goal Reflections] Error:', error);
      setLoading(false);
    }
  }

  async function fetchSummary() {
    try {
      let duration = summary.durationMonths;
      const sessionRes = await fetch('/api/goals/session');
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData?.duration_months === 3 || sessionData?.duration_months === 6 || sessionData?.duration_months === 12) {
          duration = sessionData.duration_months;
        }
      }

      const rolesRes = await fetch('/api/goals/roles');
      if (!rolesRes.ok) return;
      const rolesData = await rolesRes.json();
      if (!Array.isArray(rolesData)) return;

      const roleCount = rolesData.length;
      const objectiveCount = rolesData.reduce((sum, role) =>
        sum + (role.goal_objectives?.filter((obj: { objective_text: string }) => obj.objective_text.trim()).length || 0), 0);
      const keyResultCount = rolesData.reduce((sum, role) =>
        sum + (role.goal_objectives?.reduce((objSum: number, obj: { goal_key_results?: { key_result_text: string }[] }) =>
          objSum + (obj.goal_key_results?.filter(kr => kr.key_result_text.trim()).length || 0), 0) || 0), 0);
      const actionCount = rolesData.reduce((sum, role) =>
        sum + (role.goal_objectives?.reduce((objSum: number, obj: { goal_key_results?: { goal_action_plans?: { action_text: string }[] }[] }) =>
          objSum + (obj.goal_key_results?.reduce((krSum: number, kr) =>
            krSum + (kr.goal_action_plans?.filter(ap => ap.action_text.trim()).length || 0), 0) || 0), 0) || 0), 0);

      setSummary({
        roleCount,
        objectiveCount,
        keyResultCount,
        actionCount,
        durationMonths: duration,
      });
    } catch (error) {
      console.error('[Goal Reflections] Summary error:', error);
    }
  }

  function updateReflection(type: ReflectionType, text: string) {
    setReflections(prev => ({
      ...prev,
      [type]: text,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const reflectionsList = REFLECTION_ORDER
        .filter(type => reflections[type].trim())
        .map(type => ({
          reflection_type: type,
          reflection_text: reflections[type],
        }));

      // Save reflections
      const reflectionsRes = await fetch('/api/goals/reflections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflections: reflectionsList }),
      });

      if (!reflectionsRes.ok) {
        const data = await reflectionsRes.json();
        throw new Error(data.error || 'Failed to save reflections.');
      }

      // Mark session as completed
      const sessionRes = await fetch('/api/goals/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!sessionRes.ok) {
        const data = await sessionRes.json();
        throw new Error(data.error || 'Failed to complete session.');
      }

      router.push('/discover/goals');
    } catch (err) {
      console.error('[Goal Reflections] Error saving:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const totalPrinciples = REFLECTION_ORDER.length;
  const completedCount = REFLECTION_ORDER.filter(type => reflections[type].trim().length >= 20).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/discover/goals/actions')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Action Plans
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">5. Core Principles of Goal Setting</h1>
              <p className="text-sm text-gray-500">Focus on the three most impactful principles</p>
            </div>
          </div>
        </div>

        {/* Goal Summary */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Goal Horizon: <span className="font-semibold text-gray-900">{summary.durationMonths} months</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Roles: <span className="font-semibold text-gray-900">{summary.roleCount}</span></span>
            <span>Objectives: <span className="font-semibold text-gray-900">{summary.objectiveCount}</span></span>
            <span>Key Results: <span className="font-semibold text-gray-900">{summary.keyResultCount}</span></span>
            <span>Actions: <span className="font-semibold text-gray-900">{summary.actionCount}</span></span>
          </div>
        </div>

        {/* Why This Matters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <button
            onClick={() => setShowWhy(prev => !prev)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="font-medium text-gray-900">Why this matters</span>
            <span className="text-sm text-gray-500">{showWhy ? 'Hide' : 'Show'}</span>
          </button>
          {showWhy && (
            <p className="mt-3 text-sm text-gray-600">
              A short reflection helps you spot gaps and make sure your goals align with who you are and how you work best.
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Reflection Progress</span>
            <span className="text-sm text-purple-600 font-bold">{completedCount}/{totalPrinciples}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${(completedCount / totalPrinciples) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-700 mt-1 underline"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Principles */}
        <div className="space-y-3 mb-6">
          {REFLECTION_ORDER.map((type, index) => {
            const label = REFLECTION_LABELS[type];
            const isCompleted = reflections[type].trim().length >= 20;
            const isExpanded = expandedPrinciple === type;

            return (
              <div key={type} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => setExpandedPrinciple(isExpanded ? null : type)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">{label.title}</h3>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-100">
                    <div className="bg-purple-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-purple-800">{label.description}</p>
                    </div>

                    <textarea
                      value={reflections[type]}
                      onChange={(e) => updateReflection(type, e.target.value)}
                      placeholder="Write your reflection on this principle... (min. 20 characters)"
                      rows={4}
                      className="w-full border border-gray-200 rounded-lg p-3 text-gray-700 focus:border-purple-500 outline-none resize-none"
                    />

                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${
                        reflections[type].length >= 20 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {reflections[type].length} chars / min. 20
                      </span>
                      {index < totalPrinciples - 1 && (
                        <button
                          onClick={() => setExpandedPrinciple(REFLECTION_ORDER[index + 1])}
                          className="text-sm text-purple-600 hover:text-purple-700"
                        >
                          Next Principle →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 mb-6 text-white">
          <h2 className="font-bold text-lg mb-2">Goal Setting Complete!</h2>
          <p className="text-sm text-purple-100 mb-4">
            You have established OKR-based goals and action plans focused on core alignment, connection, and execution ease.
            Regularly review your progress and adjust as needed.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xl font-bold">OKR</div>
              <div className="text-xs">Framework</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xl font-bold">3</div>
              <div className="text-xs">Principles</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xl font-bold">{completedCount}</div>
              <div className="text-xs">Reflections</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/goals/actions')}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 rounded-full font-semibold flex items-center gap-2 ${
              saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Save & Complete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
