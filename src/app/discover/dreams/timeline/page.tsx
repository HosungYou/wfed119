'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Calendar, Compass, BookOpen, Target, Sparkles } from 'lucide-react';

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

type LifeStage = '40s' | '50s' | '60s' | '70s+';

export default function DreamsTimelinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dreams, setDreams] = useState<Dream[]>([]);

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

  const lifeStages: LifeStage[] = ['40s', '50s', '60s', '70s+'];

  const getDreamsByStage = (stage: LifeStage) => {
    return dreams.filter(d => d.life_stage === stage);
  };

  const unassignedDreams = dreams.filter(d => !d.life_stage);

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
      exploration: 'text-blue-600',
      learning: 'text-purple-600',
      achievement: 'text-green-600',
      experience: 'text-orange-600'
    };
    return colors[category as keyof typeof colors] || 'text-gray-600';
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Life Stage Timeline</h1>
            <p className="text-gray-600 mt-2">Organize your dreams across different decades of your life</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {lifeStages.map((stage) => {
            const stageDreams = getDreamsByStage(stage);

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
                          <Icon className={`w-5 h-5 mt-0.5 ${colorClass}`} />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{dream.title}</h4>
                            {dream.description && (
                              <p className="text-sm text-gray-600 mt-1">{dream.description}</p>
                            )}
                            <span className="inline-block mt-2 px-2 py-1 bg-white text-xs rounded-full capitalize">
                              {dream.category}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Unassigned Dreams */}
        {unassignedDreams.length > 0 && (
          <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-4">
              Unscheduled Dreams ({unassignedDreams.length})
            </h3>
            <p className="text-sm text-yellow-800 mb-4">
              These dreams haven't been assigned to a life stage yet. Consider when you'd like to pursue them!
            </p>
            <div className="space-y-2">
              {unassignedDreams.map((dream) => {
                const Icon = getCategoryIcon(dream.category);
                const colorClass = getCategoryColor(dream.category);

                return (
                  <div
                    key={dream.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg"
                  >
                    <Icon className={`w-5 h-5 ${colorClass}`} />
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

        {/* Navigation */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.push('/discover/dreams/categories')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
          >
            Manage Dreams
          </button>
          <button
            onClick={() => router.push('/discover/dreams/integration')}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
          >
            View Values Integration
          </button>
        </div>
      </div>
    </div>
  );
}
