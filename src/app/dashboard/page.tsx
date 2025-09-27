'use client';

import React, { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import {
  User, Shield, Brain, Heart, Target, Briefcase,
  CheckCircle, Circle, TrendingUp, Download, Share2,
  Loader2, ArrowRight, Lock, Users
} from 'lucide-react';

interface DashboardData {
  user: any;
  modules: {
    strengths: any;
    values: any;
    enneagram: any;
    career: any;
  };
  insights: any;
  adminAccess: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchDashboardData();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/user-data');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleSignIn = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-8">
              Please sign in with Google to view your personalized dashboard and analysis results.
            </p>
            <button
              onClick={handleSignIn}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { user: dashboardUser, modules, insights, adminAccess } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {dashboardUser.image && (
                <img
                  src={dashboardUser.image}
                  alt={dashboardUser.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold">{dashboardUser.name}'s Dashboard</h1>
                <p className="text-sm text-gray-600">{dashboardUser.email}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Member since {new Date(dashboardUser.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  Overall Completion
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {Math.round(insights.completionRate)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{ width: `${insights.completionRate}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Strengths Discovery */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-600" />
                <h3 className="text-lg font-semibold">Strengths Discovery</h3>
              </div>
              {modules.strengths.completed ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400" />
              )}
            </div>
            {modules.strengths.latestStrengths.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">Your top strengths:</p>
                <div className="flex flex-wrap gap-2">
                  {modules.strengths.latestStrengths.slice(0, 5).map((s: any, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-4">Discover your unique strengths through conversation</p>
            )}
            <Link
              href="/discover/strengths"
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              {modules.strengths.completed ? 'Review' : 'Start'} Discovery
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Values Assessment */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-600" />
                <h3 className="text-lg font-semibold">Values Assessment</h3>
              </div>
              {modules.values.completed ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm">
                  Terminal: {modules.values.terminal ? '✓' : '○'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-sm">
                  Instrumental: {modules.values.instrumental ? '✓' : '○'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span className="text-sm">
                  Work: {modules.values.work ? '✓' : '○'}
                </span>
              </div>
            </div>
            <Link
              href="/discover/values"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
            >
              {modules.values.completed ? 'Review' : 'Start'} Assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Insights Section */}
        {insights.strengthSummary.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Your Strength Profile
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {insights.strengthSummary.slice(0, 6).map((strength: any, i: number) => (
                <div key={i} className="border-l-4 border-blue-600 pl-3">
                  <p className="font-medium text-sm">{strength.name}</p>
                  <p className="text-xs text-gray-600 capitalize">{strength.category}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-1 bg-blue-200 rounded flex-1">
                      <div
                        className="h-1 bg-blue-600 rounded"
                        style={{ width: `${strength.avgConfidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(strength.avgConfidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}