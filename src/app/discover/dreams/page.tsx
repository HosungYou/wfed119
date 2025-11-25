'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Plus, X, Loader2, TrendingUp, Heart, Brain, Dumbbell, Home, DollarSign, Briefcase, Coffee, ArrowRight } from 'lucide-react';

interface Dream {
  id: string;
  title: string;
  description?: string;
  life_stage?: '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';
  wellbeing_area?: 'relationship' | 'spiritual' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure';
  related_values?: string[];
  is_completed: boolean;
}

type WellbeingArea = 'relationship' | 'spiritual' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure';
type LifeStage = '20s' | '30s' | '40s' | '50s' | '60s' | '70s+' | '80s+';

// Developmental tasks by life stage and wellbeing area
const developmentalTasks: Record<WellbeingArea, Record<LifeStage, string[]>> = {
  relationship: {
    '20s': ['Independent living', 'Romantic relationship formation', 'Identity development'],
    '30s': ['Marriage/partnership formation', 'Parenting/family role learning', 'Building school/community networks', 'Balancing work-family-leisure', 'Expanding social network'],
    '40s': ['Understanding adolescent development', 'Career advice provision', 'Building family memories', 'Managing adolescent children', 'Supporting aging parents', 'Maintaining couple relationship'],
    '50s': ['Adult children relationships', 'Empty nest adjustment', 'Grandparenting', 'Rekindling couple intimacy'],
    '60s': ['Spouse as closest companion', 'Senior socializing', 'Grandparenting', 'Relationships with adult children'],
    '70s+': ['Accepting spousal dependency', 'Cherishing time with family', 'Contemplating mortality', 'Preparing for final moments'],
    '80s+': ['Having family at bedside during illness', 'Receiving intergenerational care', 'Saying final goodbyes', 'Being remembered by descendants']
  },
  spiritual: {
    '20s': ['Philosophical reflection', 'Value formation', 'Meaningful experiences', 'Self-reflection'],
    '30s': ['Parenting as opportunity', 'Life meaning discovery', 'Volunteering and service', 'Child religious education', 'Sense of mission'],
    '40s': ['Midlife reflection', 'Existential questioning', 'Life direction contemplation', 'Career-life balance reflection', 'Deep questioning', 'Spiritual life cultivation'],
    '50s': ['Life review and assessment', 'Senior spiritual activities', 'Adult children spiritual guidance', 'Mission fulfillment', 'Life reflection'],
    '60s': ['Peace of mind', 'Gratitude practice', 'Senior meaning search', 'Volunteering', 'Spiritual maturity'],
    '70s+': ['Spiritual consolation', 'Preparation for death', 'Acceptance of mortality', 'Spiritual reading', 'Meaning of life reflection'],
    '80s+': ['Farewell to life', 'Religious solace', 'Peaceful departure', 'Spiritual contemplation', 'Final journey preparation']
  },
  intellectual: {
    '20s': ['Interest/talent exploration', 'Higher education', 'Professional skill acquisition', 'Creative activities'],
    '30s': ['Parenting expertise', 'Leadership/time management', 'Professional skill development', 'Novel reading', 'Intellectual hobbies', 'Creative activities'],
    '40s': ['Career knowledge/certification', 'Supporting children\'s education', 'New skill development', 'Personal hobby maintenance', 'Life wisdom accumulation', 'Intergenerational knowledge transfer'],
    '50s': ['Lifelong learning', 'New challenge exploration', 'Retirement preparation', 'Knowledge/expertise sharing'],
    '60s': ['New hobby exploration', 'Cognitive activities for brain health', 'Teaching children/grandchildren', 'Senior learning'],
    '70s+': ['Brain health maintenance', 'Reading and writing', 'Cultural activities', 'Life wisdom sharing'],
    '80s+': ['Memory preservation', 'Wisdom and experience transfer', 'Cultural engagement', 'Story recording and sharing']
  },
  physical: {
    '20s': ['Physical activity/exercise', 'Establishing healthy habits', 'Disease prevention', 'Body image development'],
    '30s': ['Pregnancy/childbirth', 'Postpartum recovery', 'Chronic disease prevention', 'Managing parenting fatigue', 'Health maintenance'],
    '40s': ['Chronic disease management', 'Regular exercise habits', 'Stress management', 'Regular health screenings', 'Musculoskeletal health'],
    '50s': ['Menopause management', 'Metabolic health', 'Joint health care', 'Chronic disease prevention'],
    '60s': ['Regular health checkups', 'Physical activity maintenance', 'Fall/injury prevention', 'Medication management'],
    '70s+': ['Preventing frailty/weakness', 'Fall prevention', 'Mobility maintenance', 'Visiting doctors for pain management'],
    '80s+': ['Maintaining daily living skills', 'Managing pain and discomfort', 'Health monitoring', 'Physical support and assistance']
  },
  environment: {
    '20s': ['Independent housing', 'Roommate living', 'Self-reliant living'],
    '30s': ['Home purchase', 'Childcare-friendly spaces', 'Building family nest', 'School district selection', 'Community networking'],
    '40s': ['Interior/exterior renovation', 'Space for adolescents', 'Optimizing living space', 'Comfortable environment', 'Neighborhood considerations'],
    '50s': ['Planning for smaller home', 'Empty nest space redesign', 'Safe living environment', 'Interior modifications'],
    '60s': ['Retirement home planning', 'Accessibility improvements', 'Senior-friendly design', 'Downsizing to smaller home'],
    '70s+': ['Safe home environment', 'Aging-in-place preparations', 'Care facility considerations', 'Living arrangement decisions'],
    '80s+': ['Long-term care facility', 'Hospice care', 'Safe care environment', 'Place for end-of-life care']
  },
  financial: {
    '20s': ['Financial independence', 'Budgeting and saving', 'Building credit', 'Investment planning', 'Debt management'],
    '30s': ['Home purchase fund', 'Education savings', 'Emergency fund', 'Insurance planning'],
    '40s': ['Children\'s education fund', 'Retirement savings increase', 'Career investment/development', 'Asset management', 'Large expense planning'],
    '50s': ['Retirement fund completion', 'Investment management', 'Children\'s college expenses', 'Financial goals achievement'],
    '60s': ['Retirement income management', 'Medical expense planning', 'Asset protection', 'Estate planning'],
    '70s+': ['Living expense management', 'Medical costs', 'Financial support to family', 'Inheritance planning'],
    '80s+': ['Care cost management', 'Insurance benefits', 'Minimizing family financial burden', 'Estate distribution']
  },
  career: {
    '20s': ['Job search/exploration', 'Career entry', 'Work skill acquisition', 'Professional identity'],
    '30s': ['Career advancement', 'Work-life balance', 'Leadership roles', 'Career development/growth'],
    '40s': ['Career peak period', 'Mentoring juniors', 'Career change/transition', 'Work achievements'],
    '50s': ['Career stability/maturity', 'Retirement preparation', 'Work meaning reflection', 'Career transition'],
    '60s': ['Gradual retirement planning', 'Part-time/consulting work', 'Career identity transition', 'New roles exploration'],
    '70s+': ['Post-retirement activities', 'Volunteering', 'Social contribution', 'Meaningful engagement'],
    '80s+': ['Maintaining social connections', 'Activities within capacity', 'Societal contribution', 'Satisfaction from engagement']
  },
  leisure: {
    '20s': ['Travel and adventure', 'Hobby exploration', 'Social activities', 'Cultural experiences'],
    '30s': ['Family-centered leisure', 'Parent-child activities', 'Maintaining hobbies', 'Cultural activities'],
    '40s': ['Personal time/hobbies', 'Family travel', 'Recreation activities', 'Cultural engagement', 'Leisure life enjoyment'],
    '50s': ['Couple-centered leisure', 'Travel', 'New hobby exploration', 'Cultural activities'],
    '60s': ['Hobby and leisure activities', 'Cultural engagement', 'Travel', 'Social activities'],
    '70s+': ['Leisure within ability', 'Cultural activities', 'Social engagement', 'Enjoyable activities'],
    '80s+': ['Simple leisure', 'Time with family', 'Indoor activities', 'Quality of life activities']
  }
};

