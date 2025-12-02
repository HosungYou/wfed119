'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Target, ArrowRight, ArrowLeft, Plus, Trash2, Lightbulb, ChevronDown, ChevronUp, AlertTriangle, AlertCircle } from 'lucide-react';

interface Role {
  id: string;
  role_number: number;
  role_name: string;
  role_description: string;
  percentage_allocation: number;
  is_wellbeing: boolean;
  goal_objectives?: Objective[];
}

interface Objective {
  id?: string;
  role_id: string;
  objective_number: number;
  objective_text: string;
  related_swot_strategies: string[];
}

interface SwotStrategies {
  so: string[];
  wo: string[];
  st: string[];
  wt: string[];
}

interface DeleteConfirmation {
  isOpen: boolean;
  roleId: string | null;
  objectiveIndex: number | null;
  objectiveText: string;
}

export default function GoalObjectivesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [objectives, setObjectives] = useState<Record<string, Objective[]>>({});
  const [swotStrategies, setSwotStrategies] = useState<SwotStrategies | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [showStrategies, setShowStrategies] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    roleId: null,
    objectiveIndex: null,
    objectiveText: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch roles
      const rolesRes = await fetch('/api/goals/roles');
      const rolesData = await rolesRes.json();
      setRoles(rolesData);

      // Initialize objectives from roles
      const objMap: Record<string, Objective[]> = {};
      rolesData.forEach((role: Role) => {
        objMap[role.id] = role.goal_objectives || [{
          role_id: role.id,
          objective_number: 1,
          objective_text: '',
          related_swot_strategies: [],
        }];
      });
      setObjectives(objMap);

      // Set first role as expanded
      if (rolesData.length > 0) {
        setExpandedRole(rolesData[0].id);
      }

      // Fetch SWOT strategies
      const swotRes = await fetch('/api/swot/session');
      if (swotRes.ok) {
        const swotData = await swotRes.json();
        setSwotStrategies({
          so: swotData.so_strategies || [],
          wo: swotData.wo_strategies || [],
          st: swotData.st_strategies || [],
          wt: swotData.wt_strategies || [],
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('[Goal Objectives] Error:', error);
      setLoading(false);
    }
  }

  function updateObjective(roleId: string, index: number, text: string) {
    setObjectives(prev => ({
      ...prev,
      [roleId]: prev[roleId].map((obj, i) =>
        i === index ? { ...obj, objective_text: text } : obj
      ),
    }));
  }

  function addObjective(roleId: string) {
    const current = objectives[roleId] || [];
    if (current.length >= 3) return;

    setObjectives(prev => ({
      ...prev,
      [roleId]: [...prev[roleId], {
        role_id: roleId,
        objective_number: prev[roleId].length + 1,
        objective_text: '',
        related_swot_strategies: [],
      }],
    }));
  }

  function requestRemoveObjective(roleId: string, index: number) {
    const current = objectives[roleId] || [];
    if (current.length <= 1) {
      setError('At least 1 objective is required.');
      return;
    }

    const objectiveText = current[index]?.objective_text || `Objective ${index + 1}`;
    setDeleteConfirmation({
      isOpen: true,
      roleId,
      objectiveIndex: index,
      objectiveText: objectiveText.length > 30 ? objectiveText.slice(0, 30) + '...' : objectiveText,
    });
  }

  function confirmRemoveObjective() {
    if (deleteConfirmation.roleId === null || deleteConfirmation.objectiveIndex === null) return;

    const { roleId, objectiveIndex } = deleteConfirmation;
    setObjectives(prev => ({
      ...prev,
      [roleId]: prev[roleId].filter((_, i) => i !== objectiveIndex).map((obj, i) => ({
        ...obj,
        objective_number: i + 1,
      })),
    }));
    setDeleteConfirmation({ isOpen: false, roleId: null, objectiveIndex: null, objectiveText: '' });
  }

  function cancelRemoveObjective() {
    setDeleteConfirmation({ isOpen: false, roleId: null, objectiveIndex: null, objectiveText: '' });
  }

  function toggleStrategy(roleId: string, objIndex: number, strategy: string) {
    setObjectives(prev => ({
      ...prev,
      [roleId]: prev[roleId].map((obj, i) => {
        if (i !== objIndex) return obj;
        const strategies = obj.related_swot_strategies || [];
        return {
          ...obj,
          related_swot_strategies: strategies.includes(strategy)
            ? strategies.filter(s => s !== strategy)
            : [...strategies, strategy],
        };
      }),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      // Save objectives for each role
      for (const roleId of Object.keys(objectives)) {
        const roleObjectives = objectives[roleId].filter(obj => obj.objective_text.trim());
        if (roleObjectives.length > 0) {
          const res = await fetch('/api/goals/objectives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role_id: roleId,
              objectives: roleObjectives,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to save objectives.');
          }
        }
      }

      router.push('/discover/goals/key-results');
    } catch (err) {
      console.error('[Goal Objectives] Error saving:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const allStrategies = swotStrategies
    ? [...swotStrategies.so, ...swotStrategies.wo, ...swotStrategies.st, ...swotStrategies.wt]
    : [];

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
            onClick={() => router.push('/discover/goals/roles')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Role Setup
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">2. Objectives</h1>
              <p className="text-sm text-gray-500">Set inspiring objectives for each role</p>
            </div>
          </div>
        </div>

        {/* SWOT Strategies Reference */}
        {allStrategies.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <button
              onClick={() => setShowStrategies(!showStrategies)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">SWOT Strategies Reference</span>
              </div>
              {showStrategies ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showStrategies && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {allStrategies.slice(0, 8).map((strategy, i) => (
                  <div key={i} className="bg-white rounded-lg p-2 text-gray-600">
                    {strategy}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                닫기
              </button>
            </div>
          </div>
        )}

        {/* Roles & Objectives */}
        <div className="space-y-4 mb-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    role.is_wellbeing ? 'bg-pink-500' : 'bg-purple-500'
                  }`}>
                    {role.role_number}
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{role.role_name}</h3>
                    <p className="text-xs text-gray-500">{role.percentage_allocation}% allocated</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-purple-600 font-medium">
                    {objectives[role.id]?.filter(o => o.objective_text.trim()).length || 0} objectives
                  </span>
                  {expandedRole === role.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedRole === role.id && (
                <div className="p-4 border-t border-gray-100 space-y-4">
                  {objectives[role.id]?.map((obj, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-purple-500 mt-2">O{index + 1}</span>
                        <div className="flex-1">
                          <textarea
                            value={obj.objective_text}
                            onChange={(e) => updateObjective(role.id, index, e.target.value)}
                            placeholder="e.g., Live an energetic life through healthy habits"
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg p-3 text-gray-700 focus:border-purple-500 outline-none resize-none"
                          />
                        </div>
                        {objectives[role.id].length > 1 && (
                          <button
                            onClick={() => requestRemoveObjective(role.id, index)}
                            className="text-gray-400 hover:text-red-500 mt-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Strategy Tags */}
                      {allStrategies.length > 0 && obj.objective_text.trim() && (
                        <div className="pl-8">
                          <p className="text-xs text-gray-500 mb-1">Related SWOT Strategies:</p>
                          <div className="flex flex-wrap gap-1">
                            {allStrategies.slice(0, 6).map((strategy, i) => (
                              <button
                                key={i}
                                onClick={() => toggleStrategy(role.id, index, strategy)}
                                className={`text-xs px-2 py-1 rounded-full transition-all ${
                                  obj.related_swot_strategies?.includes(strategy)
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {strategy.length > 20 ? strategy.slice(0, 20) + '...' : strategy}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {(objectives[role.id]?.length || 0) < 3 && (
                    <button
                      onClick={() => addObjective(role.id)}
                      className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 text-sm flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Objective (max 3)
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/goals/roles')}
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
                Next: Key Results
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Delete Objective</h3>
            </div>

            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>&quot;{deleteConfirmation.objectiveText || 'this objective'}&quot;</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              ⚠️ All key results and action plans related to this objective will also be deleted.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelRemoveObjective}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveObjective}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
