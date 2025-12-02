'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Sparkles, Plus, X, Loader2, TrendingUp, Heart, Brain, Dumbbell,
  Home, DollarSign, Briefcase, Coffee, ExternalLink, FileText,
  ChevronRight, AlertCircle, CheckCircle2, Edit3, Trash2
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';

interface Dream {
  id: string;
  title: string;
  description?: string;
  life_stage?: LifeStage;
  wellbeing_area?: WellbeingArea;
  related_values?: string[];
  why?: string;
  is_completed: boolean;
  isEditing?: boolean;
}

interface TableEntry {
  id: string;
  title: string;
  life_stage: LifeStage | '';
  wellbeing_area: WellbeingArea | '';
  why: string;
}

interface MissingAnalysis {
  area: WellbeingArea;
  stage: LifeStage;
  message: string;
}

interface AIRecommendation {
  title: string;
  description?: string;
  wellbeing_area: WellbeingArea;
  life_stage: LifeStage;
  why: string;
  related_values?: string[];
}

type LifeStage = '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';
type WellbeingArea = 'relationship' | 'spiritual' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure';

const LIFE_STAGES: LifeStage[] = ['20s', '30s', '40s', '50s', '60s', '70s+'];

const WELLBEING_AREAS: { id: WellbeingArea; name: string; icon: any }[] = [
  { id: 'relationship', name: 'Relationship', icon: Heart },
  { id: 'spiritual', name: 'Spiritual', icon: Sparkles },
  { id: 'intellectual', name: 'Intellectual', icon: Brain },
  { id: 'physical', name: 'Physical', icon: Dumbbell },
  { id: 'environment', name: 'Environment', icon: Home },
  { id: 'financial', name: 'Financial', icon: DollarSign },
  { id: 'career', name: 'Career', icon: Briefcase },
  { id: 'leisure', name: 'Leisure', icon: Coffee }
];

const EMPTY_TABLE_ENTRY = (): TableEntry => ({
  id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title: '',
  life_stage: '',
  wellbeing_area: '',
  why: ''
});

