'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, BarChart3, Save } from 'lucide-react';
import { StepProgress } from '../components/StepProgress';

interface Strategy {
  id: string;
  text: string;
  impact: number;
  feasibility: number;
  priority_group?: string;
}

export default function PrioritizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/swot/session');
      const data = await res.json();

      if (!data.id) {
        router.push('/discover/swot/analysis');
        return;
      }

      // Combine all strategies
      const allStrategies: Strategy[] = [
        ...(data.so_strategies || []).map((s: any) => ({ ...s, impact: s.impact || 5, feasibility: s.feasibility || 5 })),
        ...(data.wo_strategies || []).map((s: any) => ({ ...s, impact: s.impact || 5, feasibility: s.feasibility || 5 })),
        ...(data.st_strategies || []).map((s: any) => ({ ...s, impact: s.impact || 5, feasibility: s.feasibility || 5 })),
        ...(data.wt_strategies || []).map((s: any) => ({ ...s, impact: s.impact || 5, feasibility: s.feasibility || 5 }))
      ];

      setStrategies(allStrategies);
      setLoading(false);
    } catch (error) {
      console.error('[Prioritization] Error:', error);
      setLoading(false);
    }
  }

  function updateScore(id: string, field: 'impact' | 'feasibility', value: number) {
    setStrategies(prev => prev.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  }

  function getPriorityGroup(impact: number, feasibility: number): string {
    if (impact >= 6 && feasibility >= 6) return 'Execute First';
    if (impact < 6 && feasibility >= 6) return 'Quick Wins';
    if (impact >= 6 && feasibility < 6) return 'Strategic Planning';
    return 'Reconsider';
  }

  async function handleSave() {
    setSaving(true);
    try {
      const prioritizedStrategies = strategies.map(s => ({
        ...s,
        priority_group: getPriorityGroup(s.impact, s.feasibility)
      }));

      await fetch('/api/swot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_priorities: prioritizedStrategies,
          current_stage: 'reflection'  // This is valid in both schemas
        })
      });

      router.push('/discover/swot/reflection');
    } catch (error) {
      console.error('[Prioritization] Error:', error);
      alert('Failed to save priorities');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  const groupedStrategies = {
    'Execute First': strategies.filter(s => getPriorityGroup(s.impact, s.feasibility) === 'Execute First'),
    'Quick Wins': strategies.filter(s => getPriorityGroup(s.impact, s.feasibility) === 'Quick Wins'),
    'Strategic Planning': strategies.filter(s => getPriorityGroup(s.impact, s.feasibility) === 'Strategic Planning'),
    'Reconsider': strategies.filter(s => getPriorityGroup(s.impact, s.feasibility) === 'Reconsider')
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <StepProgress currentStage="prioritization" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Strategy Prioritization</h1>
          <p className="text-gray-600">Rate each strategy's Impact and Feasibility (1-10)</p>
        </div>

        {/* Strategies Rating */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Rate Your Strategies</h3>
          <div className="space-y-4">
            {strategies.map((strategy, index) => (
              <div key={strategy.id} className="border rounded-xl p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="font-semibold text-gray-500 text-sm">{index + 1}.</span>
                  <div className="flex-1">
                    <p className="text-gray-800 mb-3">{strategy.text}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Impact: {strategy.impact}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={strategy.impact}
                          onChange={(e) => updateScore(strategy.id, 'impact', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Low (1)</span>
                          <span>High (10)</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Feasibility: {strategy.feasibility}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={strategy.feasibility}
                          onChange={(e) => updateScore(strategy.id, 'feasibility', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Hard (1)</span>
                          <span>Easy (10)</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        getPriorityGroup(strategy.impact, strategy.feasibility) === 'Execute First' ? 'bg-green-100 text-green-800' :
                        getPriorityGroup(strategy.impact, strategy.feasibility) === 'Quick Wins' ? 'bg-blue-100 text-blue-800' :
                        getPriorityGroup(strategy.impact, strategy.feasibility) === 'Strategic Planning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getPriorityGroup(strategy.impact, strategy.feasibility)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Matrix */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Priority Matrix (2x2)</h3>
          <div className="grid grid-cols-2 gap-4">
            <PriorityQuadrant title="Execute First" subtitle="High Impact, High Feasibility" strategies={groupedStrategies['Execute First']} color="green" />
            <PriorityQuadrant title="Strategic Planning" subtitle="High Impact, Low Feasibility" strategies={groupedStrategies['Strategic Planning']} color="yellow" />
            <PriorityQuadrant title="Quick Wins" subtitle="Low Impact, High Feasibility" strategies={groupedStrategies['Quick Wins']} color="blue" />
            <PriorityQuadrant title="Reconsider" subtitle="Low Impact, Low Feasibility" strategies={groupedStrategies['Reconsider']} color="gray" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/swot/strategy')}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-xl transition-all disabled:opacity-50"
          >
            {saving ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Saving...</> : <>Continue to Reflection <ArrowRight className="ml-2 w-5 h-5" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function PriorityQuadrant({ title, subtitle, strategies, color }: any) {
  const colors = {
    green: 'bg-green-50 border-green-300',
    yellow: 'bg-yellow-50 border-yellow-300',
    blue: 'bg-blue-50 border-blue-300',
    gray: 'bg-gray-50 border-gray-300'
  };

  return (
    <div className={`rounded-xl border-2 p-4 min-h-[200px] ${colors[color]}`}>
      <h4 className="font-bold text-sm mb-1">{title}</h4>
      <p className="text-xs text-gray-600 mb-3">{subtitle}</p>
      <div className="space-y-2">
        {strategies.map((s: Strategy, i: number) => (
          <div key={s.id} className="text-xs bg-white rounded p-2">
            {i + 1}. {s.text.length > 50 ? s.text.substring(0, 50) + '...' : s.text}
          </div>
        ))}
        {strategies.length === 0 && <p className="text-xs text-gray-400 italic">No strategies in this category</p>}
      </div>
    </div>
  );
}
