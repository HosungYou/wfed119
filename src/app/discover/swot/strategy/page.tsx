'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, TrendingUp, Plus, X, Sparkles, RefreshCw, Edit2, Save } from 'lucide-react';
import { StepProgress } from '../components/StepProgress';

interface SWOTItem {
  id: string;
  text: string;
}

interface Strategy {
  id: string;
  text: string;
  impact?: 'high' | 'medium' | 'low';
  difficulty?: 'high' | 'medium' | 'low';
}

interface StrategyData {
  so_strategies: Strategy[];
  wo_strategies: Strategy[];
  st_strategies: Strategy[];
  wt_strategies: Strategy[];
}

export default function StrategyDevelopmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [swotItems, setSwotItems] = useState<{
    strengths: SWOTItem[];
    weaknesses: SWOTItem[];
    opportunities: SWOTItem[];
    threats: SWOTItem[];
  }>({
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  });

  const [strategies, setStrategies] = useState<StrategyData>({
    so_strategies: [],
    wo_strategies: [],
    st_strategies: [],
    wt_strategies: []
  });

  const [newStrategy, setNewStrategy] = useState({
    so: '',
    wo: '',
    st: '',
    wt: ''
  });

  const [aiSuggesting, setAiSuggesting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/swot/session');
      const data = await res.json();

      if (!data.id) {
        // No SWOT session found, redirect back
        router.push('/discover/swot/analysis');
        return;
      }

      setSwotItems({
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        opportunities: data.opportunities || [],
        threats: data.threats || []
      });

      setStrategies({
        so_strategies: data.so_strategies || [],
        wo_strategies: data.wo_strategies || [],
        st_strategies: data.st_strategies || [],
        wt_strategies: data.wt_strategies || []
      });

      setLoading(false);
    } catch (error) {
      console.error('[Strategy] Error loading data:', error);
      setLoading(false);
    }
  }

  function addStrategy(type: 'so' | 'wo' | 'st' | 'wt') {
    const text = newStrategy[type].trim();
    if (!text) return;

    const newItem: Strategy = {
      id: Date.now().toString(),
      text,
      impact: 'medium',
      difficulty: 'medium'
    };

    const key = `${type}_strategies` as keyof StrategyData;
    setStrategies(prev => ({
      ...prev,
      [key]: [...prev[key], newItem]
    }));

    setNewStrategy(prev => ({ ...prev, [type]: '' }));
  }

  function removeStrategy(type: 'so' | 'wo' | 'st' | 'wt', id: string) {
    const key = `${type}_strategies` as keyof StrategyData;
    setStrategies(prev => ({
      ...prev,
      [key]: prev[key].filter(s => s.id !== id)
    }));
  }

  function updateStrategy(type: 'so' | 'wo' | 'st' | 'wt', id: string, field: 'impact' | 'difficulty', value: 'high' | 'medium' | 'low') {
    const key = `${type}_strategies` as keyof StrategyData;
    setStrategies(prev => ({
      ...prev,
      [key]: prev[key].map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  }

  async function generateAllStrategies() {
    setGenerating(true);
    try {
      const res = await fetch('/api/swot/generate-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strengths: swotItems.strengths,
          weaknesses: swotItems.weaknesses,
          opportunities: swotItems.opportunities,
          threats: swotItems.threats
        })
      });

      if (!res.ok) throw new Error('Failed to generate');

      const data = await res.json();
      setStrategies(data.strategies);
    } catch (error) {
      console.error('[Strategy] Error generating:', error);
      alert('Failed to generate strategies. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleAISuggest(type: 'so' | 'wo' | 'st' | 'wt') {
    // Individual suggestion - use full generation for now
    await generateAllStrategies();
  }

  async function handleSaveAndContinue() {
    // Validation: Each strategy type should have at least 4 items
    if (strategies.so_strategies.length < 4) {
      alert('Please add at least 4 SO strategies.');
      return;
    }
    if (strategies.wo_strategies.length < 4) {
      alert('Please add at least 4 WO strategies.');
      return;
    }
    if (strategies.st_strategies.length < 4) {
      alert('Please add at least 4 ST strategies.');
      return;
    }
    if (strategies.wt_strategies.length < 4) {
      alert('Please add at least 4 WT strategies.');
      return;
    }

    setSaving(true);

    try {
      // Convert impact/difficulty from 'high'|'medium'|'low' to numeric scores (1-10)
      const convertToNumericScore = (level: 'high' | 'medium' | 'low' = 'medium'): number => {
        switch (level) {
          case 'high': return 8;
          case 'medium': return 5;
          case 'low': return 3;
          default: return 5;
        }
      };

      // Prepare strategies with numeric scores for prioritization
      const strategiesWithScores = {
        so_strategies: strategies.so_strategies.map(s => ({
          ...s,
          impact: convertToNumericScore(s.impact),
          feasibility: 10 - convertToNumericScore(s.difficulty || 'medium') // Invert difficulty to feasibility
        })),
        wo_strategies: strategies.wo_strategies.map(s => ({
          ...s,
          impact: convertToNumericScore(s.impact),
          feasibility: 10 - convertToNumericScore(s.difficulty || 'medium')
        })),
        st_strategies: strategies.st_strategies.map(s => ({
          ...s,
          impact: convertToNumericScore(s.impact),
          feasibility: 10 - convertToNumericScore(s.difficulty || 'medium')
        })),
        wt_strategies: strategies.wt_strategies.map(s => ({
          ...s,
          impact: convertToNumericScore(s.impact),
          feasibility: 10 - convertToNumericScore(s.difficulty || 'medium')
        }))
      };

      await fetch('/api/swot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          so_strategies: strategiesWithScores.so_strategies,
          wo_strategies: strategiesWithScores.wo_strategies,
          st_strategies: strategiesWithScores.st_strategies,
          wt_strategies: strategiesWithScores.wt_strategies,
          current_stage: 'prioritization'
        })
      });

      router.push('/discover/swot/prioritization');
    } catch (error) {
      console.error('[Strategy] Error saving:', error);
      alert('Failed to save strategies. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading strategies...</p>
        </div>
      </div>
    );
  }

  const canProceed =
    strategies.so_strategies.length >= 4 &&
    strategies.wo_strategies.length >= 4 &&
    strategies.st_strategies.length >= 4 &&
    strategies.wt_strategies.length >= 4;

  const hasStrategies = strategies.so_strategies.length > 0 ||
                        strategies.wo_strategies.length > 0 ||
                        strategies.st_strategies.length > 0 ||
                        strategies.wt_strategies.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <StepProgress currentStage="strategy" />

        {/* AI Generation Prompt */}
        {!hasStrategies && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-8 text-center">
            <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Generate Strategies?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              AI will analyze your SWOT and create 16 strategic approaches (4 for each: SO, WO, ST, WT)
            </p>
            <button
              onClick={generateAllStrategies}
              disabled={generating}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generating Strategies...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Strategies with AI
                </>
              )}
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Strategy Development
          </h1>
          <p className="text-gray-600">
            Create at least 4 strategies for each SWOT combination
          </p>
        </div>

        {/* SWOT Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Your SWOT Elements</h2>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-green-700 mb-2">Strengths ({swotItems.strengths.length})</h3>
              <ul className="space-y-1 text-gray-600">
                {swotItems.strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="truncate">• {s.text}</li>
                ))}
                {swotItems.strengths.length > 3 && <li className="text-gray-400">+ {swotItems.strengths.length - 3} more</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-red-700 mb-2">Weaknesses ({swotItems.weaknesses.length})</h3>
              <ul className="space-y-1 text-gray-600">
                {swotItems.weaknesses.slice(0, 3).map((w, i) => (
                  <li key={i} className="truncate">• {w.text}</li>
                ))}
                {swotItems.weaknesses.length > 3 && <li className="text-gray-400">+ {swotItems.weaknesses.length - 3} more</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-700 mb-2">Opportunities ({swotItems.opportunities.length})</h3>
              <ul className="space-y-1 text-gray-600">
                {swotItems.opportunities.slice(0, 3).map((o, i) => (
                  <li key={i} className="truncate">• {o.text}</li>
                ))}
                {swotItems.opportunities.length > 3 && <li className="text-gray-400">+ {swotItems.opportunities.length - 3} more</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-orange-700 mb-2">Threats ({swotItems.threats.length})</h3>
              <ul className="space-y-1 text-gray-600">
                {swotItems.threats.slice(0, 3).map((t, i) => (
                  <li key={i} className="truncate">• {t.text}</li>
                ))}
                {swotItems.threats.length > 3 && <li className="text-gray-400">+ {swotItems.threats.length - 3} more</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Strategy Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <StrategySection
            title="SO Strategies"
            description="Use Strengths to take advantage of Opportunities"
            strategies={strategies.so_strategies}
            newValue={newStrategy.so}
            onNewChange={(v) => setNewStrategy(prev => ({ ...prev, so: v }))}
            onAdd={() => addStrategy('so')}
            onRemove={(id) => removeStrategy('so', id)}
            onUpdate={(id, field, value) => updateStrategy('so', id, field, value)}
            onAISuggest={() => handleAISuggest('so')}
            color="green"
            aiSuggesting={aiSuggesting}
          />

          <StrategySection
            title="WO Strategies"
            description="Overcome Weaknesses by taking advantage of Opportunities"
            strategies={strategies.wo_strategies}
            newValue={newStrategy.wo}
            onNewChange={(v) => setNewStrategy(prev => ({ ...prev, wo: v }))}
            onAdd={() => addStrategy('wo')}
            onRemove={(id) => removeStrategy('wo', id)}
            onUpdate={(id, field, value) => updateStrategy('wo', id, field, value)}
            onAISuggest={() => handleAISuggest('wo')}
            color="blue"
            aiSuggesting={aiSuggesting}
          />

          <StrategySection
            title="ST Strategies"
            description="Use Strengths to avoid Threats"
            strategies={strategies.st_strategies}
            newValue={newStrategy.st}
            onNewChange={(v) => setNewStrategy(prev => ({ ...prev, st: v }))}
            onAdd={() => addStrategy('st')}
            onRemove={(id) => removeStrategy('st', id)}
            onUpdate={(id, field, value) => updateStrategy('st', id, field, value)}
            onAISuggest={() => handleAISuggest('st')}
            color="purple"
            aiSuggesting={aiSuggesting}
          />

          <StrategySection
            title="WT Strategies"
            description="Minimize Weaknesses to avoid Threats"
            strategies={strategies.wt_strategies}
            newValue={newStrategy.wt}
            onNewChange={(v) => setNewStrategy(prev => ({ ...prev, wt: v }))}
            onAdd={() => addStrategy('wt')}
            onRemove={(id) => removeStrategy('wt', id)}
            onUpdate={(id, field, value) => updateStrategy('wt', id, field, value)}
            onAISuggest={() => handleAISuggest('wt')}
            color="red"
            aiSuggesting={aiSuggesting}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/swot/analysis')}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← Back to Analysis
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={!canProceed || saving}
            className={`
              inline-flex items-center px-8 py-3 rounded-xl font-semibold
              transition-all duration-200 shadow-lg
              ${canProceed && !saving
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:scale-105'
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
                Continue to Prioritization
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Strategy Section Component
interface StrategySectionProps {
  title: string;
  description: string;
  strategies: Strategy[];
  newValue: string;
  onNewChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: 'impact' | 'difficulty', value: 'high' | 'medium' | 'low') => void;
  onAISuggest: () => void;
  color: 'green' | 'blue' | 'purple' | 'red';
  aiSuggesting: boolean;
}

function StrategySection({
  title,
  description,
  strategies,
  newValue,
  onNewChange,
  onAdd,
  onRemove,
  onUpdate,
  onAISuggest,
  color,
  aiSuggesting
}: StrategySectionProps) {
  const colorClasses = {
    green: 'border-green-300 bg-green-50',
    blue: 'border-blue-300 bg-blue-50',
    purple: 'border-purple-300 bg-purple-50',
    red: 'border-red-300 bg-red-50'
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <button
          onClick={onAISuggest}
          disabled={aiSuggesting}
          className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          AI Suggest
        </button>
      </div>

      {/* Strategies List */}
      <div className="space-y-3 mb-4 min-h-[250px]">
        {strategies.map((strategy, index) => (
          <div key={strategy.id} className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-start mb-2">
              <span className="font-semibold mr-2 text-gray-500">{index + 1}.</span>
              <p className="flex-1 text-gray-800 text-sm">{strategy.text}</p>
              <button
                onClick={() => onRemove(strategy.id)}
                className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex gap-2 ml-6">
              <select
                value={strategy.impact || 'medium'}
                onChange={(e) => onUpdate(strategy.id, 'impact', e.target.value as any)}
                className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
              >
                <option value="high">High Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="low">Low Impact</option>
              </select>
              <select
                value={strategy.difficulty || 'medium'}
                onChange={(e) => onUpdate(strategy.id, 'difficulty', e.target.value as any)}
                className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
              >
                <option value="high">High Difficulty</option>
                <option value="medium">Medium Difficulty</option>
                <option value="low">Low Difficulty</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Strategy */}
      <div className="flex gap-2">
        <textarea
          value={newValue}
          onChange={(e) => onNewChange(e.target.value)}
          placeholder="Enter a strategy..."
          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
        />
        <button
          onClick={onAdd}
          disabled={!newValue.trim()}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="mt-3 text-sm text-center text-gray-600">
        {strategies.length} / 4 minimum
      </div>
    </div>
  );
}
