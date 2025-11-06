'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Heart, Users, Compass, BookOpen, Target, Sparkles, AlertCircle } from 'lucide-react';

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

export default function DreamsIntegrationPage() {
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

  // Placeholder data for values and roles
  const sampleValues = ['Growth', 'Creativity', 'Connection', 'Impact', 'Adventure'];
  const sampleRoles = ['Professional', 'Parent', 'Partner', 'Friend', 'Lifelong Learner'];

  const dreamsWithValues = dreams.filter(d => d.related_values && d.related_values.length > 0);
  const dreamsWithRoles = dreams.filter(d => d.related_roles && d.related_roles.length > 0);
  const untaggedDreams = dreams.filter(d =>
    (!d.related_values || d.related_values.length === 0) &&
    (!d.related_roles || d.related_roles.length === 0)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/discover/dreams')}
              className="text-gray-600 hover:text-gray-800 mb-2"
            >
              ← Back to Dream List
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Values & Roles Integration</h1>
            <p className="text-gray-600 mt-2">
              Connect your dreams to your core values and life roles for deeper alignment
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-6">
            <div className="text-4xl font-bold mb-2">{dreams.length}</div>
            <div className="text-purple-100">Total Dreams</div>
          </div>
          <div className="bg-white border-2 border-purple-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{dreamsWithValues.length}</div>
            </div>
            <div className="text-gray-600">Connected to Values</div>
          </div>
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{dreamsWithRoles.length}</div>
            </div>
            <div className="text-gray-600">Connected to Roles</div>
          </div>
        </div>

        {/* Untagged Dreams Alert */}
        {untaggedDreams.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-900 mb-2">
                  {untaggedDreams.length} Dreams Need Tagging
                </h3>
                <p className="text-sm text-yellow-800 mb-4">
                  These dreams haven't been connected to your values or roles yet. Tag them to better understand their significance in your life.
                </p>
                <button
                  onClick={() => router.push('/discover/dreams/categories')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700"
                >
                  Tag Dreams
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Values Alignment */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Values Alignment</h2>
          </div>

          {sampleValues.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-4">No values defined yet</p>
              <button
                onClick={() => router.push('/discover/values')}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
              >
                Define Your Values
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sampleValues.map((value, index) => {
                const valueDreams = dreams.filter(d =>
                  d.related_values && d.related_values.includes(value)
                );

                return (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{value}</h3>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                        {valueDreams.length} dreams
                      </span>
                    </div>

                    {valueDreams.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No dreams aligned with this value yet</p>
                    ) : (
                      <div className="space-y-2">
                        {valueDreams.map((dream) => {
                          const Icon = getCategoryIcon(dream.category);
                          const colorClass = getCategoryColor(dream.category);

                          return (
                            <div
                              key={dream.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${colorClass.split(' ')[1]}`}
                            >
                              <Icon className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                              <span className="text-sm text-gray-900">{dream.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Roles Alignment */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Life Roles Alignment</h2>
          </div>

          {sampleRoles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-4">No life roles defined yet</p>
              <button
                onClick={() => router.push('/discover/vision')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                Define Your Life Roles
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sampleRoles.map((role, index) => {
                const roleDreams = dreams.filter(d =>
                  d.related_roles && d.related_roles.includes(role)
                );

                return (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{role}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                        {roleDreams.length} dreams
                      </span>
                    </div>

                    {roleDreams.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No dreams aligned with this role yet</p>
                    ) : (
                      <div className="space-y-2">
                        {roleDreams.map((dream) => {
                          const Icon = getCategoryIcon(dream.category);
                          const colorClass = getCategoryColor(dream.category);

                          return (
                            <div
                              key={dream.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${colorClass.split(' ')[1]}`}
                            >
                              <Icon className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                              <span className="text-sm text-gray-900">{dream.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/discover/dreams/categories')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
          >
            Manage Dreams
          </button>
          <button
            onClick={() => router.push('/discover/dreams/timeline')}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
          >
            View Timeline
          </button>
        </div>
      </div>
    </div>
  );
}
