'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, CheckCircle2, Target } from 'lucide-react';

interface Goal {
  goal_number: number;
  role_responsibility: string;
  sub_goals: string[];
  action_plan: string;
  criteria: string;
  deadline: string;
  percentage_allocation: number;
}

export default function GoalSettingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [swotRes, goalsRes] = await Promise.all([
        fetch('/api/swot/session'),
        fetch('/api/swot/goals')
      ]);

      const swotData = await swotRes.json();
      const goalsData = await goalsRes.json();

      if (!swotData.id) {
        router.push('/discover/swot/analysis');
        return;
      }

      // Initialize 7 goals if they don't exist
      if (!goalsData || goalsData.length === 0) {
        const initialGoals: Goal[] = Array.from({ length: 7 }, (_, i) => ({
          goal_number: i + 1,
          role_responsibility: '',
          sub_goals: [],
          action_plan: '',
          criteria: '',
          deadline: '',
          percentage_allocation: 0
        }));
        setGoals(initialGoals);
      } else {
        setGoals(goalsData.sort((a: Goal, b: Goal) => a.goal_number - b.goal_number));
      }

      setLoading(false);
    } catch (error) {
      console.error('[Goals] Error loading:', error);
      setLoading(false);
    }
  }

  function updateGoal(index: number, field: keyof Goal, value: any) {
    setGoals(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleSaveAndContinue() {
    // Validation: At least 3 goals should be filled
    const filledGoals = goals.filter(g =>
      g.role_responsibility.trim() &&
      g.action_plan.trim() &&
      g.criteria.trim()
    );

    if (filledGoals.length < 3) {
      alert('Please complete at least 3 goals before continuing.');
      return;
    }

    setSaving(true);

    try {
      // Save all goals
      await fetch('/api/swot/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals })
      });

      // Update SWOT stage
      await fetch('/api/swot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_stage: 'action' })
      });

      router.push('/discover/swot/action');
    } catch (error) {
      console.error('[Goals] Error saving:', error);
      alert('Failed to save goals. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading goals...</p>
        </div>
      </div>
    );
  }

  const filledCount = goals.filter(g => g.role_responsibility.trim() && g.action_plan.trim()).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Goal Setting</h1>
          <p className="text-gray-600">Set SMART goals for 6-12 months (at least 3 goals required)</p>
        </div>

        {/* Goals Table */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="space-y-8">
            {goals.map((goal, index) => (
              <GoalCard
                key={goal.goal_number}
                goal={goal}
                index={index}
                onChange={(field, value) => updateGoal(index, field, value)}
              />
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Goals Completed</span>
            <span className="text-sm text-gray-500">{filledCount} / 7 goals</span>
          </div>
          <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
              style={{ width: `${(filledCount / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/swot/strategy')}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← Back to Strategies
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={filledCount < 3 || saving}
            className={`
              inline-flex items-center px-8 py-3 rounded-xl font-semibold
              transition-all duration-200 shadow-lg
              ${filledCount >= 3 && !saving
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                Continue to Action Plan
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  index: number;
  onChange: (field: keyof Goal, value: any) => void;
}

function GoalCard({ goal, index, onChange }: GoalCardProps) {
  const isFilled = goal.role_responsibility.trim() && goal.action_plan.trim();

  return (
    <div className={`border-2 rounded-xl p-6 transition-all ${isFilled ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
      <div className="flex items-center mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg mr-3 ${isFilled ? 'bg-green-500' : 'bg-gray-300'}`}>
          <span className="text-white font-bold">{goal.goal_number}</span>
        </div>
        <input
          type="text"
          value={goal.role_responsibility}
          onChange={(e) => onChange('role_responsibility', e.target.value)}
          placeholder="Role / Responsibility (e.g., Student, Professional, Health...)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-green-500"
        />
        {isFilled && <CheckCircle2 className="w-6 h-6 text-green-600 ml-2" />}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Action Plan</label>
          <textarea
            value={goal.action_plan}
            onChange={(e) => onChange('action_plan', e.target.value)}
            placeholder="Specific steps to achieve this goal..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Success Criteria (Measurable)</label>
          <textarea
            value={goal.criteria}
            onChange={(e) => onChange('criteria', e.target.value)}
            placeholder="How will you know you achieved this goal?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500"
            rows={3}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Deadline</label>
          <input
            type="date"
            value={goal.deadline}
            onChange={(e) => onChange('deadline', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Effort Allocation (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={goal.percentage_allocation}
            onChange={(e) => onChange('percentage_allocation', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
    </div>
  );
}
