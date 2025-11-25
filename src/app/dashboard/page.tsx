'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  User, Lock, Home, Loader2, CheckCircle2, Circle, ArrowRight, AlertCircle
} from 'lucide-react';
import { ModuleJourneyProgress, NextModuleCard } from '@/components/ModuleProgressSection';
import { ModuleProgressGrid } from '@/components/ModuleProgressCard';
import { useAllModulesProgress } from '@/hooks/useModuleProgress';
import { MODULE_ORDER, ModuleId } from '@/lib/types/modules';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user, isAuthenticated, loading, signInWithGoogle } = useAuth();
  const { modules, completedModules, loading: modulesLoading, error } = useAllModulesProgress();

  const completionSummary = useMemo(() => {
    const scores = MODULE_ORDER.map(moduleId => {
      const progress = modules[moduleId]?.progress;
      return progress?.completionPercentage ?? 0;
    });
    const total = scores.reduce((sum, v) => sum + v, 0);
    const avg = scores.length ? Math.round(total / scores.length) : 0;
    const completedCount = completedModules.length;
    return { avg, completedCount, totalModules: scores.length };
  }, [modules, completedModules]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-8">
              Sign in with your Google account to view your personalized dashboard and progress.
            </p>
            <button
              onClick={signInWithGoogle}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-blue-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {user?.user_metadata?.full_name || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">{user?.email}</p>
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
        {/* Module Journey */}
        <div className="mb-8">
          <ModuleJourneyProgress />
        </div>

        {/* Next Module & Quick Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <NextModuleCard />

          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold mb-1">Progress Summary</h3>
                <p className="text-blue-100 text-sm">
                  {completionSummary.completedCount} / {completionSummary.totalModules} modules completed
                </p>
              </div>
              <div className="text-4xl font-bold">{completionSummary.avg}%</div>
            </div>
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${completionSummary.avg}%` }}
              />
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
                <AlertCircle className="w-4 h-4" />
                Failed to load progress. Please try again later.
              </div>
            )}
          </div>
        </div>

        {/* Modules Grid */}
        {modulesLoading ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <ModuleProgressGrid modules={modules as any} />
        )}
      </main>
    </div>
  );
}