export default function DreamsHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [newDream, setNewDream] = useState({ title: '', description: '', wellbeing_area: undefined as WellbeingArea | undefined, life_stage: undefined as LifeStage | undefined });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

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
        title: newDream.title,
        description: newDream.description,
        wellbeing_area: newDream.wellbeing_area,
        life_stage: newDream.life_stage === '80s+' ? '70s+' : newDream.life_stage,
        is_completed: false
      };

      const res = await fetch('/api/dreams/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream })
      });

      if (res.ok) {
        await loadDreams();
        setNewDream({ title: '', description: '', wellbeing_area: undefined, life_stage: undefined });
      }
    } catch (error) {
      console.error('Failed to add dream:', error);
      alert('Failed to add dream. Please try again.');
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
        const errorData = await res.json();
        alert(errorData.message || 'Failed to generate AI suggestions. Please complete Values, Strengths, or Vision modules first.');
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

  const wellbeingAreas: { id: WellbeingArea; nameEn: string; icon: any }[] = [
    { id: 'relationship', nameEn: 'Relationship', icon: Heart },
    { id: 'spiritual', nameEn: 'Spiritual', icon: Sparkles },
    { id: 'intellectual', nameEn: 'Intellectual', icon: Brain },
    { id: 'physical', nameEn: 'Physical', icon: Dumbbell },
    { id: 'environment', nameEn: 'Environment', icon: Home },
    { id: 'financial', nameEn: 'Financial', icon: DollarSign },
    { id: 'career', nameEn: 'Career', icon: Briefcase },
    { id: 'leisure', nameEn: 'Leisure', icon: Coffee }
  ];

  const lifeStages: LifeStage[] = ['20s', '30s', '40s', '50s', '60s', '70s+', '80s+'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            My Dream List
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create your dreams inspired by developmental tasks, or let AI suggest personalized goals
          </p>
        </div>

        {/* Main Content: Left Panel (Dream Creation) + Right Panel (Reference Table) */}
        <div className="grid lg:grid-cols-12 gap-6 mb-8">
          {/* Left Panel: Dream Creation */}
          <div className="lg:col-span-5 space-y-6">
            {/* Add Dream Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Dream</h3>
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
                    placeholder="Add more details..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wellbeing Area
                  </label>
                  <select
                    value={newDream.wellbeing_area || ''}
                    onChange={(e) => setNewDream({ ...newDream, wellbeing_area: e.target.value as WellbeingArea || undefined })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select wellbeing area</option>
                    {wellbeingAreas.map(area => (
                      <option key={area.id} value={area.id}>{area.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Life Stage
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
                <button
                  onClick={addDream}
                  disabled={!newDream.title.trim()}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  Add Dream
                </button>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Suggestions</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get personalized dream suggestions based on your values and vision
              </p>
              <button
                onClick={handleAISuggest}
                disabled={aiGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 inline animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5 inline mr-2" />
                    Get AI Suggestions
                  </>
                )}
              </button>
            </div>

            {/* Current Dreams Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Dreams</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{dreams.length}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {dreams.filter(d => d.wellbeing_area && d.life_stage).length}
                  </div>
                  <div className="text-sm text-gray-600">Organized</div>
                </div>
              </div>
              <button
                onClick={() => router.push('/discover/dreams/categories')}
                className="w-full py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50"
              >
                Go to Dream Matrix
                <ArrowRight className="w-5 h-5 inline ml-2" />
              </button>
            </div>
          </div>

          {/* Right Panel: Developmental Tasks Reference */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Developmental Tasks by Life Stage
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Reference examples for inspiration. Click any area to see tasks for each life stage.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-purple-100">
                      <th className="p-2 text-left font-semibold border border-gray-300">Area</th>
                      {lifeStages.map(stage => (
                        <th key={stage} className="p-2 text-center font-semibold border border-gray-300">{stage}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {wellbeingAreas.map((area) => {
                      const Icon = area.icon;
                      return (
                        <tr key={area.id} className="hover:bg-gray-50">
                          <td className="p-2 border border-gray-300">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                              <span className="font-medium">{area.nameEn}</span>
                            </div>
                          </td>
                          {lifeStages.map(stage => (
                            <td key={stage} className="p-2 border border-gray-300">
                              <ul className="space-y-1">
                                {developmentalTasks[area.id][stage].slice(0, 3).map((task, i) => (
                                  <li key={i} className="text-gray-700">• {task}</li>
                                ))}
                              </ul>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
    </div>
  );
}
