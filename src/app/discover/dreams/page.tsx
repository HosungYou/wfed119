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
    '20s': ['Romantic relationship formation', 'Building adult friendships', 'Independence from parents', 'Identity formation through relationships'],
    '30s': ['Marriage/partnership', 'Starting a family', 'Forming school community connections', 'Maintaining friendships', 'Parent role learning'],
    '40s': ['Understanding adolescents', 'Guiding life choices', 'Family bonding', 'Supporting elderly parents', 'Maintaining couple relationship'],
    '50s': ['Adult children relationships', 'Empty nest adaptation', 'Grandparenting', 'Rekindling romance'],
    '60s': ['Spouse as best friend', 'Grandparenting', 'Relationships with adult children'],
    '70s+': ['Spousal dependency', 'Cherishing family moments', 'Anticipating death', 'End-of-life preparations'],
    '80s+': ['Family presence during illness', 'Intergenerational care', 'Final goodbyes', 'Leaving a legacy']
  },
  spiritual: {
    '20s': ['Exploring life meaning', 'Religious identity formation', 'Developing personal values'],
    '30s': ['Family spirituality', 'Community service', 'Finding life purpose', 'Spiritual growth through parenting'],
    '40s': ['Life reflection', 'Career spiritual connection', 'Mentoring others', 'Deepening faith'],
    '50s': ['Life review', 'Religious devotion', 'Spiritual community involvement', 'Finding new meaning'],
    '60s': ['Spiritual fulfillment', 'Volunteering', 'Participating in religious activities', 'Finding life meaning'],
    '70s+': ['Accepting mortality', 'Faith and hope', 'Spiritual community engagement', 'Life meaning reflection'],
    '80s+': ['Preparing for death', 'Spiritual contemplation', 'Life meaning questions', 'Death acceptance']
  },
  intellectual: {
    '20s': ['Career knowledge building', 'Higher education', 'Job skills acquisition', 'Creative activities'],
    '30s': ['Parenting knowledge', 'Leadership development', 'Professional growth', 'Intellectual hobbies'],
    '40s': ['Career advancement learning', 'Supporting children\'s education', 'New skills development', 'Personal interests'],
    '50s': ['Lifelong learning', 'New challenge exploration', 'Life transition preparation', 'Knowledge sharing'],
    '60s': ['Exploring new hobbies', 'Mental stimulation activities', 'Intergenerational teaching', 'Self-improvement'],
    '70s+': ['Brain health activities', 'Reading and writing', 'Cultural engagement', 'Sharing life wisdom'],
    '80s+': ['Memory preservation', 'Knowledge transfer', 'Cultural activities', 'Life story documentation']
  },
  physical: {
    '20s': ['Physical fitness', 'Healthy habits', 'Sports activities', 'Body image development'],
    '30s': ['Pregnancy and childbirth', 'Postpartum recovery', 'Chronic disease prevention', 'Exercise routine'],
    '40s': ['Chronic disease management', 'Regular exercise', 'Stress management', 'Health screening'],
    '50s': ['Menopause management', 'Metabolic health', 'Joint health', 'Preventing chronic diseases'],
    '60s': ['Regular health checkups', 'Physical activity', 'Injury prevention', 'Medication management'],
    '70s+': ['Preventing frailty', 'Fall prevention', 'Mobility maintenance', 'Pain management'],
    '80s+': ['Daily living assistance', 'Health monitoring', 'Pain management', 'Quality of life']
  },
  environment: {
    '20s': ['First home', 'Roommate living', 'Residential independence'],
    '30s': ['Home purchase', 'Creating child-friendly space', 'Building family nest', 'Community connections'],
    '40s': ['Home renovation', 'Teenage space planning', 'Maximizing home space', 'Comfortable living'],
    '50s': ['Downsizing planning', 'Empty nest redesign', 'Safe living space', 'Interior changes'],
    '60s': ['Retirement home planning', 'Accessible home modifications', 'Senior-friendly design', 'Smaller home transition'],
    '70s+': ['Safe home environment', 'Aging-in-place modifications', 'Assisted living considerations', 'Living arrangement decisions'],
    '80s+': ['Long-term care facility', 'Hospice/palliative care', 'Safe environment', 'End-of-life care setting']
  },
  financial: {
    '20s': ['Financial independence', 'Budgeting skills', 'Starting savings', 'Loan management'],
    '30s': ['Home purchase planning', 'Education fund', 'Emergency savings', 'Insurance planning'],
    '40s': ['Education funding', 'Retirement preparation', 'Career advancement investments', 'Asset management'],
    '50s': ['Retirement savings', 'Investment management', 'College tuition', 'Financial goal achievement'],
    '60s': ['Retirement income planning', 'Healthcare cost management', 'Asset protection', 'Estate planning'],
    '70s+': ['Living cost management', 'Healthcare expenses', 'Family financial support', 'Legacy planning'],
    '80s+': ['Care cost management', 'Insurance utilization', 'Family financial burden reduction', 'Estate settlement']
  },
  career: {
    '20s': ['Career exploration', 'Job entry', 'Skill development', 'Professional identity'],
    '30s': ['Career advancement', 'Work-life balance', 'Leadership opportunities', 'Professional growth'],
    '40s': ['Career peak', 'Mentoring juniors', 'Career transition', 'Work achievements'],
    '50s': ['Career consolidation', 'Retirement planning', 'Work meaning reflection', 'Role transitions'],
    '60s': ['Phased retirement', 'Consulting/part-time work', 'Career identity transition', 'New opportunities'],
    '70s+': ['Post-retirement activities', 'Volunteering', 'Social contributions', 'Meaningful activities'],
    '80s+': ['Social connection', 'Within-ability activities', 'Contributing to society', 'Life satisfaction']
  },
  leisure: {
    '20s': ['Travel and adventure', 'Hobbies exploration', 'Social activities', 'Cultural experiences'],
    '30s': ['Family activities', 'Parent-child bonding', 'Continuing hobbies', 'Cultural engagement'],
    '40s': ['Personal time', 'Hobby enjoyment', 'Family vacations', 'Cultural activities'],
    '50s': ['Couple activities', 'Travel', 'Exploring new hobbies', 'Cultural enrichment'],
    '60s': ['Hobbies and interests', 'Cultural activities', 'Travel', 'Social engagement'],
    '70s+': ['Within-ability hobbies', 'Cultural participation', 'Social activities', 'Leisure enjoyment'],
    '80s+': ['Simple leisure', 'Family time', 'Indoor activities', 'Quality of life activities']
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
                      <option key={area.id} value={area.id}>{area.nameKo} ({area.nameEn})</option>
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
                              <span className="font-medium">{area.nameKo}</span>
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
                                  {wellbeingArea?.nameKo}
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
