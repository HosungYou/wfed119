'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, BookOpen, Target, Sparkles, Loader2, Plus, TrendingUp } from 'lucide-react';

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

export default function DreamsHubPage() {
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

  const getCategoryCount = (category: string) => {
    return dreams.filter(d => d.category === category).length;
  };

  const categories = [
    {
      id: 'exploration',
      title: 'Exploration',
      icon: Compass,
      description: 'Places to visit, cultures to experience',
      color: 'blue',
      count: getCategoryCount('exploration')
    },
    {
      id: 'learning',
      title: 'Learning',
      icon: BookOpen,
      description: 'Skills to acquire, knowledge to gain',
      color: 'purple',
      count: getCategoryCount('learning')
    },
    {
      id: 'achievement',
      title: 'Achievement',
      icon: Target,
      description: 'Goals to accomplish, milestones to reach',
      color: 'green',
      count: getCategoryCount('achievement')
    },
    {
      id: 'experience',
      title: 'Experience',
      icon: Sparkles,
      description: 'Activities to try, moments to create',
      color: 'orange',
      count: getCategoryCount('experience')
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100',
      purple: 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100',
      green: 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100',
      orange: 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
    };
    return colors[color as keyof typeof colors];
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            My Dream List
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            What do you want to explore, learn, achieve, and experience in your life?
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => router.push('/discover/dreams')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium"
          >
            Category View
          </button>
          <button
            onClick={() => router.push('/discover/dreams/timeline')}
            className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Timeline View
          </button>
          <button
            onClick={() => router.push('/discover/dreams/integration')}
            className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Values Integration
          </button>
        </div>

        {/* Category Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => router.push('/discover/dreams/categories')}
                className={`${getColorClasses(category.color)} border-2 rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-lg`}
              >
                <div className="flex items-start justify-between mb-4">
                  <Icon className="w-8 h-8" />
                  <div className="text-2xl font-bold">{category.count}</div>
                </div>
                <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                <p className="text-sm opacity-80">{category.description}</p>
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{dreams.length}</div>
              <div className="text-sm text-gray-600">Total Dreams</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {dreams.filter(d => d.is_completed).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {dreams.filter(d => !d.is_completed).length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/discover/dreams/categories')}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Dream
          </button>
          <button
            onClick={async () => {
              // Navigate to categories page which will have AI suggest feature
              router.push('/discover/dreams/categories');
            }}
            className="inline-flex items-center px-8 py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            AI Suggest Dreams
          </button>
        </div>
      </div>
    </div>
  );
}
