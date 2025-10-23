'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Circle, ArrowRight, LayoutDashboard, Target, Heart, Sparkles } from 'lucide-react';

interface ModuleProgress {
  values: {
    completed: boolean;
    progress: number;
    details: {
      terminal: boolean;
      instrumental: boolean;
      work: boolean;
    };
  };
  strengths: {
    completed: boolean;
    progress: number;
  };
  vision: {
    completed: boolean;
    progress: number;
    currentStep: number;
  };
}

export default function VisionModuleLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(null);

  useEffect(() => {
    fetchModuleProgress();
  }, []);

  async function fetchModuleProgress() {
    try {
      // Fetch prerequisites check
      const prereqResponse = await fetch('/api/discover/vision/check-prerequisites');
      const prereqData = await prereqResponse.json();

      // Fetch vision session to check progress
      const sessionResponse = await fetch('/api/discover/vision/session');
      const sessionData = await sessionResponse.json();

      setModuleProgress({
        values: {
          completed: prereqData.values || false,
          progress: prereqData.values ? 100 : 0,
          details: {
            terminal: prereqData.valuesDetails?.terminal || false,
            instrumental: prereqData.valuesDetails?.instrumental || false,
            work: prereqData.valuesDetails?.work || false,
          }
        },
        strengths: {
          completed: prereqData.strengths || false,
          progress: prereqData.strengths ? 100 : 0,
        },
        vision: {
          completed: sessionData.is_completed || false,
          progress: ((sessionData.current_step || 0) / 3) * 100,
          currentStep: sessionData.current_step || 0,
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('[Vision Landing] Error fetching progress:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading module status...</p>
        </div>
      </div>
    );
  }

  const canProceed = moduleProgress?.values.completed && moduleProgress?.strengths.completed;
  const hasStartedVision = (moduleProgress?.vision.currentStep || 0) > 0;

  async function startNewSession() {
    if (!confirm('Are you sure you want to start a new vision session? This will reset your current progress.')) {
      return;
    }

    try {
      // Reset vision session
      await fetch('/api/discover/vision/session', {
        method: 'DELETE'
      });

      alert('Session reset successfully! Starting fresh.');
      router.push('/discover/vision/time-horizon');
    } catch (error) {
      console.error('[Vision Landing] Error resetting session:', error);
      alert('Failed to reset session. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Vision Statement Module
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Craft your personal vision statement through a guided 3-step process with AI assistance.
          </p>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm font-medium">Dashboard</span>
            </button>
          </div>

          {/* Module Progress Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Values Module */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              moduleProgress?.values.completed
                ? 'bg-green-50 border-green-300'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className={`w-5 h-5 ${moduleProgress?.values.completed ? 'text-green-600' : 'text-gray-400'}`} />
                  <h3 className="font-semibold text-sm">Values</h3>
                </div>
                {moduleProgress?.values.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {moduleProgress?.values.completed ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Terminal Values</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Instrumental Values</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Work Values</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Not completed</p>
              )}
            </div>

            {/* Strengths Module */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              moduleProgress?.strengths.completed
                ? 'bg-green-50 border-green-300'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className={`w-5 h-5 ${moduleProgress?.strengths.completed ? 'text-green-600' : 'text-gray-400'}`} />
                  <h3 className="font-semibold text-sm">Strengths</h3>
                </div>
                {moduleProgress?.strengths.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {moduleProgress?.strengths.completed ? (
                <p className="text-xs text-green-700">✓ Discovery completed</p>
              ) : (
                <p className="text-xs text-gray-500">Not completed</p>
              )}
            </div>

            {/* Vision Module */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              moduleProgress?.vision.completed
                ? 'bg-purple-50 border-purple-300'
                : moduleProgress?.vision.currentStep > 0
                ? 'bg-blue-50 border-blue-300'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-5 h-5 ${
                    moduleProgress?.vision.completed ? 'text-purple-600' :
                    moduleProgress?.vision.currentStep > 0 ? 'text-blue-600' :
                    'text-gray-400'
                  }`} />
                  <h3 className="font-semibold text-sm">Vision</h3>
                </div>
                {moduleProgress?.vision.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {moduleProgress?.vision.completed ? (
                <p className="text-xs text-purple-700">✓ Vision complete</p>
              ) : moduleProgress?.vision.currentStep > 0 ? (
                <div>
                  <p className="text-xs text-blue-700 mb-2">Step {moduleProgress.vision.currentStep}/3</p>
                  <div className="bg-blue-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all"
                      style={{ width: `${moduleProgress.vision.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Not started</p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Overall Readiness</span>
              <span className="font-semibold">
                {canProceed ? '100%' : `${Math.round(((moduleProgress?.values.progress || 0) + (moduleProgress?.strengths.progress || 0)) / 2)}%`}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-500"
                style={{ width: canProceed ? '100%' : `${Math.round(((moduleProgress?.values.progress || 0) + (moduleProgress?.strengths.progress || 0)) / 2)}%` }}
              />
            </div>
          </div>

          {canProceed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                ✓ You're all set! Your values and strengths data will personalize your vision discovery.
              </p>
            </div>
          )}
        </div>

        {/* Prerequisites Info */}
        {!canProceed && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Why complete Values & Strengths first?</h3>
            <p className="text-sm text-blue-800 leading-relaxed mb-4">
              Your vision statement is most powerful when built on your core values and unique strengths.
              The AI coach uses this data to provide personalized guidance and meaningful questions.
            </p>
            <div className="flex flex-wrap gap-3">
              {!moduleProgress?.values.completed && (
                <a
                  href="/discover/values"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  Start Values Discovery
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
              {!moduleProgress?.strengths.completed && (
                <a
                  href="/discover/strengths"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  Start Strengths Discovery
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Primary Action */}
          <button
            onClick={() => router.push(
              hasStartedVision
                ? `/discover/vision/step${moduleProgress?.vision.currentStep}`
                : '/discover/vision/time-horizon'
            )}
            className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <Sparkles className="w-6 h-6" />
            {hasStartedVision ? `Continue Vision Statement (Step ${moduleProgress?.vision.currentStep})` :
             canProceed ? 'Start Vision Statement' :
             'Start Vision Statement Anyway'}
            <ArrowRight className="w-6 h-6" />
          </button>

          {!canProceed && !hasStartedVision && (
            <p className="text-center text-sm text-gray-500">
              You can start now, but we recommend completing Values & Strengths first for the best experience.
            </p>
          )}

          {/* Secondary Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
          </div>

          {/* Start New Session (only show if has started) */}
          {hasStartedVision && (
            <button
              onClick={startNewSession}
              className="w-full px-6 py-3 bg-white border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
            >
              Start New Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
