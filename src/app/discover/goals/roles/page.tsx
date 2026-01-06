'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Plus, Trash2, ArrowRight, ArrowLeft, AlertCircle, Heart, AlertTriangle } from 'lucide-react';
import { DEFAULT_ROLES, validateRoleAllocation } from '@/lib/types/goalSetting';

interface Role {
  id?: string;
  role_number: number;
  role_name: string;
  role_description: string;
  percentage_allocation: number;
  is_wellbeing: boolean;
}

interface DeleteConfirmation {
  isOpen: boolean;
  roleIndex: number | null;
  roleName: string;
}

export default function GoalRolesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    roleIndex: null,
    roleName: '',
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    try {
      const res = await fetch('/api/goals/roles');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setRoles(data);
        } else {
          // Initialize with default roles
          setRoles(DEFAULT_ROLES.map((r, i) => ({
            ...r,
            role_description: '',
            percentage_allocation: i === 0 ? 20 : 16, // Wellbeing gets slightly more
          })));
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('[Goal Roles] Error fetching:', error);
      setLoading(false);
    }
  }

  function updateRole(index: number, updates: Partial<Role>) {
    setRoles(prev => prev.map((role, i) =>
      i === index ? { ...role, ...updates } : role
    ));
  }

  function addRole() {
    if (roles.length >= 7) {
      setError('최대 7개의 역할만 설정할 수 있습니다.');
      return;
    }
    setRoles(prev => [...prev, {
      role_number: prev.length + 1,
      role_name: '',
      role_description: '',
      percentage_allocation: 0,
      is_wellbeing: false,
    }]);
  }

  function requestRemoveRole(index: number) {
    if (roles[index].is_wellbeing) {
      setError('The Wellbeing role cannot be deleted.');
      return;
    }
    if (roles.length <= 2) {
      setError('At least 2 roles are required.');
      return;
    }
    // Show confirmation dialog
    setDeleteConfirmation({
      isOpen: true,
      roleIndex: index,
      roleName: roles[index].role_name || `Role ${index + 1}`,
    });
  }

  function confirmRemoveRole() {
    if (deleteConfirmation.roleIndex === null) return;

    setRoles(prev => prev.filter((_, i) => i !== deleteConfirmation.roleIndex).map((role, i) => ({
      ...role,
      role_number: i + 1,
    })));
    setDeleteConfirmation({ isOpen: false, roleIndex: null, roleName: '' });
  }

  function cancelRemoveRole() {
    setDeleteConfirmation({ isOpen: false, roleIndex: null, roleName: '' });
  }

  async function handleSave() {
    setError(null);

    // Validate roles
    if (roles.some(r => !r.role_name.trim())) {
      setError('Please enter a name for all roles.');
      return;
    }

    const validation = validateRoleAllocation(roles);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/goals/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles }),
      });

      if (res.ok) {
        router.push('/discover/goals/objectives');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save.');
      }
    } catch (error) {
      console.error('[Goal Roles] Error saving:', error);
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  }

  const validation = validateRoleAllocation(roles);

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
            onClick={() => router.push('/discover/goals')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Goal Setting
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">1. Role Setup</h1>
              <p className="text-sm text-gray-500">Define 2-7 important roles in your life</p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> The first role is always &quot;Wellbeing/Self-Care&quot;.
            Add only the roles that feel most important right now (e.g., Career, Family, Personal Growth).
            The sum of allocations must equal 100%.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Roles List */}
        <div className="space-y-4 mb-6">
          {roles.map((role, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-md p-5 ${
                role.is_wellbeing ? 'ring-2 ring-pink-300' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  role.is_wellbeing ? 'bg-pink-500' : 'bg-purple-500'
                }`}>
                  {role.is_wellbeing ? <Heart className="w-4 h-4" /> : index + 1}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={role.role_name}
                      onChange={(e) => updateRole(index, { role_name: e.target.value })}
                      placeholder="Role name (e.g., Family, Career, Social)"
                      disabled={role.is_wellbeing}
                      className={`flex-1 text-lg font-medium border-b-2 border-gray-200 focus:border-purple-500 outline-none pb-1 ${
                        role.is_wellbeing ? 'bg-pink-50' : ''
                      }`}
                    />
                    {!role.is_wellbeing && (
                      <button
                        onClick={() => requestRemoveRole(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <textarea
                    value={role.role_description}
                    onChange={(e) => updateRole(index, { role_description: e.target.value })}
                    placeholder="Briefly describe your responsibilities and goals in this role..."
                    rows={2}
                    className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-2 focus:border-purple-500 outline-none resize-none"
                  />

                  <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-500">Allocation:</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={role.percentage_allocation}
                      onChange={(e) => updateRole(index, { percentage_allocation: parseInt(e.target.value) })}
                      className="flex-1 accent-purple-500"
                    />
                    <span className="text-lg font-bold text-purple-600 w-12 text-right">
                      {role.percentage_allocation}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Role Button */}
        {roles.length < 7 && (
          <button
            onClick={addRole}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-400 hover:text-purple-600 flex items-center justify-center gap-2 transition-all mb-6"
          >
            <Plus className="w-5 h-5" />
            Add Role
          </button>
        )}

        {/* Validation Status */}
        <div className={`rounded-xl p-4 mb-6 ${
          validation.isValid ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-medium ${validation.isValid ? 'text-green-700' : 'text-amber-700'}`}>
              Total Allocation: {validation.total}%
            </span>
            <span className={`text-sm ${validation.isValid ? 'text-green-600' : 'text-amber-600'}`}>
              {validation.message}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/goals')}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !validation.isValid}
            className={`px-8 py-3 rounded-full font-semibold flex items-center gap-2 ${
              saving || !validation.isValid
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
                Next: Objectives
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
              <h3 className="text-lg font-bold text-gray-900">Confirm Delete Role</h3>
            </div>

            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>&quot;{deleteConfirmation.roleName}&quot;</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              ⚠️ All objectives, key results, and action plans related to this role will also be deleted.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelRemoveRole}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveRole}
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
