'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, BookOpen, Target, Sparkles, Plus, X, Edit2, Check, Loader2, TrendingUp } from 'lucide-react';

interface Dream {
  id: string;
  category: 'exploration' | 'learning' | 'achievement' | 'experience';
  title: string;
  description?: string;
  life_stage?: '40s' | '50s' | '60s' | '70s+';
  related_values?: string[];
  related_roles?: string[];
  is_completed: boolean;
}

type Category = 'exploration' | 'learning' | 'achievement' | 'experience';

export default function DreamsCategoriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [activeTab, setActiveTab] = useState<Category>('exploration');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDream, setNewDream] = useState({ title: '', description: '' });

  useEffect(() => {
    loadDreams();
  }, []);

  async function loadDreams() {
    try {
      const res = await fetch('/api/dreams/session');
      if (res.ok) {
        const data = await res.json();
        setDreams(data.dreams || []);
      }
    } catch (error) {
      console.error('Failed to load dreams:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addDream() {
    if (!newDream.title.trim()) return;

    try {
      const dream: Dream = {
        id: Date.now().toString(),
        category: activeTab,
        title: newDream.title,
        description: newDream.description,
        is_completed: false
      };

      const res = await fetch('/api/dreams/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream })
      });

      if (res.ok) {
        await loadDreams();
        setNewDream({ title: '', description: '' });
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Failed to add dream:', error);
      alert('Failed to add dream. Please try again.');
    }
  }

  async function deleteDream(id: string) {
    if (!confirm('Are you sure you want to delete this dream?')) return;

    try {
      const res = await fetch(`/api/dreams/session?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await loadDreams();
      }
    } catch (error) {
      console.error('Failed to delete dream:', error);
      alert('Failed to delete dream. Please try again.');
    }
  }

  async function toggleComplete(dream: Dream) {
    try {
      const updatedDream = { ...dream, is_completed: !dream.is_completed };
      const res = await fetch('/api/dreams/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream: updatedDream })
      });

      if (res.ok) {
        await loadDreams();
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  }

  const categories = [
    { id: 'exploration', title: 'Exploration', icon: Compass, color: 'blue' },
    { id: 'learning', title: 'Learning', icon: BookOpen, color: 'purple' },
    { id: 'achievement', title: 'Achievement', icon: Target, color: 'green' },
    { id: 'experience', title: 'Experience', icon: Sparkles, color: 'orange' }
  ];

  const filteredDreams = dreams.filter(d => d.category === activeTab);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', button: 'bg-blue-600 hover:bg-blue-700' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', button: 'bg-purple-600 hover:bg-purple-700' },
      green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', button: 'bg-green-600 hover:bg-green-700' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', button: 'bg-orange-600 hover:bg-orange-700' }
    };
    return colors[color as keyof typeof colors];
  };

  const activeCategory = categories.find(c => c.id === activeTab);
  const colorClasses = activeCategory ? getColorClasses(activeCategory.color) : getColorClasses('blue');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/discover/dreams')}
              className="text-gray-600 hover:text-gray-800 mb-2"
            >
              ← Back to Dream List
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Dream Categories</h1>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeTab === category.id;
            const colors = getColorClasses(category.color);

            return (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id as Category)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? `${colors.bg} ${colors.border} ${colors.text} border-2`
                    : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {category.title}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-white' : 'bg-gray-100'
                }`}>
                  {dreams.filter(d => d.category === category.id).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dreams Grid */}
        <div className="space-y-4 mb-8">
          {filteredDreams.length === 0 && !isAdding && (
            <div className={`${colorClasses.bg} ${colorClasses.border} border-2 rounded-2xl p-12 text-center`}>
              <Sparkles className={`w-16 h-16 ${colorClasses.text} mx-auto mb-4 opacity-50`} />
              <h3 className={`text-xl font-bold ${colorClasses.text} mb-2`}>
                No {activeCategory?.title} Dreams Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start building your dream list by adding your first {activeCategory?.title.toLowerCase()} dream!
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className={`inline-flex items-center px-6 py-3 ${colorClasses.button} text-white rounded-xl font-semibold`}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Dream
              </button>
            </div>
          )}

          {filteredDreams.map((dream) => (
            <div
              key={dream.id}
              className={`bg-white border-2 rounded-xl p-4 hover:shadow-md transition-all ${
                dream.is_completed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleComplete(dream)}
                  className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    dream.is_completed
                      ? `${colorClasses.border} ${colorClasses.bg}`
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {dream.is_completed && <Check className="w-4 h-4 text-green-600" />}
                </button>
                <div className="flex-1">
                  <h4 className={`font-bold text-lg ${dream.is_completed ? 'line-through' : ''}`}>
                    {dream.title}
                  </h4>
                  {dream.description && (
                    <p className="text-gray-600 text-sm mt-1">{dream.description}</p>
                  )}
                  {dream.life_stage && (
                    <span className={`inline-block mt-2 px-3 py-1 ${colorClasses.bg} ${colorClasses.text} text-xs rounded-full`}>
                      {dream.life_stage}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteDream(dream.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Dream Form */}
        {isAdding && (
          <div className={`${colorClasses.bg} border-2 ${colorClasses.border} rounded-2xl p-6 mb-8`}>
            <h3 className={`text-lg font-bold ${colorClasses.text} mb-4`}>
              Add New {activeCategory?.title} Dream
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dream Title *
                </label>
                <input
                  type="text"
                  value={newDream.title}
                  onChange={(e) => setNewDream({ ...newDream, title: e.target.value })}
                  placeholder="What do you want to achieve?"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newDream.description}
                  onChange={(e) => setNewDream({ ...newDream, description: e.target.value })}
                  placeholder="Add more details about your dream..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addDream}
                  disabled={!newDream.title.trim()}
                  className={`flex-1 py-3 ${colorClasses.button} text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Add Dream
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewDream({ title: '', description: '' });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isAdding && filteredDreams.length > 0 && (
          <div className="flex gap-4">
            <button
              onClick={() => setIsAdding(true)}
              className={`flex-1 inline-flex items-center justify-center px-6 py-4 ${colorClasses.button} text-white rounded-xl font-semibold`}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Dream
            </button>
            <button
              onClick={() => {
                alert('AI suggestion feature coming soon!');
              }}
              className={`px-6 py-4 bg-white border-2 ${colorClasses.border} ${colorClasses.text} rounded-xl font-semibold hover:bg-gray-50`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              AI Suggest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