export default function UnifiedDreamsPage() {
  const router = useRouter();
  const { startModule, completeModule } = useModuleProgress('dreams');

  // Core state
  const [loading, setLoading] = useState(true);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [tableEntries, setTableEntries] = useState<TableEntry[]>([
    EMPTY_TABLE_ENTRY(),
    EMPTY_TABLE_ENTRY(),
    EMPTY_TABLE_ENTRY()
  ]);

  // AI state
  const [analyzing, setAnalyzing] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [missingAnalysis, setMissingAnalysis] = useState<MissingAnalysis[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [aiSummary, setAiSummary] = useState('');

  // UI state
  const [selectedCell, setSelectedCell] = useState<{ wellbeing: WellbeingArea; lifeStage: LifeStage } | null>(null);
  const [editingRecommendation, setEditingRecommendation] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    startModule();
    loadDreams();
  }, [startModule]);

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

  // Table entry handlers
  const updateTableEntry = (index: number, field: keyof TableEntry, value: string) => {
    setTableEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const isTableValid = () => {
    return tableEntries.some(entry =>
      entry.title.trim() && entry.life_stage && entry.wellbeing_area
    );
  };

  // Submit table for AI analysis
  async function handleSubmitTable() {
    if (!isTableValid()) {
      alert('Please fill in at least one complete row (Title, Life Stage, and Wellbeing Area)');
      return;
    }

    setAnalyzing(true);

    try {
      // First, add valid entries as dreams
      const validEntries = tableEntries.filter(e =>
        e.title.trim() && e.life_stage && e.wellbeing_area
      );

      for (const entry of validEntries) {
        const dream: Dream = {
          id: entry.id,
          title: entry.title,
          description: entry.why || undefined,
          life_stage: entry.life_stage as LifeStage,
          wellbeing_area: entry.wellbeing_area as WellbeingArea,
          why: entry.why || undefined,
          is_completed: false
        };

        await fetch('/api/dreams/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dream })
        });
      }

      // Reload dreams
      await loadDreams();

      // Now call AI analysis
      const res = await fetch('/api/dreams/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableData: validEntries,
          matrixState: buildMatrixState()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMissingAnalysis(data.missingAnalysis || []);
        setAiRecommendations(data.recommendations || []);
        setAiSummary(data.summary || '');
        setHasSubmitted(true);

        // Clear table entries
        setTableEntries([EMPTY_TABLE_ENTRY(), EMPTY_TABLE_ENTRY(), EMPTY_TABLE_ENTRY()]);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to analyze. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting table:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  // Build matrix state for API
  const buildMatrixState = useCallback(() => {
    const state: Record<string, string[]> = {};
    dreams.forEach(dream => {
      if (dream.wellbeing_area && dream.life_stage) {
        const key = `${dream.wellbeing_area}-${dream.life_stage}`;
        if (!state[key]) state[key] = [];
        state[key].push(dream.id);
      }
    });
    return state;
  }, [dreams]);

  // Add recommendation as dream (user must edit/confirm)
  async function addRecommendationAsDream(rec: AIRecommendation, customTitle?: string) {
    const title = customTitle || rec.title;
    if (!title.trim()) {
      alert('Please enter a title for this dream');
      return;
    }

    try {
      const dream: Dream = {
        id: `rec-${Date.now()}`,
        title: title,
        description: rec.description,
        life_stage: rec.life_stage,
        wellbeing_area: rec.wellbeing_area,
        why: rec.why,
        related_values: rec.related_values,
        is_completed: false
      };

      const res = await fetch('/api/dreams/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream })
      });

      if (res.ok) {
        await loadDreams();
        setAiRecommendations(prev => prev.filter(r => r !== rec));
        setEditingRecommendation(null);
      }
    } catch (error) {
      console.error('Failed to add recommendation:', error);
      alert('Failed to add dream. Please try again.');
    }
  }

  // Drag and drop handler
  function handleDragEnd(result: any) {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const destId = destination.droppableId;

    if (destId === 'unassigned') {
      // Move back to unassigned
      updateDreamPosition(draggableId, undefined, undefined);
      return;
    }

    // Parse destination: "cell-relationship-20s"
    const parts = destId.split('-');
    if (parts.length !== 3 || parts[0] !== 'cell') return;

    const wellbeing = parts[1] as WellbeingArea;
    const lifeStage = parts[2] as LifeStage;

    // Check cell limit (max 3)
    const cellDreams = dreams.filter(d => d.wellbeing_area === wellbeing && d.life_stage === lifeStage);
    if (cellDreams.length >= 3 && !cellDreams.find(d => d.id === draggableId)) {
      alert('Maximum 3 dreams per cell');
      return;
    }

    updateDreamPosition(draggableId, wellbeing, lifeStage);
  }

  async function updateDreamPosition(dreamId: string, wellbeing?: WellbeingArea, lifeStage?: LifeStage) {
    const dream = dreams.find(d => d.id === dreamId);
    if (!dream) return;

    try {
      const updatedDream = {
        ...dream,
        wellbeing_area: wellbeing,
        life_stage: lifeStage
      };

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

  async function deleteDream(id: string) {
    if (!confirm('Delete this dream?')) return;

    try {
      const res = await fetch(`/api/dreams/session?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadDreams();
        if (selectedCell) {
          const remaining = getCellDreams(selectedCell.wellbeing, selectedCell.lifeStage)
            .filter(d => d.id !== id);
          if (remaining.length === 0) setSelectedCell(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete dream:', error);
    }
  }

  // Navigate to final results
  function handleFinalize() {
    if (dreams.length === 0) {
      alert('Please add at least one dream before finalizing');
      return;
    }
    router.push('/discover/dreams/results');
  }

  // Helper functions
  const getCellDreams = (wellbeing: WellbeingArea, lifeStage: LifeStage) => {
    return dreams.filter(d => d.wellbeing_area === wellbeing && d.life_stage === lifeStage);
  };

  const unassignedDreams = dreams.filter(d => !d.wellbeing_area || !d.life_stage);
  const assignedCount = dreams.filter(d => d.wellbeing_area && d.life_stage).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-3 shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dream Life Matrix</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Map your dreams across wellbeing areas and life stages. Add dreams via the table, drag to organize, and get AI insights.
            </p>
          </div>

          {/* Main Grid: Left Panel + Right Content */}
          <div className="grid lg:grid-cols-12 gap-6">

            {/* LEFT PANEL */}
            <div className="lg:col-span-4 space-y-4">

              {/* Add New Dream Box */}
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  Add New Dream
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use the Excel-style table on the right to add up to 3 dreams at once, then submit for AI analysis.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{dreams.length}</div>
                    <div className="text-xs text-gray-600">Total Dreams</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{assignedCount}</div>
                    <div className="text-xs text-gray-600">In Matrix</div>
                  </div>
                </div>

                {/* Developmental Tasks Link */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <a
                        href="https://docs.google.com/spreadsheets/d/1example"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        Developmental Tasks by Life Stage
                      </a>
                      <p className="text-xs text-blue-600 mt-1">
                        Keep this open in another tab for reference while adding your dreams.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendations Panel (shows after first submission) */}
              {hasSubmitted && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-5 border border-purple-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    AI Recommendations
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Based on your profile and existing dreams. Click to edit, then add.
                  </p>

                  {aiRecommendations.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm">All recommendations added!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {aiRecommendations.map((rec, idx) => {
                        const areaInfo = WELLBEING_AREAS.find(w => w.id === rec.wellbeing_area);
                        const Icon = areaInfo?.icon || Sparkles;
                        const isEditing = editingRecommendation === idx;

                        return (
                          <div key={idx} className="bg-white rounded-xl p-3 border border-purple-200">
                            <div className="flex items-start gap-2 mb-2">
                              <Icon className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-sm font-medium"
                                    autoFocus
                                  />
                                ) : (
                                  <p className="font-medium text-sm text-gray-900">{rec.title}</p>
                                )}
                                <div className="flex gap-1 mt-1">
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                    {areaInfo?.name}
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    {rec.life_stage}
                                  </span>
                                </div>
                                {rec.why && (
                                  <p className="text-xs text-gray-500 mt-1 italic">💡 {rec.why}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => {
                                      addRecommendationAsDream(rec, editedTitle);
                                    }}
                                    className="flex-1 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700"
                                  >
                                    Add Dream
                                  </button>
                                  <button
                                    onClick={() => setEditingRecommendation(null)}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingRecommendation(idx);
                                      setEditedTitle(rec.title);
                                    }}
                                    className="flex-1 py-1.5 bg-white border border-purple-300 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-50"
                                  >
                                    <Edit3 className="w-3 h-3 inline mr-1" />
                                    Edit & Add
                                  </button>
                                  <button
                                    onClick={() => addRecommendationAsDream(rec)}
                                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Unassigned Dreams Pool */}
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Unassigned Dreams</h3>
                <p className="text-xs text-gray-500 mb-3">Drag to matrix cells to organize</p>
                <Droppable droppableId="unassigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[100px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-purple-100' : 'bg-gray-50'
                      }`}
                    >
                      {unassignedDreams.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">All dreams assigned!</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {unassignedDreams.map((dream, index) => (
                            <Draggable key={dream.id} draggableId={dream.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-2 bg-white border-2 rounded-lg cursor-move text-sm ${
                                    snapshot.isDragging
                                      ? 'shadow-xl border-purple-400 rotate-2'
                                      : 'border-gray-200 hover:border-purple-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                    <span className="truncate">{dream.title}</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Finalize Button */}
              <button
                onClick={handleFinalize}
                disabled={dreams.length === 0}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Finalize & Get Report
                <ChevronRight className="w-5 h-5 inline ml-2" />
              </button>
            </div>

            {/* RIGHT CONTENT */}
            <div className="lg:col-span-8 space-y-4">

              {/* Excel-style Input Table */}
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Add Dreams (Max 3)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-purple-50">
                        <th className="p-2 text-left text-sm font-semibold text-gray-700 border border-gray-200 w-[35%]">
                          Dream Title *
                        </th>
                        <th className="p-2 text-left text-sm font-semibold text-gray-700 border border-gray-200 w-[20%]">
                          Life Stage *
                        </th>
                        <th className="p-2 text-left text-sm font-semibold text-gray-700 border border-gray-200 w-[20%]">
                          Wellbeing Area *
                        </th>
                        <th className="p-2 text-left text-sm font-semibold text-gray-700 border border-gray-200 w-[25%]">
                          Why (Optional)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableEntries.map((entry, idx) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="p-1 border border-gray-200">
                            <input
                              type="text"
                              value={entry.title}
                              onChange={(e) => updateTableEntry(idx, 'title', e.target.value)}
                              placeholder="e.g., Learn Spanish"
                              className="w-full px-2 py-2 text-sm border-0 focus:ring-2 focus:ring-purple-500 rounded"
                            />
                          </td>
                          <td className="p-1 border border-gray-200">
                            <select
                              value={entry.life_stage}
                              onChange={(e) => updateTableEntry(idx, 'life_stage', e.target.value)}
                              className="w-full px-2 py-2 text-sm border-0 focus:ring-2 focus:ring-purple-500 rounded bg-white"
                            >
                              <option value="">Select...</option>
                              {LIFE_STAGES.map(stage => (
                                <option key={stage} value={stage}>{stage}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1 border border-gray-200">
                            <select
                              value={entry.wellbeing_area}
                              onChange={(e) => updateTableEntry(idx, 'wellbeing_area', e.target.value)}
                              className="w-full px-2 py-2 text-sm border-0 focus:ring-2 focus:ring-purple-500 rounded bg-white"
                            >
                              <option value="">Select...</option>
                              {WELLBEING_AREAS.map(area => (
                                <option key={area.id} value={area.id}>{area.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1 border border-gray-200">
                            <input
                              type="text"
                              value={entry.why}
                              onChange={(e) => updateTableEntry(idx, 'why', e.target.value)}
                              placeholder="Brief reason..."
                              className="w-full px-2 py-2 text-sm border-0 focus:ring-2 focus:ring-purple-500 rounded"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSubmitTable}
                    disabled={!isTableValid() || analyzing}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Submit for AI Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Wellbeing × Life Stage Matrix */}
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Wellbeing × Life Stage Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-sm font-bold text-gray-700 border-b-2 border-gray-300 w-[140px]">
                          Area
                        </th>
                        {LIFE_STAGES.map((stage) => (
                          <th key={stage} className="p-2 text-center text-sm font-bold text-purple-700 border-b-2 border-gray-300">
                            {stage}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {WELLBEING_AREAS.map((area) => {
                        const Icon = area.icon;
                        return (
                          <tr key={area.id}>
                            <td className="p-2 border-b border-gray-200">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-purple-600" />
                                <span className="font-medium text-sm">{area.name}</span>
                              </div>
                            </td>
                            {LIFE_STAGES.map((stage) => {
                              const cellDreams = getCellDreams(area.id, stage);
                              const cellId = `cell-${area.id}-${stage}`;

                              return (
                                <td key={stage} className="p-1 border-b border-gray-200">
                                  <Droppable droppableId={cellId}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        onClick={() => cellDreams.length > 0 && setSelectedCell({ wellbeing: area.id, lifeStage: stage })}
                                        className={`min-h-[70px] rounded-lg p-1.5 transition-all ${
                                          snapshot.isDraggingOver
                                            ? 'bg-purple-100 border-2 border-purple-400 scale-105'
                                            : cellDreams.length > 0
                                            ? 'bg-purple-50 border border-purple-200 cursor-pointer hover:bg-purple-100'
                                            : 'bg-gray-50 border border-dashed border-gray-300 hover:bg-gray-100'
                                        }`}
                                      >
                                        {cellDreams.length > 0 ? (
                                          <div className="space-y-1">
                                            {cellDreams.slice(0, 2).map((dream, i) => (
                                              <div key={dream.id} className="bg-white rounded px-1.5 py-1 text-xs truncate shadow-sm border">
                                                {dream.title}
                                              </div>
                                            ))}
                                            {cellDreams.length > 2 && (
                                              <div className="text-xs text-purple-600 font-medium text-center">
                                                +{cellDreams.length - 2} more
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="h-full flex items-center justify-center text-gray-300 text-xs">
                                            Drop here
                                          </div>
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

              {/* AI Missing Analysis (shows after submission) */}
              {hasSubmitted && missingAnalysis.length > 0 && (
                <div className="bg-amber-50 rounded-2xl shadow-lg p-5 border border-amber-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    AI Missing Analysis
                  </h3>
                  <div className="space-y-2">
                    {missingAnalysis.map((item, idx) => {
                      const areaInfo = WELLBEING_AREAS.find(w => w.id === item.area);
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
                          <div className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                            {areaInfo?.name} - {item.stage}
                          </div>
                          <p className="text-sm text-gray-700 flex-1">{item.message}</p>
                        </div>
                      );
                    })}
                  </div>
                  {aiSummary && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                      <p className="text-sm text-gray-700">
                        <strong>Summary:</strong> {aiSummary}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cell Details Modal */}
        {selectedCell && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
              <div className="p-5 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {WELLBEING_AREAS.find(w => w.id === selectedCell.wellbeing)?.name} - {selectedCell.lifeStage}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {getCellDreams(selectedCell.wellbeing, selectedCell.lifeStage).length} dreams
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-5 overflow-y-auto max-h-[calc(80vh-100px)]">
                <div className="space-y-3">
                  {getCellDreams(selectedCell.wellbeing, selectedCell.lifeStage).map((dream) => {
                    const areaInfo = WELLBEING_AREAS.find(w => w.id === dream.wellbeing_area);
                    const Icon = areaInfo?.icon || Sparkles;

                    return (
                      <div key={dream.id} className="border-2 border-purple-200 bg-purple-50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 mt-0.5 text-purple-600" />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{dream.title}</h4>
                            {dream.description && (
                              <p className="text-sm text-gray-600 mt-1">{dream.description}</p>
                            )}
                            {dream.why && (
                              <p className="text-xs text-gray-500 mt-1 italic">💡 {dream.why}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteDream(dream.id)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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
