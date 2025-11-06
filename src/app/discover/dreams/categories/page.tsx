'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Sparkles, Plus, X, Loader2, TrendingUp, Heart, Brain, Dumbbell, Home, DollarSign, Briefcase, Coffee } from 'lucide-react';

interface Dream {
  id: string;
  title: string;
  description?: string;
  life_stage?: '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';
  wellbeing_area?: 'relationship' | 'spiritual' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure';
  related_values?: string[];
  related_roles?: string[];
  is_completed: boolean;
}

type LifeStage = '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';
type WellbeingArea = 'relationship' | 'spiritual' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure';

export default function DreamsMatrixPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dreams, setDreams] = useState<Dream[]>([]);
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
        alert('Failed to generate AI suggestions. Please complete Values, Strengths, or Vision modules first.');
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
        if (aiSuggestions.length === 1) {
          setShowAIModal(false);
        }
      }
    } catch (error) {
      console.error('Failed to add suggested dream:', error);
      alert('Failed to add dream. Please try again.');
    }
  }

  async function updateDreamWellbeing(dreamId: string, wellbeing: WellbeingArea, lifeStage: LifeStage) {
    const dream = dreams.find(d => d.id === dreamId);
    if (!dream) return;

    // Check if cell already has 3 dreams (limit)
    const cellDreams = dreams.filter(d => d.wellbeing_area === wellbeing && d.life_stage === lifeStage);
    if (cellDreams.length >= 3) {
      alert('⚠️ This cell already has 3 dreams. Maximum limit reached!');
      return;
    }

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

  const lifeStages: LifeStage[] = ['20s', '30s', '40s', '50s', '60s', '70s+'];

  const wellbeingAreas: { id: WellbeingArea; nameEn: string; nameKo: string; icon: any }[] = [
    { id: 'relationship', nameEn: 'Relationship', nameKo: '관계/정서', icon: Heart },
    { id: 'spiritual', nameEn: 'Spiritual', nameKo: '영적', icon: Sparkles },
    { id: 'intellectual', nameEn: 'Intellectual', nameKo: '지적', icon: Brain },
    { id: 'physical', nameEn: 'Physical', nameKo: '신체적', icon: Dumbbell },
    { id: 'environment', nameEn: 'Environment', nameKo: '환경(주거)', icon: Home },
    { id: 'financial', nameEn: 'Financial', nameKo: '재정', icon: DollarSign },
    { id: 'career', nameEn: 'Career', nameKo: '직업', icon: Briefcase },
    { id: 'leisure', nameEn: 'Leisure', nameKo: '여가', icon: Coffee }
  ];

  const unassignedDreams = dreams.filter(d => !d.wellbeing_area || !d.life_stage);

  const getCellDreams = (wellbeing: WellbeingArea, lifeStage: LifeStage) => {
    return dreams.filter(d => d.wellbeing_area === wellbeing && d.life_stage === lifeStage);
  };

  // Heatmap color based on dream count (0=gray, 1=light purple, 2=medium purple, 3=intense gradient)
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200';
    if (count === 1) return 'bg-purple-100 hover:bg-purple-200 border-2 border-purple-300';
    if (count === 2) return 'bg-purple-300 hover:bg-purple-400 border-2 border-purple-400';
    if (count >= 3) return 'bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-2 border-purple-600 shadow-md';
    return 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200';
  };

  const getTextColor = (count: number) => {
    if (count >= 2) return 'text-white font-bold';
    if (count === 1) return 'text-purple-700 font-semibold';
    return 'text-gray-300';
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Dream Matrix</h1>
              <p className="text-sm text-gray-600 mt-2">
                Organize your dreams by wellbeing area and life stage. Drag dreams from the left pool to matrix cells.
              </p>
            </div>
          </div>

          {/* Matrix View */}
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
                          <button
                            onClick={handleAISuggest}
                            disabled={aiGenerating}
                            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                          >
                            {aiGenerating ? 'Generating...' : 'Get AI Suggestions'}
                          </button>
                        </div>
                      ) : (
                        <>
                          {unassignedDreams.map((dream, index) => (
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
                                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-gray-900 truncate">
                                        {dream.title}
                                      </p>
                                      {dream.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                          {dream.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          <button
                            onClick={handleAISuggest}
                            disabled={aiGenerating}
                            className="w-full mt-2 px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 disabled:opacity-50"
                          >
                            {aiGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <TrendingUp className="w-4 h-4 inline mr-2" />
                                AI Suggest More
                              </>
                            )}
                          </button>
                        </>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* Matrix Grid with Heatmap */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Wellbeing × Life Stage Matrix</h3>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-4 rounded bg-gray-100 border border-gray-300"></div>
                      <span className="text-gray-600">0</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-4 rounded bg-purple-100 border border-purple-300"></div>
                      <span className="text-gray-600">1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-4 rounded bg-purple-300 border border-purple-400"></div>
                      <span className="text-gray-600">2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-4 rounded bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                      <span className="text-gray-600">3 (max)</span>
                    </div>
                  </div>
                </div>
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
                                <p className="font-medium text-sm text-gray-900">{area.nameEn}</p>
                                <p className="text-xs text-gray-500">{area.nameKo}</p>
                              </div>
                            </div>
                          </td>
                          {lifeStages.map((stage) => {
                            const cellDreams = getCellDreams(area.id, stage);
                            const cellId = `cell-${area.id}-${stage}`;
                            const count = cellDreams.length;

                            return (
                              <td key={stage} className="p-2 border-b border-gray-200">
                                <Droppable droppableId={cellId}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.droppableProps}
                                      onClick={() => {
                                        if (count > 0) {
                                          setSelectedCell({ wellbeing: area.id, lifeStage: stage });
                                        }
                                      }}
                                      className={`min-h-[60px] rounded-lg flex items-center justify-center text-2xl font-bold cursor-pointer transition-all ${
                                        snapshot.isDraggingOver
                                          ? 'bg-purple-100 border-2 border-purple-400 scale-105'
                                          : getHeatmapColor(count)
                                      }`}
                                    >
                                      {count > 0 ? (
                                        <span className={getTextColor(count)}>{count}</span>
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
                      Personalized suggestions based on your profile
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
                      const wellbeingArea = wellbeingAreas.find(w => w.id === suggestion.wellbeing_area);
                      const Icon = wellbeingArea?.icon || Sparkles;

                      return (
                        <div key={index} className="border-2 border-purple-200 bg-purple-50 rounded-xl p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Icon className="w-6 h-6 flex-shrink-0 text-purple-600" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 mb-1">{suggestion.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {suggestion.wellbeing_area && (
                                  <span className="px-2 py-1 bg-white text-xs rounded-full">
                                    {wellbeingArea?.nameEn}
                                  </span>
                                )}
                                {suggestion.life_stage && (
                                  <span className="px-2 py-1 bg-white text-xs rounded-full">
                                    {suggestion.life_stage}
                                  </span>
                                )}
                              </div>
                              {suggestion.why && (
                                <p className="text-xs text-gray-500 italic mb-2">💡 {suggestion.why}</p>
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
                      {wellbeingAreas.find(w => w.id === selectedCell.wellbeing)?.nameEn} - {selectedCell.lifeStage}
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
                    const wellbeingArea = wellbeingAreas.find(w => w.id === dream.wellbeing_area);
                    const Icon = wellbeingArea?.icon || Sparkles;

                    return (
                      <div key={dream.id} className="border-2 border-purple-200 bg-purple-50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 mt-0.5 text-purple-600" />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{dream.title}</h4>
                            {dream.description && (
                              <p className="text-sm text-gray-600 mt-1">{dream.description}</p>
                            )}
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
