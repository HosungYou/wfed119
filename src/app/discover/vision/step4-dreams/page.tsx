'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Plus, X, Loader2, ArrowLeft, ArrowRight,
  Heart, Brain, Dumbbell, Users, Star, Briefcase, DollarSign,
  TrendingUp, CheckCircle2, Edit3, Trash2
} from 'lucide-react';
import StepProgress from '../components/StepProgress';

// Types for Dreams integrated into Vision
interface Dream {
  id: string;
  dream: string;
  category: string;
  lifeStage: LifeStage;
  wellbeingDimension?: WellbeingDimension;
  createdAt: string;
}

type LifeStage = 'immediate' | '1-3years' | '5years' | '10years+';
type WellbeingDimension = 'physical' | 'emotional' | 'intellectual' | 'social' | 'spiritual' | 'occupational' | 'economic';

interface VisionSession {
  id: string;
  user_id: string;
  time_horizon: string;
  future_imagery: string;
  core_aspirations: string[];
  dreams: Dream[];
  dreams_by_life_stage: Record<LifeStage, string[]>;
  dreams_by_wellbeing: Record<WellbeingDimension, string[]>;
  dreams_completed: boolean;
  current_step: number;
}

interface Part1Context {
  values: { terminal: string[]; instrumental: string[]; work: string[] };
  strengths: { name: string; description: string }[];
  enneagram: { type: number; wing: number };
  lifeThemes: { theme: string; description: string }[];
}

// Constants
const LIFE_STAGES: { id: LifeStage; name: string; nameKo: string; description: string }[] = [
  { id: 'immediate', name: 'Immediate', nameKo: '즉시', description: 'Within the next year' },
  { id: '1-3years', name: '1-3 Years', nameKo: '1-3년', description: 'Short-term goals' },
  { id: '5years', name: '5 Years', nameKo: '5년', description: 'Medium-term aspirations' },
  { id: '10years+', name: '10+ Years', nameKo: '10년+', description: 'Long-term dreams' },
];

