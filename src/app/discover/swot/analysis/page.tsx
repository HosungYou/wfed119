'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Target, TrendingUp, AlertTriangle, Sparkles, Plus, X, Check } from 'lucide-react';
import { StepProgress } from '../components/StepProgress';

interface SWOTItem {
  id: string;
  text: string;
}

interface SWOTData {
  visionOrGoal: string;
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
}

export default function SWOTAnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [swotData, setSwotData] = useState<SWOTData>({
    visionOrGoal: '',
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  });

  const [newItems, setNewItems] = useState({
    strength: '',
    weakness: '',
    opportunity: '',
    threat: ''
  });

  useEffect(() => {
    loadSWOTData();
  }, []);

  async function loadSWOTData() {
    try {
      // Load existing SWOT session
      let swotSession: any = {};
      try {
        const swotRes = await fetch('/api/swot/session');
        if (swotRes.ok) {
          swotSession = await swotRes.json();
        }
      } catch (err) {
        console.log('[SWOT] Could not load existing session:', err);
      }

      // Load Vision statement if available
      let visionData: any = {};
      try {
        const visionRes = await fetch('/api/discover/vision/session');
        if (visionRes.ok) {
          visionData = await visionRes.json();
        }
      } catch (err) {
        console.log('[SWOT] Could not load vision data:', err);
      }

      // Load Strengths data
      let strengthsData: any = {};
      try {
        const strengthsRes = await fetch('/api/discover/strengths/results');
        if (strengthsRes.ok) {
          strengthsData = await strengthsRes.json();
        }
      } catch (err) {
        console.log('[SWOT] Could not load strengths data:', err);
      }

      setSwotData({
        visionOrGoal: swotSession?.vision_or_goal || visionData?.final_statement || '',
        strengths: Array.isArray(swotSession?.strengths) ? swotSession.strengths : [],
        weaknesses: Array.isArray(swotSession?.weaknesses) ? swotSession.weaknesses : [],
        opportunities: Array.isArray(swotSession?.opportunities) ? swotSession.opportunities : [],
        threats: Array.isArray(swotSession?.threats) ? swotSession.threats : []
      });

      setLoading(false);
    } catch (error) {
      console.error('[SWOT Analysis] Error loading data:', error);
      setLoading(false);
    }
  }

  async function handleSaveAndContinue() {
    // Validation: Each category must have at least 4 items
    if (swotData.strengths.length < 4) {
      alert('Please add at least 4 Strengths before continuing.');
      return;
    }
    if (swotData.weaknesses.length < 4) {
      alert('Please add at least 4 Weaknesses before continuing.');
      return;
    }
    if (swotData.opportunities.length < 4) {
      alert('Please add at least 4 Opportunities before continuing.');
      return;
    }
    if (swotData.threats.length < 4) {
      alert('Please add at least 4 Threats before continuing.');
      return;
    }
    if (!swotData.visionOrGoal.trim()) {
      alert('Please enter your vision statement or goal.');
      return;
    }

    setSaving(true);

    try {
      await fetch('/api/swot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision_or_goal: swotData.visionOrGoal,
          strengths: swotData.strengths,
          weaknesses: swotData.weaknesses,
          opportunities: swotData.opportunities,
          threats: swotData.threats,
          current_stage: 'strategy'
        })
      });

      // Navigate to strategy page
      router.push('/discover/swot/strategy');
    } catch (error) {
      console.error('[SWOT Analysis] Error saving:', error);
      alert('Failed to save SWOT analysis. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function addItem(category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats') {
    const inputKeyMap = {
      strengths: 'strength',
      weaknesses: 'weakness',
      opportunities: 'opportunity',
      threats: 'threat'
    } as const;

    const inputKey = inputKeyMap[category] as keyof typeof newItems;
    const text = newItems[inputKey].trim();

    if (!text) return;

    const newItem: SWOTItem = {
      id: Date.now().toString(),
      text
    };

    setSwotData(prev => ({
      ...prev,
      [category]: [...prev[category], newItem]
    }));

    setNewItems(prev => ({ ...prev, [inputKey]: '' }));
  }

  function removeItem(category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', id: string) {
    setSwotData(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== id)
    }));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading SWOT Analysis...</p>
        </div>
      </div>
    );
  }

  const canProceed =
    swotData.strengths.length >= 4 &&
    swotData.weaknesses.length >= 4 &&
    swotData.opportunities.length >= 4 &&
    swotData.threats.length >= 4 &&
    swotData.visionOrGoal.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <StepProgress currentStage="analysis" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SWOT Analysis
          </h1>
          <p className="text-gray-600">
            Identify at least 4 items in each category
          </p>
        </div>

        {/* Vision/Goal Input */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Vision Statement or Important Goal
          </label>
          <textarea
            value={swotData.visionOrGoal}
            onChange={(e) => setSwotData(prev => ({ ...prev, visionOrGoal: e.target.value }))}
            placeholder="Write a clear, inspiring vision statement or major goal..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
            rows={3}
          />
        </div>

        {/* SWOT Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <SWOTSection
            title="Strengths"
            subtitle="Internal Positive Factors"
            icon={<TrendingUp className="w-6 h-6" />}
            items={swotData.strengths}
            newItemValue={newItems.strength}
            onNewItemChange={(value) => setNewItems(prev => ({ ...prev, strength: value }))}
            onAdd={() => addItem('strengths')}
            onRemove={(id) => removeItem('strengths', id)}
            color="green"
            placeholder="What are you good at? What advantages do you have?"
          />

          {/* Weaknesses */}
          <SWOTSection
            title="Weaknesses"
            subtitle="Internal Negative Factors"
            icon={<AlertTriangle className="w-6 h-6" />}
            items={swotData.weaknesses}
            newItemValue={newItems.weakness}
            onNewItemChange={(value) => setNewItems(prev => ({ ...prev, weakness: value }))}
            onAdd={() => addItem('weaknesses')}
            onRemove={(id) => removeItem('weaknesses', id)}
            color="red"
            placeholder="What areas need improvement? What skills are lacking?"
          />

          {/* Opportunities */}
          <SWOTSection
            title="Opportunities"
            subtitle="External Positive Factors"
            icon={<Sparkles className="w-6 h-6" />}
            items={swotData.opportunities}
            newItemValue={newItems.opportunity}
            onNewItemChange={(value) => setNewItems(prev => ({ ...prev, opportunity: value }))}
            onAdd={() => addItem('opportunities')}
            onRemove={(id) => removeItem('opportunities', id)}
            color="blue"
            placeholder="What external trends could you capitalize on?"
          />

          {/* Threats */}
          <SWOTSection
            title="Threats"
            subtitle="External Negative Factors"
            icon={<AlertTriangle className="w-6 h-6" />}
            items={swotData.threats}
            newItemValue={newItems.threat}
            onNewItemChange={(value) => setNewItems(prev => ({ ...prev, threat: value }))}
            onAdd={() => addItem('threats')}
            onRemove={(id) => removeItem('threats', id)}
            color="orange"
            placeholder="What external challenges could hinder your progress?"
          />
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Completion Progress</span>
            <span className="text-sm text-gray-500">
              {[swotData.strengths, swotData.weaknesses, swotData.opportunities, swotData.threats].filter(arr => arr.length >= 4).length} / 4 categories
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <ProgressPill label="S" completed={swotData.strengths.length >= 4} count={swotData.strengths.length} />
            <ProgressPill label="W" completed={swotData.weaknesses.length >= 4} count={swotData.weaknesses.length} />
            <ProgressPill label="O" completed={swotData.opportunities.length >= 4} count={swotData.opportunities.length} />
            <ProgressPill label="T" completed={swotData.threats.length >= 4} count={swotData.threats.length} />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/swot')}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={!canProceed || saving}
            className={`
              inline-flex items-center px-8 py-3 rounded-xl font-semibold
              transition-all duration-200 shadow-lg
              ${canProceed && !saving
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-xl hover:scale-105'
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
                Continue to Strategy
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface SWOTSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: SWOTItem[];
  newItemValue: string;
  onNewItemChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  color: 'green' | 'red' | 'blue' | 'orange';
  placeholder: string;
}

function SWOTSection({
  title,
  subtitle,
  icon,
  items,
  newItemValue,
  onNewItemChange,
  onAdd,
  onRemove,
  color,
  placeholder
}: SWOTSectionProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-300 text-green-700',
    red: 'bg-red-50 border-red-300 text-red-700',
    blue: 'bg-blue-50 border-blue-300 text-blue-700',
    orange: 'bg-orange-50 border-orange-300 text-orange-700'
  };

  const iconColorClasses = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color]}`}>
      <div className="flex items-center mb-4">
        <div className={`p-2 rounded-lg mr-3 ${iconColorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm opacity-75">{subtitle}</p>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 mb-4 min-h-[200px]">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-start bg-white rounded-lg p-3 shadow-sm">
            <span className="font-semibold mr-2 text-gray-500">{index + 1}.</span>
            <p className="flex-1 text-gray-800">{item.text}</p>
            <button
              onClick={() => onRemove(item.id)}
              className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemValue}
          onChange={(e) => onNewItemChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        <button
          onClick={onAdd}
          disabled={!newItemValue.trim()}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Count indicator */}
      <div className="mt-3 text-sm text-center opacity-75">
        {items.length} / 4 minimum
      </div>
    </div>
  );
}

interface ProgressPillProps {
  label: string;
  completed: boolean;
  count: number;
}

function ProgressPill({ label, completed, count }: ProgressPillProps) {
  return (
    <div className={`
      flex items-center justify-center py-2 rounded-lg font-medium text-sm
      ${completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
    `}>
      {completed && <Check className="w-4 h-4 mr-1" />}
      {label}: {count}
    </div>
  );
}
