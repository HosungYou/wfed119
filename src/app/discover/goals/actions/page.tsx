'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ClipboardCheck, ArrowRight, ArrowLeft, Plus, Trash2, Calendar, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface KeyResult {
  id: string;
  objective_id: string;
  key_result_number: number;
  key_result_text: string;
  goal_action_plans?: ActionPlan[];
}

interface ActionPlan {
  id?: string;
  key_result_id: string;
  action_number: number;
  action_text: string;
  due_date: string;
  is_completed: boolean;
}

interface Objective {
  id: string;
  objective_text: string;
  goal_key_results?: KeyResult[];
}

interface Role {
  id: string;
  role_name: string;
  goal_objectives?: Objective[];
}

export default function GoalActionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [actionPlans, setActionPlans] = useState<Record<string, ActionPlan[]>>({});
  const [expandedKR, setExpandedKR] = useState<string | null>(null);
  const [durationMonths, setDurationMonths] = useState<3 | 6 | 12>(6);
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/goals/roles');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to load roles.');
      }
      const rolesData = await res.json();
      if (!Array.isArray(rolesData)) {
        throw new Error('Roles data is invalid.');
      }
      setRoles(rolesData);

      const sessionRes = await fetch('/api/goals/session');
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData?.duration_months === 3 || sessionData?.duration_months === 6 || sessionData?.duration_months === 12) {
          setDurationMonths(sessionData.duration_months);
        }
      }

      // Initialize action plans from key results
      const apMap: Record<string, ActionPlan[]> = {};
      rolesData.forEach((role: Role) => {
        role.goal_objectives?.forEach((obj: Objective) => {
          obj.goal_key_results?.forEach((kr: KeyResult) => {
            apMap[kr.id] = kr.goal_action_plans?.length
              ? kr.goal_action_plans
              : [{
                  key_result_id: kr.id,
                  action_number: 1,
                  action_text: '',
                  due_date: '',
                  is_completed: false,
                }];
          });
        });
      });
      setActionPlans(apMap);

      // Expand first KR
      const firstKR = rolesData[0]?.goal_objectives?.[0]?.goal_key_results?.[0];
      if (firstKR) {
        setExpandedKR(firstKR.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Goal Actions] Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load action plans.');
      setLoading(false);
    }
  }

  function updateAction(krId: string, index: number, updates: Partial<ActionPlan>) {
    setActionPlans(prev => ({
      ...prev,
      [krId]: prev[krId].map((ap, i) =>
        i === index ? { ...ap, ...updates } : ap
      ),
    }));
  }

  function addAction(krId: string) {
    const current = actionPlans[krId] || [];
    if (current.length >= 5) return;

    setActionPlans(prev => ({
      ...prev,
      [krId]: [...prev[krId], {
        key_result_id: krId,
        action_number: prev[krId].length + 1,
        action_text: '',
        due_date: '',
        is_completed: false,
      }],
    }));
  }

  function removeAction(krId: string, index: number) {
    const current = actionPlans[krId] || [];
    if (current.length <= 1) return;

    setActionPlans(prev => ({
      ...prev,
      [krId]: prev[krId].filter((_, i) => i !== index).map((ap, i) => ({
        ...ap,
        action_number: i + 1,
      })),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      for (const krId of Object.keys(actionPlans)) {
        const krActions = actionPlans[krId].filter(ap => ap.action_text.trim());
        if (krActions.length > 0) {
          const res = await fetch('/api/goals/action-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key_result_id: krId,
              action_plans: krActions,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to save action plans.');
          }
        }
      }

      router.push('/discover/goals/reflection');
    } catch (err) {
      console.error('[Goal Actions] Error saving:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSuggestAction(role: Role, kr: KeyResult, index: number) {
    const key = `${kr.id}-${index}`;
    setAiLoading(prev => ({ ...prev, [key]: true }));
    setError(null);

    try {
      const res = await fetch('/api/goals/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'action',
          roleName: role.role_name,
          keyResultText: kr.key_result_text,
          durationMonths,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate suggestion.');
      }

      const data = await res.json();
      if (data?.suggestion) {
        if (typeof data.suggestion !== 'string') {
          throw new Error('AI suggestion response is invalid.');
        }
        updateAction(kr.id, index, { action_text: data.suggestion });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI suggestion failed.');
    } finally {
      setAiLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const roleCount = roles.length;
  const objectiveCount = roles.reduce((sum, role) =>
    sum + (role.goal_objectives?.filter(obj => (obj.objective_text || '').trim()).length || 0), 0);
  const keyResultCount = roles.reduce((sum, role) =>
    sum + (role.goal_objectives?.reduce((objSum, obj) =>
      objSum + (obj.goal_key_results?.filter(kr => (kr.key_result_text || '').trim()).length || 0), 0) || 0), 0);
  const actionCount = Object.values(actionPlans)
    .reduce((sum, list) => sum + list.filter(ap => (ap.action_text || '').trim()).length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/discover/goals/key-results')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Key Results
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">4. Action Plans</h1>
              <p className="text-sm text-gray-500">Plan specific actions to achieve each key result</p>
            </div>
          </div>
        </div>

        {/* Goal Summary */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Goal Horizon: <span className="font-semibold text-gray-900">{durationMonths} months</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Roles: <span className="font-semibold text-gray-900">{roleCount}</span></span>
            <span>Objectives: <span className="font-semibold text-gray-900">{objectiveCount}</span></span>
            <span>Key Results: <span className="font-semibold text-gray-900">{keyResultCount}</span></span>
            <span>Actions: <span className="font-semibold text-gray-900">{actionCount}</span></span>
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
              Action plans make progress real. Small, scheduled steps create momentum and reduce procrastination.
            </p>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Start with the first small step. Build momentum with actions that are easy to begin.
          </p>
        </div>

        <div className="text-xs text-gray-500 mb-4">
          Optional: Use AI Suggest for a starter action, then tailor it to your routine.
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

        {/* Key Results with Actions */}
        <div className="space-y-4 mb-6">
          {roles.map((role) =>
            role.goal_objectives?.map((obj) =>
              obj.goal_key_results?.map((kr) => (
                <div key={kr.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <button
                    onClick={() => setExpandedKR(expandedKR === kr.id ? null : kr.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        KR
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-purple-600 font-medium">{role.role_name}</p>
                        <h3 className="font-medium text-gray-900 line-clamp-1">
                          {kr.key_result_text || '(No key result)'}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-purple-600 font-medium">
                        {actionPlans[kr.id]?.filter(ap => (ap.action_text || '').trim()).length || 0} actions
                      </span>
                      {expandedKR === kr.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedKR === kr.id && (
                    <div className="p-4 border-t border-gray-100 space-y-3">
                      {actionPlans[kr.id]?.map((ap, index) => (
                        <div key={index} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                          <button
                            onClick={() => updateAction(kr.id, index, { is_completed: !ap.is_completed })}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                              ap.is_completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-purple-400'
                            }`}
                          >
                            {ap.is_completed && <Check className="w-4 h-4" />}
                          </button>

                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={ap.action_text}
                              onChange={(e) => updateAction(kr.id, index, { action_text: e.target.value })}
                              placeholder="e.g., Set a 10pm reminder each night"
                              className={`w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-purple-500 outline-none ${
                                ap.is_completed ? 'line-through text-gray-400' : ''
                              }`}
                            />
                            <button
                              onClick={() => handleSuggestAction(role, kr, index)}
                              className="text-xs px-2 py-1 rounded-md border border-purple-200 text-purple-700 hover:bg-purple-50"
                              disabled={aiLoading[`${kr.id}-${index}`]}
                            >
                              {aiLoading[`${kr.id}-${index}`] ? 'AI...' : 'AI Suggest'}
                            </button>

                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <input
                                type="date"
                                value={ap.due_date}
                                onChange={(e) => updateAction(kr.id, index, { due_date: e.target.value })}
                                className="border border-gray-200 rounded-lg p-1 text-sm focus:border-purple-500 outline-none"
                              />
                            </div>
                          </div>

                          {actionPlans[kr.id].length > 1 && (
                            <button
                              onClick={() => removeAction(kr.id, index)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      {(actionPlans[kr.id]?.length || 0) < 5 && (
                        <button
                          onClick={() => addAction(kr.id)}
                          className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 text-sm flex items-center justify-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Action (max 5)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/goals/key-results')}
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
                Saving...
              </>
            ) : (
              <>
                Save & Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