const WELLBEING_DIMENSIONS: { id: WellbeingDimension; name: string; nameKo: string; icon: React.ElementType; color: string }[] = [
  { id: 'physical', name: 'Physical', nameKo: '신체', icon: Dumbbell, color: 'text-red-600 bg-red-50' },
  { id: 'emotional', name: 'Emotional', nameKo: '정서', icon: Heart, color: 'text-pink-600 bg-pink-50' },
  { id: 'intellectual', name: 'Intellectual', nameKo: '지적', icon: Brain, color: 'text-blue-600 bg-blue-50' },
  { id: 'social', name: 'Social', nameKo: '사회', icon: Users, color: 'text-green-600 bg-green-50' },
  { id: 'spiritual', name: 'Spiritual', nameKo: '영적', icon: Star, color: 'text-purple-600 bg-purple-50' },
  { id: 'occupational', name: 'Occupational', nameKo: '직업', icon: Briefcase, color: 'text-orange-600 bg-orange-50' },
  { id: 'economic', name: 'Economic', nameKo: '경제', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
];

export default function VisionStep4Dreams() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Session data
  const [session, setSession] = useState<VisionSession | null>(null);
  const [context, setContext] = useState<Part1Context | null>(null);

  // Dreams state
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [newDream, setNewDream] = useState('');
  const [selectedLifeStage, setSelectedLifeStage] = useState<LifeStage>('1-3years');
  const [selectedWellbeing, setSelectedWellbeing] = useState<WellbeingDimension | ''>('');
  const [editingDreamId, setEditingDreamId] = useState<string | null>(null);
  const [editedDreamText, setEditedDreamText] = useState('');

  // AI recommendations
  const [aiRecommendations, setAiRecommendations] = useState<Dream[]>([]);
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Load vision session
      const sessionRes = await fetch('/api/discover/vision/session');
      if (!sessionRes.ok) throw new Error('Failed to load session');
      const sessionData = await sessionRes.json();

      // Verify previous steps are complete
      if (!sessionData.core_aspirations || sessionData.core_aspirations.length === 0) {
        alert('Please complete Step 3 (Core Aspirations) first.');
        router.push('/discover/vision/step3');
        return;
      }

      setSession(sessionData);
      setDreams(sessionData.dreams || []);

      // Load Part 1 context for AI recommendations
      const contextRes = await fetch('/api/discover/vision/context');
      if (contextRes.ok) {
        const contextData = await contextRes.json();
        setContext(contextData);
      }
    } catch (error) {
      console.error('[Step4-Dreams] Load error:', error);
      alert('Failed to load session.');
    } finally {
      setLoading(false);
    }
  }

  // Add a new dream
  async function handleAddDream() {
    if (!newDream.trim()) {
      alert('Please enter a dream');
      return;
    }

    const dream: Dream = {
      id: `dream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dream: newDream.trim(),
      category: 'general',
      lifeStage: selectedLifeStage,
      wellbeingDimension: selectedWellbeing || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedDreams = [...dreams, dream];
    setDreams(updatedDreams);
    setNewDream('');
    setSelectedWellbeing('');

    // Save to server
    await saveDreams(updatedDreams);
  }

  // Delete a dream
  function handleDeleteDream(dreamId: string) {
    if (!confirm('Delete this dream?')) return;
    const updatedDreams = dreams.filter(d => d.id !== dreamId);
    setDreams(updatedDreams);
    saveDreams(updatedDreams);
  }

  // Edit a dream
  function startEditDream(dream: Dream) {
    setEditingDreamId(dream.id);
    setEditedDreamText(dream.dream);
  }

  function saveEditDream(dreamId: string) {
    if (!editedDreamText.trim()) return;
    const updatedDreams = dreams.map(d =>
      d.id === dreamId ? { ...d, dream: editedDreamText.trim() } : d
    );
    setDreams(updatedDreams);
    setEditingDreamId(null);
    setEditedDreamText('');
    saveDreams(updatedDreams);
  }

  // Save dreams to server
  async function saveDreams(dreamsList: Dream[]) {
    try {
      setSaving(true);

      // Categorize dreams by life stage
      const dreamsByLifeStage: Record<LifeStage, string[]> = {
        'immediate': [],
        '1-3years': [],
        '5years': [],
        '10years+': [],
      };

      // Categorize dreams by wellbeing dimension
      const dreamsByWellbeing: Record<WellbeingDimension, string[]> = {
        'physical': [],
        'emotional': [],
        'intellectual': [],
        'social': [],
        'spiritual': [],
        'occupational': [],
        'economic': [],
      };

      dreamsList.forEach(dream => {
        if (dream.lifeStage) {
          dreamsByLifeStage[dream.lifeStage].push(dream.dream);
        }
        if (dream.wellbeingDimension) {
          dreamsByWellbeing[dream.wellbeingDimension].push(dream.dream);
        }
      });

      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreams: dreamsList,
          dreams_by_life_stage: dreamsByLifeStage,
          dreams_by_wellbeing: dreamsByWellbeing,
          current_step: 4,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
    } catch (error) {
      console.error('[Step4-Dreams] Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  // Get AI recommendations based on profile
  async function getAiRecommendations() {
    if (!context) {
      alert('Profile context not available');
      return;
    }

    try {
      setAnalyzing(true);

      const response = await fetch('/api/discover/vision/dreams-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDreams: dreams,
          context: {
            values: context.values,
            strengths: context.strengths,
            enneagram: context.enneagram,
            lifeThemes: context.lifeThemes,
            coreAspirations: session?.core_aspirations,
            timeHorizon: session?.time_horizon,
          },
        }),
      });

      if (!response.ok) throw new Error('AI analysis failed');

      const data = await response.json();
      setAiRecommendations(data.recommendations || []);
      setAiSummary(data.summary || '');
    } catch (error) {
      console.error('[Step4-Dreams] AI error:', error);
      alert('Failed to get AI recommendations. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  // Add AI recommendation as dream
  function addRecommendationAsDream(rec: Dream) {
    const updatedDreams = [...dreams, { ...rec, id: `rec-${Date.now()}`, createdAt: new Date().toISOString() }];
    setDreams(updatedDreams);
    setAiRecommendations(prev => prev.filter(r => r.id !== rec.id));
    saveDreams(updatedDreams);
  }

  // Complete step and continue
  async function handleContinue() {
    if (dreams.length === 0) {
      if (!confirm('You haven\'t added any dreams. Continue anyway?')) {
        return;
      }
    }

    try {
      setSaving(true);

      await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreams_completed: true,
          current_step: 5,
        }),
      });

      router.push('/discover/vision/step5');
    } catch (error) {
      console.error('[Step4-Dreams] Continue error:', error);
      alert('Failed to save progress.');
    } finally {
      setSaving(false);
    }
  }

  // Get dreams grouped by life stage
  const getDreamsByLifeStage = useCallback((stage: LifeStage) => {
    return dreams.filter(d => d.lifeStage === stage);
  }, [dreams]);

  // Get coverage stats
  const coverageStats = {
    totalDreams: dreams.length,
    byLifeStage: LIFE_STAGES.map(stage => ({
      ...stage,
      count: getDreamsByLifeStage(stage.id).length,
    })),
    byWellbeing: WELLBEING_DIMENSIONS.map(dim => ({
      ...dim,
      count: dreams.filter(d => d.wellbeingDimension === dim.id).length,
    })),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/discover/vision/step3')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous Step
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 4: Dreams Matrix</h1>
          <p className="text-gray-600">
            Map your dreams across life stages and wellbeing dimensions to create a comprehensive life vision.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <StepProgress currentStep={4} totalSteps={5} />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Panel - Add Dreams */}
          <div className="lg:col-span-4 space-y-4">
            {/* Add Dream Card */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Add a Dream
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What's your dream?
                  </label>
                  <textarea
                    value={newDream}
                    onChange={(e) => setNewDream(e.target.value)}
                    placeholder="e.g., Start my own business, Travel to Japan, Learn to play piano..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Horizon
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {LIFE_STAGES.map(stage => (
                      <button
                        key={stage.id}
                        onClick={() => setSelectedLifeStage(stage.id)}
                        className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                          selectedLifeStage === stage.id
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {stage.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wellbeing Dimension (Optional)
                  </label>
                  <select
                    value={selectedWellbeing}
                    onChange={(e) => setSelectedWellbeing(e.target.value as WellbeingDimension | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select dimension...</option>
                    {WELLBEING_DIMENSIONS.map(dim => (
                      <option key={dim.id} value={dim.id}>
                        {dim.name} ({dim.nameKo})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddDream}
                  disabled={!newDream.trim() || saving}
                  className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Dream
                </button>
              </div>
            </div>

            {/* Coverage Stats */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Dream Coverage</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Total Dreams</span>
                    <span className="font-bold text-purple-600">{coverageStats.totalDreams}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all"
                      style={{ width: `${Math.min(100, coverageStats.totalDreams * 10)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">By Time Horizon</h4>
                  <div className="space-y-1">
                    {coverageStats.byLifeStage.map(stage => (
                      <div key={stage.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20">{stage.name}</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-400 transition-all"
                            style={{ width: `${Math.min(100, stage.count * 25)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-4">{stage.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">By Wellbeing</h4>
                  <div className="grid grid-cols-4 gap-1">
                    {coverageStats.byWellbeing.map(dim => {
                      const Icon = dim.icon;
                      return (
                        <div
                          key={dim.id}
                          className={`p-2 rounded-lg text-center ${dim.count > 0 ? dim.color : 'bg-gray-50'}`}
                          title={`${dim.name}: ${dim.count} dreams`}
                        >
                          <Icon className="w-4 h-4 mx-auto" />
                          <span className="text-xs">{dim.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-5 border border-purple-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                AI Dream Suggestions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Get personalized dream suggestions based on your values, strengths, and life themes.
              </p>

              {aiRecommendations.length === 0 && !aiSummary ? (
                <button
                  onClick={getAiRecommendations}
                  disabled={analyzing}
                  className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing your profile...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Get AI Suggestions
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  {aiSummary && (
                    <div className="p-3 bg-white rounded-lg border border-purple-200">
                      <p className="text-sm text-gray-700">{aiSummary}</p>
                    </div>
                  )}

                  {aiRecommendations.map((rec, idx) => {
                    const dimInfo = WELLBEING_DIMENSIONS.find(d => d.id === rec.wellbeingDimension);
                    const Icon = dimInfo?.icon || Sparkles;

                    return (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="flex items-start gap-2 mb-2">
                          <Icon className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{rec.dream}</p>
                            <div className="flex gap-1 mt-1">
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                {LIFE_STAGES.find(s => s.id === rec.lifeStage)?.name}
                              </span>
                              {dimInfo && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                  {dimInfo.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => addRecommendationAsDream(rec)}
                          className="w-full py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200"
                        >
                          <Plus className="w-3 h-3 inline mr-1" />
                          Add to My Dreams
                        </button>
                      </div>
                    );
                  })}

                  {aiRecommendations.length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">All suggestions added!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Dreams Matrix */}
          <div className="lg:col-span-8 space-y-4">
            {/* Dreams by Life Stage */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Dreams by Life Stage</h3>

              <div className="space-y-4">
                {LIFE_STAGES.map(stage => {
                  const stageDreams = getDreamsByLifeStage(stage.id);

                  return (
                    <div key={stage.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{stage.name}</h4>
                          <p className="text-xs text-gray-500">{stage.description}</p>
                        </div>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                          {stageDreams.length} dreams
                        </span>
                      </div>

                      {stageDreams.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
                          <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No dreams added for this time horizon</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {stageDreams.map(dream => {
                            const dimInfo = dream.wellbeingDimension
                              ? WELLBEING_DIMENSIONS.find(d => d.id === dream.wellbeingDimension)
                              : null;
                            const Icon = dimInfo?.icon || Sparkles;

                            return (
                              <div
                                key={dream.id}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-purple-50 transition-colors"
                              >
                                <div className={`p-1.5 rounded-lg ${dimInfo?.color || 'bg-purple-50 text-purple-600'}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {editingDreamId === dream.id ? (
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={editedDreamText}
                                        onChange={(e) => setEditedDreamText(e.target.value)}
                                        className="flex-1 px-2 py-1 border rounded text-sm"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => saveEditDream(dream.id)}
                                        className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingDreamId(null)}
                                        className="px-2 py-1 bg-gray-200 rounded text-xs"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm font-medium text-gray-900">{dream.dream}</p>
                                      {dimInfo && (
                                        <span className="text-xs text-gray-500">{dimInfo.name}</span>
                                      )}
                                    </>
                                  )}
                                </div>
                                {editingDreamId !== dream.id && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => startEditDream(dream)}
                                      className="p-1.5 hover:bg-gray-200 rounded"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDream(dream.id)}
                                      className="p-1.5 hover:bg-red-100 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wellbeing Matrix Overview */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Wellbeing Dimension Coverage</h3>
              <p className="text-sm text-gray-600 mb-4">
                Aim for balanced coverage across all 7 dimensions for holistic life planning.
              </p>

              <div className="grid grid-cols-7 gap-2">
                {WELLBEING_DIMENSIONS.map(dim => {
                  const count = dreams.filter(d => d.wellbeingDimension === dim.id).length;
                  const Icon = dim.icon;
                  const hasGoodCoverage = count >= 2;

                  return (
                    <div
                      key={dim.id}
                      className={`text-center p-3 rounded-xl border-2 transition-all ${
                        hasGoodCoverage
                          ? `${dim.color} border-current`
                          : count > 0
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-gray-50 border-dashed border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-1 ${hasGoodCoverage ? '' : 'opacity-50'}`} />
                      <p className="text-xs font-medium truncate">{dim.nameKo}</p>
                      <p className="text-lg font-bold">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/discover/vision/step3')}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous Step
          </button>

          <button
            onClick={handleContinue}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue to Vision Statement
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
