'use client';

import React, { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import {
  User, Brain, Heart, Target, Sparkles,
  CheckCircle, Circle, TrendingUp, ArrowRight, Lock, Home, BarChart3, Compass
} from 'lucide-react';
import { ModuleJourneyProgress, NextModuleCard } from '@/components/ModuleProgressSection';

interface ModuleStatus {
  completed: boolean;
  lastUpdated: string | null;
  progress: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState({
    values: { completed: false, lastUpdated: null, progress: 0 } as ModuleStatus,
    strengths: { completed: false, lastUpdated: null, progress: 0 } as ModuleStatus,
    vision: { completed: false, lastUpdated: null, progress: 0 } as ModuleStatus,
    enneagram: { completed: false, lastUpdated: null, progress: 0 } as ModuleStatus,
  });
  const [valuesData, setValuesData] = useState<any>(null);
  const [strengthsData, setStrengthsData] = useState<any>(null);
  const [visionData, setVisionData] = useState<any>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchModuleData(session.user.id);
      }
      setLoading(false);
    } catch (err) {
      console.error('Auth check failed:', err);
      setLoading(false);
    }
  };

  const fetchModuleData = async (userId: string) => {
    const supabase = createSupabaseClient();

    // Fetch Values data
    const { data: valuesResult } = await supabase
      .from('value_assessment_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (valuesResult) {
      setValuesData(valuesResult);
      const progress = [
        valuesResult.terminal_values_sorted,
        valuesResult.instrumental_values_sorted,
        valuesResult.work_values_sorted
      ].filter(Boolean).length / 3 * 100;

      setModules(prev => ({
        ...prev,
        values: {
          completed: valuesResult.is_completed || false,
          lastUpdated: valuesResult.updated_at,
          progress
        }
      }));
    }

    // Fetch Strengths data
    const { data: strengthsResult } = await supabase
      .from('strength_discovery_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (strengthsResult) {
      setStrengthsData(strengthsResult);
      const progress = strengthsResult.is_completed ? 100 :
        (strengthsResult.current_step || 0) / 4 * 100;

      setModules(prev => ({
        ...prev,
        strengths: {
          completed: strengthsResult.is_completed || false,
          lastUpdated: strengthsResult.updated_at,
          progress
        }
      }));
    }

    // Fetch Vision Statement data
    const { data: visionResult } = await supabase
      .from('vision_statements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (visionResult) {
      setVisionData(visionResult);
      const progress = visionResult.is_completed ? 100 :
        (visionResult.current_step || 0) / 3 * 100;

      setModules(prev => ({
        ...prev,
        vision: {
          completed: visionResult.is_completed || false,
          lastUpdated: visionResult.updated_at,
          progress
        }
      }));
    }
  };

  const handleSignIn = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-8">
              Please sign in with Google to view your personalized dashboard and track your progress.
            </p>
            <button
              onClick={handleSignIn}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallProgress = Math.round(
    (modules.values.progress + modules.strengths.progress + modules.vision.progress) / 3
  );

  const completedCount = Object.values(modules).filter(m => m.completed).length;
  const totalModules = 5; // Values, Strengths, Vision, SWOT, Dream List

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-blue-200"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {user.user_metadata?.full_name || 'Your'}'s Dashboard
                </h1>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden md:inline">Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Module Journey Progress - New Component */}
        <div className="mb-8">
          <ModuleJourneyProgress />
        </div>

        {/* Next Recommended Module */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <NextModuleCard />

          {/* Quick Stats Card */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">Quick Stats</h3>
                <p className="text-blue-100 text-sm">
                  {completedCount} of {totalModules} modules
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{overallProgress}%</div>
                <p className="text-blue-100 text-xs">Overall</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Values Discovery Module */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-pink-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-white" />
              </div>
              {modules.values.completed ? (
                <CheckCircle className="w-7 h-7 text-green-500" />
              ) : (
                <Circle className="w-7 h-7 text-gray-300" />
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Values Discovery</h3>
            <p className="text-sm text-gray-600 mb-4">
              {modules.values.completed
                ? 'Discover what truly matters to you'
                : 'Not started yet'}
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(modules.values.progress)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-full rounded-full transition-all"
                  style={{ width: `${modules.values.progress}%` }}
                />
              </div>
            </div>

            {/* Values Summary */}
            {valuesData && valuesData.terminal_values_sorted && (
              <div className="mb-4 p-3 bg-pink-50 rounded-lg">
                <p className="text-xs font-semibold text-pink-900 mb-2">Top Values:</p>
                <div className="flex flex-wrap gap-1">
                  {JSON.parse(valuesData.terminal_values_sorted).slice(0, 3).map((v: any, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 bg-pink-200 text-pink-800 rounded">
                      {v.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/discover/values"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              {modules.values.completed ? 'Review Results' : 'Start Discovery'}
              <ArrowRight className="w-4 h-4" />
            </Link>

            {modules.values.lastUpdated && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Last updated: {new Date(modules.values.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Strengths Discovery Module */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              {modules.strengths.completed ? (
                <CheckCircle className="w-7 h-7 text-green-500" />
              ) : (
                <Circle className="w-7 h-7 text-gray-300" />
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Strengths Discovery</h3>
            <p className="text-sm text-gray-600 mb-4">
              {modules.strengths.completed
                ? 'Your unique capabilities revealed'
                : 'Not started yet'}
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(modules.strengths.progress)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${modules.strengths.progress}%` }}
                />
              </div>
            </div>

            {/* Strengths Summary */}
            {strengthsData && strengthsData.final_strengths && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-2">Top Strengths:</p>
                <div className="flex flex-wrap gap-1">
                  {JSON.parse(strengthsData.final_strengths).slice(0, 3).map((s: any, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded">
                      {s.name || s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/discover/strengths"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              {modules.strengths.completed ? 'Review Results' : 'Start Discovery'}
              <ArrowRight className="w-4 h-4" />
            </Link>

            {modules.strengths.lastUpdated && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Last updated: {new Date(modules.strengths.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Vision Statement Module */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              {modules.vision.completed ? (
                <CheckCircle className="w-7 h-7 text-green-500" />
              ) : (
                <Circle className="w-7 h-7 text-gray-300" />
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Vision Statement</h3>
            <p className="text-sm text-gray-600 mb-4">
              {modules.vision.completed
                ? 'Your future vision defined'
                : 'Not started yet'}
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(modules.vision.progress)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${modules.vision.progress}%` }}
                />
              </div>
            </div>

            {/* Vision Statement Summary */}
            {visionData && visionData.final_statement && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs font-semibold text-indigo-900 mb-2">Your Vision:</p>
                <p className="text-sm text-indigo-700 italic">"{visionData.final_statement}"</p>
              </div>
            )}

            <Link
              href="/discover/vision"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all"
            >
              {modules.vision.completed ? 'Review Vision' : 'Craft Vision'}
              <ArrowRight className="w-4 h-4" />
            </Link>

            {modules.vision.lastUpdated && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Last updated: {new Date(modules.vision.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* SWOT Analysis Module */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <Circle className="w-7 h-7 text-gray-300" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">SWOT Analysis</h3>
            <p className="text-sm text-gray-600 mb-4">
              Strategic planning for your goals
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>0%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-600 h-full rounded-full transition-all"
                  style={{ width: '0%' }}
                />
              </div>
            </div>

            <div className="mb-4 p-3 bg-orange-50 rounded-lg min-h-[80px] flex items-center justify-center">
              <p className="text-xs text-orange-700 text-center">
                Analyze your strengths, weaknesses, opportunities, and threats
              </p>
            </div>

            <Link
              href="/discover/swot"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all"
            >
              Start Analysis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Dream List Module */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Compass className="w-7 h-7 text-white" />
              </div>
              <Circle className="w-7 h-7 text-gray-300" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Dream List</h3>
            <p className="text-sm text-gray-600 mb-4">
              Explore, learn, achieve, and experience
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>0%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-600 h-full rounded-full transition-all"
                  style={{ width: '0%' }}
                />
              </div>
            </div>

            <div className="mb-4 p-3 bg-purple-50 rounded-lg min-h-[80px] flex items-center justify-center">
              <p className="text-xs text-purple-700 text-center">
                Create your life dream list across 4 categories and life stages
              </p>
            </div>

            <Link
              href="/discover/dreams"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              Start Dreaming
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Insights Section */}
        {(valuesData || strengthsData || visionData) && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Your Insights</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Values Insight */}
              {valuesData && valuesData.terminal_values_sorted && (
                <div className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    Core Values
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Your top 3 terminal values guide your major life decisions:
                  </p>
                  <ul className="space-y-2">
                    {JSON.parse(valuesData.terminal_values_sorted).slice(0, 3).map((v: any, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-pink-600 font-bold">{i + 1}.</span>
                        <div>
                          <span className="font-semibold text-gray-900">{v.value}</span>
                          {v.description && (
                            <p className="text-xs text-gray-600 mt-1">{v.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths Insight */}
              {strengthsData && strengthsData.final_strengths && (
                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Key Strengths
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Your natural talents and capabilities:
                  </p>
                  <ul className="space-y-2">
                    {JSON.parse(strengthsData.final_strengths).slice(0, 3).map((s: any, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">{i + 1}.</span>
                        <div>
                          <span className="font-semibold text-gray-900">{s.name || s}</span>
                          {s.description && (
                            <p className="text-xs text-gray-600 mt-1">{s.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Vision Insight */}
              {visionData && visionData.final_statement && (
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl md:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Your Vision Statement
                  </h3>
                  <div className="bg-white p-6 rounded-lg border-2 border-indigo-200">
                    <p className="text-lg text-indigo-900 font-medium italic text-center">
                      "{visionData.final_statement}"
                    </p>
                  </div>
                  {visionData.core_aspirations && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-700 mb-2">Core Aspirations:</p>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(visionData.core_aspirations).map((a: any, i: number) => (
                          <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                            {a.keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!valuesData && !strengthsData && !visionData && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Your Discovery Journey</h3>
            <p className="text-gray-600 mb-6">
              You haven't completed any assessments yet. Start with Values Discovery to begin understanding yourself better.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Explore Modules
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
