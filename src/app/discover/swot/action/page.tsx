'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, X, Plus, Trash2, Zap, TrendingDown, TrendingUp, PlusCircle } from 'lucide-react';

interface ERRCData {
  eliminate: string[];
  reduce: string[];
  reinforce: string[];
  create_new: string[];
}

export default function ERRCActionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errcData, setERRCData] = useState<ERRCData>({
    eliminate: [],
    reduce: [],
    reinforce: [],
    create_new: []
  });

  const [newItems, setNewItems] = useState({
    eliminate: '',
    reduce: '',
    reinforce: '',
    create_new: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [swotRes, errcRes] = await Promise.all([
        fetch('/api/swot/session'),
        fetch('/api/swot/errc')
      ]);

      const swotData = await swotRes.json();
      const errcDataRes = await errcRes.json();

      if (!swotData.id) {
        router.push('/discover/swot/analysis');
        return;
      }

      if (errcDataRes.id) {
        setERRCData({
          eliminate: errcDataRes.eliminate || [],
          reduce: errcDataRes.reduce || [],
          reinforce: errcDataRes.reinforce || [],
          create_new: errcDataRes.create_new || []
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('[ERRC] Error loading:', error);
      setLoading(false);
    }
  }

  function addItem(category: keyof ERRCData) {
    const text = newItems[category].trim();
    if (!text) return;

    setERRCData(prev => ({
      ...prev,
      [category]: [...prev[category], text]
    }));

    setNewItems(prev => ({ ...prev, [category]: '' }));
  }

  function removeItem(category: keyof ERRCData, index: number) {
    setERRCData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  }

  async function handleSaveAndContinue() {
    // Validation: At least 2 items in each category
    const hasMinimum =
      errcData.eliminate.length >= 2 &&
      errcData.reduce.length >= 2 &&
      errcData.reinforce.length >= 2 &&
      errcData.create_new.length >= 2;

    if (!hasMinimum) {
      alert('Please add at least 2 items in each ERRC category.');
      return;
    }

    setSaving(true);

    try {
      await fetch('/api/swot/errc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errcData)
      });

      await fetch('/api/swot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_stage: 'reflection' })
      });

      router.push('/discover/swot/reflection');
    } catch (error) {
      console.error('[ERRC] Error saving:', error);
      alert('Failed to save ERRC plan. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading action plan...</p>
        </div>
      </div>
    );
  }

  const hasMinimum =
    errcData.eliminate.length >= 2 &&
    errcData.reduce.length >= 2 &&
    errcData.reinforce.length >= 2 &&
    errcData.create_new.length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ERRC Action Plan</h1>
          <p className="text-gray-600">
            What should you Eliminate, Reduce, Reinforce, and Create in your daily life?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            (Minimum 2 items per category)
          </p>
        </div>

        {/* ERRC Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ERRCSection
            title="Eliminate"
            icon={<Trash2 className="w-6 h-6" />}
            items={errcData.eliminate}
            newValue={newItems.eliminate}
            onNewChange={(v) => setNewItems(prev => ({ ...prev, eliminate: v }))}
            onAdd={() => addItem('eliminate')}
            onRemove={(i) => removeItem('eliminate', i)}
            color="red"
            description="Habits or activities that don't serve your goals"
          />

          <ERRCSection
            title="Reduce"
            icon={<TrendingDown className="w-6 h-6" />}
            items={errcData.reduce}
            newValue={newItems.reduce}
            onNewChange={(v) => setNewItems(prev => ({ ...prev, reduce: v }))}
            onAdd={() => addItem('reduce')}
            onRemove={(i) => removeItem('reduce', i)}
            color="orange"
            description="Activities to minimize or do less frequently"
          />

          <ERRCSection
            title="Reinforce"
            icon={<TrendingUp className="w-6 h-6" />}
            items={errcData.reinforce}
            newValue={newItems.reinforce}
            onNewChange={(v) => setNewItems(prev => ({ ...prev, reinforce: v }))}
            onAdd={() => addItem('reinforce')}
            onRemove={(i) => removeItem('reinforce', i)}
            color="blue"
            description="Positive habits to strengthen and maintain"
          />

          <ERRCSection
            title="Create"
            icon={<PlusCircle className="w-6 h-6" />}
            items={errcData.create_new}
            newValue={newItems.create_new}
            onNewChange={(v) => setNewItems(prev => ({ ...prev, create_new: v }))}
            onAdd={() => addItem('create_new')}
            onRemove={(i) => removeItem('create_new', i)}
            color="green"
            description="New habits or activities to start"
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/discover/swot/goals')}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← Back to Goals
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={!hasMinimum || saving}
            className={`
              inline-flex items-center px-8 py-3 rounded-xl font-semibold
              transition-all duration-200 shadow-lg
              ${hasMinimum && !saving
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-xl hover:scale-105'
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
                Continue to Reflection
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ERRCSectionProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  newValue: string;
  onNewChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  color: 'red' | 'orange' | 'blue' | 'green';
  description: string;
}

function ERRCSection({
  title,
  icon,
  items,
  newValue,
  onNewChange,
  onAdd,
  onRemove,
  color,
  description
}: ERRCSectionProps) {
  const colorClasses = {
    red: 'bg-red-50 border-red-300',
    orange: 'bg-orange-50 border-orange-300',
    blue: 'bg-blue-50 border-blue-300',
    green: 'bg-green-50 border-green-300'
  };

  const iconClasses = {
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color]}`}>
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-lg mr-3 ${iconClasses[color]}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 mb-4 min-h-[180px]">
        {items.map((item, index) => (
          <div key={index} className="flex items-start bg-white rounded-lg p-3 shadow-sm">
            <span className="mr-2 text-gray-500">•</span>
            <p className="flex-1 text-gray-800 text-sm">{item}</p>
            <button
              onClick={() => onRemove(index)}
              className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => onNewChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onAdd()}
          placeholder={`Add ${title.toLowerCase()} item...`}
          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={onAdd}
          disabled={!newValue.trim()}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="mt-3 text-sm text-center text-gray-600">
        {items.length} / 2 minimum
      </div>
    </div>
  );
}
