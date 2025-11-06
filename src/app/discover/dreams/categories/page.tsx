'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Compass, BookOpen, Target, Sparkles, Plus, X, Check, Loader2, TrendingUp, Grid3x3, Calendar, LayoutGrid, Heart, Brain, Dumbbell, Home, DollarSign, Briefcase, Coffee, Users } from 'lucide-react';

interface Dream {
  id: string;
  category: 'exploration' | 'learning' | 'achievement' | 'experience';
  title: string;
  description?: string;
  life_stage?: '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';
  wellbeing_area?: 'relationship' | 'competency' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure';
  related_values?: string[];
  related_roles?: string[];
  is_completed: boolean;
}

type Category = 'exploration' | 'learning' | 'achievement' | 'experience';
type ViewMode = 'category' | 'timeline' | 'matrix';
type LifeStage = '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';
type WellbeingArea = 'relationship' | 'competency' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure';

export default function DreamsCategoriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [activeTab, setActiveTab] = useState<Category>('exploration');
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [isAdding, setIsAdding] = useState(false);
  const [newDream, setNewDream] = useState({ title: '', description: '', life_stage: undefined as LifeStage | undefined });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ wellbeing: WellbeingArea; lifeStage: LifeStage } | null>(null);

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
        life_stage: newDream.life_stage,
        is_completed: false
      };

      const res = await fetch('/api/dreams/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream })
      });

      if (res.ok) {
        await loadDreams();
        setNewDream({ title: '', description: '', life_stage: undefined });
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

  async function updateLifeStage(dream: Dream, lifeStage: LifeStage | undefined) {
    try {
      const updatedDream = { ...dream, life_stage: lifeStage };
      const res = await fetch('/api/dreams/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream: updatedDream })
      });

      if (res.ok) {
        await loadDreams();
      }
    } catch (error) {
      console.error('Failed to update life stage:', error);
    }
  }

  async function handleAISuggest() {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/dreams/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.suggestions || []);
        setShowAIModal(true);
      } else {
        alert('Failed to generate AI suggestions. Please make sure you have completed Values, Strengths, or Vision modules first.');
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      alert('Failed to generate AI suggestions. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }

  async function addSuggestedDream(suggestion: any) {
    try {
      const dream: Dream = {
        id: Date.now().toString(),
        category: suggestion.category,
        title: suggestion.title,
        description: suggestion.description,
        life_stage: suggestion.life_stage,
        wellbeing_area: suggestion.wellbeing_area,
        related_values: suggestion.related_values,
        is_completed: false
      };

      const res = await fetch('/api/dreams/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream })
      });

      if (res.ok) {
        await loadDreams();
        setAiSuggestions(prev => prev.filter(s => s !== suggestion));
      }
    } catch (error) {
      console.error('Failed to add suggested dream:', error);
      alert('Failed to add dream. Please try again.');
    }
  }

  async function updateDreamWellbeing(dreamId: string, wellbeing: WellbeingArea, lifeStage: LifeStage) {
    const dream = dreams.find(d => d.id === dreamId);
    if (!dream) return;

    try {
      const updatedDream = { ...dream, wellbeing_area: wellbeing, life_stage: lifeStage };
      const res = await fetch('/api/dreams/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream: updatedDream })
      });

      if (res.ok) {
        await loadDreams();
      }
    } catch (error) {
      console.error('Failed to update dream:', error);
    }
  }

  function handleDragEnd(result: any) {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const destId = destination.droppableId;

    if (destId === 'unassigned') return;

    // Parse destination: "cell-relationship-20s"
    const parts = destId.split('-');
    if (parts.length !== 3 || parts[0] !== 'cell') return;

    const wellbeing = parts[1] as WellbeingArea;
    const lifeStage = parts[2] as LifeStage;

    updateDreamWellbeing(draggableId, wellbeing, lifeStage);
  }

  const categories = [
    { id: 'exploration', title: 'Exploration', icon: Compass, color: 'blue' },
    { id: 'learning', title: 'Learning', icon: BookOpen, color: 'purple' },
    { id: 'achievement', title: 'Achievement', icon: Target, color: 'green' },
    { id: 'experience', title: 'Experience', icon: Sparkles, color: 'orange' }
  ];

  const lifeStages: LifeStage[] = ['20s', '30s', '40s', '50s', '60s', '70s+'];

  const wellbeingAreas: { id: WellbeingArea; name: string; nameKo: string; icon: any }[] = [
    { id: 'relationship', name: 'Relationship', nameKo: '관계/정서', icon: Heart },
    { id: 'competency', name: 'Competency', nameKo: '역량', icon: TrendingUp },
    { id: 'intellectual', name: 'Intellectual', nameKo: '지적', icon: Brain },
    { id: 'physical', name: 'Physical', nameKo: '신체적', icon: Dumbbell },
    { id: 'environment', name: 'Environment', nameKo: '환경(주거)', icon: Home },
    { id: 'financial', name: 'Financial', nameKo: '재정', icon: DollarSign },
    { id: 'career', name: 'Career', nameKo: '직업', icon: Briefcase },
    { id: 'leisure', name: 'Leisure', nameKo: '여가', icon: Coffee }
  ];

  const filteredDreams = dreams.filter(d => d.category === activeTab);
  const unassignedDreams = dreams.filter(d => !d.wellbeing_area || !d.life_stage);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', button: 'bg-blue-600 hover:bg-blue-700' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', button: 'bg-purple-600 hover:bg-purple-700' },
      green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', button: 'bg-green-600 hover:bg-green-700' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', button: 'bg-orange-600 hover:bg-orange-700' }
    };
    return colors[color as keyof typeof colors];
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      exploration: Compass,
      learning: BookOpen,
      achievement: Target,
      experience: Sparkles
    };
    return icons[category as keyof typeof icons] || Sparkles;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      exploration: 'text-blue-600 bg-blue-50',
      learning: 'text-purple-600 bg-purple-50',
      achievement: 'text-green-600 bg-green-50',
      experience: 'text-orange-600 bg-orange-50'
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getCellDreams = (wellbeing: WellbeingArea, lifeStage: LifeStage) => {
    return dreams.filter(d => d.wellbeing_area === wellbeing && d.life_stage === lifeStage);
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => router.push('/discover/dreams')}
                className="text-gray-600 hover:text-gray-800 mb-2"
              >
                ← Back to Dream List
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {viewMode === 'category' && 'Dream Categories'}
                {viewMode === 'timeline' && 'Life Stage Timeline'}
                {viewMode === 'matrix' && 'Dream Matrix'}
              </h1>
            </div>
            {/* View Toggle */}
            <div className="flex bg-white rounded-xl border-2 border-gray-200 p-1">
              <button
                onClick={() => setViewMode('category')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'category'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                Category
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Timeline
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'matrix'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Matrix
              </button>
            </div>
          </div>

          {/* Category View */}
          {viewMode === 'category' && (
            <>
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
                        <div className="flex items-center gap-2 mt-2">
                          {/* Life Stage Dropdown */}
                          <select
                            value={dream.life_stage || ''}
                            onChange={(e) => updateLifeStage(dream, e.target.value as LifeStage || undefined)}
                            className="px-3 py-1 text-xs border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">No life stage</option>
                            {lifeStages.map(stage => (
                              <option key={stage} value={stage}>{stage}</option>
                            ))}
                          </select>
                        </div>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Life Stage (Optional)
                      </label>
                      <select
                        value={newDream.life_stage || ''}
                        onChange={(e) => setNewDream({ ...newDream, life_stage: e.target.value as LifeStage || undefined })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select life stage</option>
                        {lifeStages.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
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
                          setNewDream({ title: '', description: '', life_stage: undefined });
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
                    onClick={handleAISuggest}
                    disabled={aiGenerating}
                    className={`px-6 py-4 bg-white border-2 ${colorClasses.border} ${colorClasses.text} rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50`}
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 inline animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5 inline mr-2" />
                        AI Suggest
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="space-y-6">
              {lifeStages.map((stage) => {
                const stageDreams = dreams.filter(d => d.life_stage === stage);

                return (
                  <div key={stage} className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-purple-600" />
                        <h3 className="text-xl font-bold text-gray-900">{stage}</h3>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                          {stageDreams.length} {stageDreams.length === 1 ? 'dream' : 'dreams'}
                        </span>
                      </div>
                    </div>

                    {stageDreams.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>No dreams planned for this decade yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stageDreams.map((dream) => {
                          const Icon = getCategoryIcon(dream.category);
                          const colorClass = getCategoryColor(dream.category);

                          return (
                            <div
                              key={dream.id}
                              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Icon className={`w-5 h-5 mt-0.5 ${colorClass.split(' ')[0]}`} />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{dream.title}</h4>
                                {dream.description && (
                                  <p className="text-sm text-gray-600 mt-1">{dream.description}</p>
                                )}
                                <span className="inline-block mt-2 px-2 py-1 bg-white text-xs rounded-full capitalize">
                                  {dream.category}
                                </span>
                              </div>
                              <button
                                onClick={() => deleteDream(dream.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5 text-red-500" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unassigned Dreams */}
              {dreams.filter(d => !d.life_stage).length > 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-yellow-900 mb-4">
                    Unscheduled Dreams ({dreams.filter(d => !d.life_stage).length})
                  </h3>
                  <p className="text-sm text-yellow-800 mb-4">
                    These dreams haven't been assigned to a life stage yet. Switch to Category view to assign them!
                  </p>
                  <div className="space-y-2">
                    {dreams.filter(d => !d.life_stage).map((dream) => {
                      const Icon = getCategoryIcon(dream.category);
                      const colorClass = getCategoryColor(dream.category);

                      return (
                        <div
                          key={dream.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg"
                        >
                          <Icon className={`w-5 h-5 ${colorClass.split(' ')[0]}`} />
                          <span className="flex-1 text-gray-900">{dream.title}</span>
                          <span className="px-2 py-1 bg-gray-100 text-xs rounded-full capitalize">
                            {dream.category}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Matrix View */}
          {viewMode === 'matrix' && (
            <div className="grid grid-cols-12 gap-6">
              {/* Unassigned Dreams Pool */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Unassigned Dreams</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag dreams to the matrix to organize them by wellbeing area and life stage
                  </p>
                  <Droppable droppableId="unassigned">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[200px] p-3 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-purple-50' : 'bg-gray-50'
                        }`}
                      >
                        {unassignedDreams.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">All dreams are assigned!</p>
                          </div>
                        ) : (
                          unassignedDreams.map((dream, index) => {
                            const Icon = getCategoryIcon(dream.category);
                            const colorClass = getCategoryColor(dream.category);

                            return (
                              <Draggable key={dream.id} draggableId={dream.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-3 bg-white border-2 rounded-lg cursor-move transition-all ${
                                      snapshot.isDragging
                                        ? 'shadow-xl border-purple-400 rotate-2'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass.split(' ')[0]}`} />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">
                                          {dream.title}
                                        </p>
                                        <span className="text-xs text-gray-500 capitalize">
                                          {dream.category}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>

              {/* Matrix Grid */}
              <div className="col-span-12 lg:col-span-8">
                <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-sm font-bold text-gray-700 border-b-2 border-gray-300">
                          Wellbeing Area
                        </th>
                        {lifeStages.map((stage) => (
                          <th key={stage} className="p-2 text-center text-sm font-bold text-purple-700 border-b-2 border-gray-300">
                            {stage}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {wellbeingAreas.map((area) => {
                        const Icon = area.icon;
                        return (
                          <tr key={area.id} className="hover:bg-gray-50">
                            <td className="p-3 border-b border-gray-200">
                              <div className="flex items-center gap-2">
                                <Icon className="w-5 h-5 text-purple-600" />
                                <div>
                                  <p className="font-medium text-sm text-gray-900">{area.nameKo}</p>
                                  <p className="text-xs text-gray-500">{area.name}</p>
                                </div>
                              </div>
                            </td>
                            {lifeStages.map((stage) => {
                              const cellDreams = getCellDreams(area.id, stage);
                              const cellId = `cell-${area.id}-${stage}`;

                              return (
                                <td key={stage} className="p-2 border-b border-gray-200">
                                  <Droppable droppableId={cellId}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        onClick={() => {
                                          if (cellDreams.length > 0) {
                                            setSelectedCell({ wellbeing: area.id, lifeStage: stage });
                                          }
                                        }}
                                        className={`min-h-[60px] rounded-lg flex items-center justify-center text-2xl font-bold cursor-pointer transition-all ${
                                          snapshot.isDraggingOver
                                            ? 'bg-purple-100 border-2 border-purple-400 scale-105'
                                            : cellDreams.length > 0
                                            ? 'bg-gradient-to-br from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 border-2 border-purple-300'
                                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                                        }`}
                                      >
                                        {cellDreams.length > 0 ? (
                                          <span className="text-purple-700">{cellDreams.length}</span>
                                        ) : (
                                          <span className="text-gray-300 text-lg">—</span>
                                        )}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Suggestions Modal */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Dream Suggestions</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Based on your values, strengths, and vision. Click to add dreams to your list!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAIModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {aiSuggestions.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No suggestions available</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {aiSuggestions.map((suggestion, index) => {
                      const Icon = getCategoryIcon(suggestion.category);
                      const colorClass = getCategoryColor(suggestion.category);

                      return (
                        <div key={index} className={`border-2 rounded-xl p-4 ${colorClass.split(' ')[1]}`}>
                          <div className="flex items-start gap-3 mb-3">
                            <Icon className={`w-6 h-6 flex-shrink-0 ${colorClass.split(' ')[0]}`} />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 mb-1">{suggestion.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="px-2 py-1 bg-white text-xs rounded-full capitalize">
                                  {suggestion.category}
                                </span>
                                {suggestion.life_stage && (
                                  <span className="px-2 py-1 bg-white text-xs rounded-full">
                                    {suggestion.life_stage}
                                  </span>
                                )}
                              </div>
                              {suggestion.why && (
                                <p className="text-xs text-gray-500 italic mb-2">💡 {suggestion.why}</p>
                              )}
                              {suggestion.related_values && suggestion.related_values.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {suggestion.related_values.map((value: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                      {value}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => addSuggestedDream(suggestion)}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                          >
                            <Plus className="w-4 h-4 inline mr-1" />
                            Add to My Dreams
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cell Details Modal */}
        {selectedCell && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {wellbeingAreas.find(w => w.id === selectedCell.wellbeing)?.nameKo} - {selectedCell.lifeStage}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {getCellDreams(selectedCell.wellbeing, selectedCell.lifeStage).length} dreams in this cell
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="space-y-3">
                  {getCellDreams(selectedCell.wellbeing, selectedCell.lifeStage).map((dream) => {
                    const Icon = getCategoryIcon(dream.category);
                    const colorClass = getCategoryColor(dream.category);

                    return (
                      <div key={dream.id} className={`border-2 rounded-xl p-4 ${colorClass.split(' ')[1]}`}>
                        <div className="flex items-start gap-3">
                          <Icon className={`w-5 h-5 mt-0.5 ${colorClass.split(' ')[0]}`} />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{dream.title}</h4>
                            {dream.description && (
                              <p className="text-sm text-gray-600 mt-1">{dream.description}</p>
                            )}
                            <span className="inline-block mt-2 px-2 py-1 bg-white text-xs rounded-full capitalize">
                              {dream.category}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              deleteDream(dream.id);
                              const remainingDreams = getCellDreams(selectedCell.wellbeing, selectedCell.lifeStage).filter(d => d.id !== dream.id);
                              if (remainingDreams.length === 0) {
                                setSelectedCell(null);
                              }
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}
