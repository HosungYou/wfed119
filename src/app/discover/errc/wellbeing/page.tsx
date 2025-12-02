'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Heart,
  Briefcase,
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Coffee,
  Save,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import {
  WELLBEING_DIMENSION_LABELS,
  WellbeingDimension,
  validateWellbeingScore,
} from '@/lib/types/errc';

interface WellbeingScores {
  career: number;
  relationships: number;
  health: number;
  finances: number;
  personal_growth: number;
  leisure: number;
}

const DIMENSION_ICONS: Record<WellbeingDimension, React.ReactNode> = {
  career: <Briefcase className="w-6 h-6" />,
  relationships: <Users className="w-6 h-6" />,
  health: <Activity className="w-6 h-6" />,
  finances: <DollarSign className="w-6 h-6" />,
  personal_growth: <TrendingUp className="w-6 h-6" />,
  leisure: <Coffee className="w-6 h-6" />,
};

const DIMENSION_DESCRIPTIONS: Record<WellbeingDimension, string> = {
  career: 'Your satisfaction with work, career progress, and professional fulfillment',
  relationships: 'Quality of connections with family, friends, and community',
  health: 'Physical fitness, mental wellbeing, and overall health habits',
  finances: 'Financial security, savings, and money management',
  personal_growth: 'Learning, self-improvement, and pursuing meaningful goals',
  leisure: 'Recreation, hobbies, and work-life balance',
};

const DIMENSION_COLORS: Record<WellbeingDimension, string> = {
  career: 'from-blue-500 to-blue-600',
  relationships: 'from-pink-500 to-pink-600',
  health: 'from-green-500 to-green-600',
  finances: 'from-yellow-500 to-yellow-600',
  personal_growth: 'from-purple-500 to-purple-600',
  leisure: 'from-teal-500 to-teal-600',
};

function WellbeingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAfterMode = searchParams.get('mode') === 'after';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [existingAssessment, setExistingAssessment] = useState<WellbeingScores | null>(null);
  const [scores, setScores] = useState<WellbeingScores>({
    career: 5,
    relationships: 5,
    health: 5,
    finances: 5,
    personal_growth: 5,
    leisure: 5,
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { updateStage } = useModuleProgress('errc');

  const fetchSession = useCallback(async () => {
    try {
      // First get or create session
      let res = await fetch('/api/errc/session');
      let sessionData = res.ok ? await res.json() : null;

      if (!sessionData?.id) {
        // Create new session
        res = await fetch('/api/errc/session', { method: 'POST' });
        sessionData = res.ok ? await res.json() : null;
      }

      if (!sessionData?.id) {
        throw new Error('Failed to create session');
      }

      setSessionId(sessionData.id);

      // Fetch existing wellbeing assessment
      const type = isAfterMode ? 'after' : 'before';
      const wellbeingRes = await fetch(`/api/errc/wellbeing?type=${type}`);
      if (wellbeingRes.ok) {
        const wellbeingData = await wellbeingRes.json();
        if (wellbeingData) {
          setExistingAssessment(wellbeingData.scores);
          setScores(wellbeingData.scores);
          setNotes(wellbeingData.notes || '');
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('[Wellbeing] Error:', err);
      setError('Failed to load session');
      setLoading(false);
    }
  }, [isAfterMode]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleScoreChange = (dimension: WellbeingDimension, value: number) => {
    if (validateWellbeingScore(value)) {
      setScores(prev => ({ ...prev, [dimension]: value }));
    }
  };

  const handleSave = async (proceed: boolean = false) => {
    if (!sessionId) return;

    setSaving(true);
    setError(null);

    try {
      const type = isAfterMode ? 'after' : 'before';
      const method = existingAssessment ? 'PUT' : 'POST';

      const res = await fetch('/api/errc/wellbeing', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_type: type,
          scores,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save assessment');
      }

      if (proceed) {
        if (isAfterMode) {
          // Update session to completed
          await fetch('/api/errc/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_step: 'completed', status: 'completed' }),
          });
          await updateStage('completed', 100);
          router.push('/discover/errc/results');
        } else {
          // Update session to canvas step
          await fetch('/api/errc/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_step: 'canvas' }),
          });
          await updateStage('canvas', 20);
          router.push('/discover/errc/canvas');
        }
      } else {
        setExistingAssessment(scores);
      }
    } catch (err) {
      console.error('[Wellbeing] Save error:', err);
      setError('Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const calculateAverage = () => {
    const values = Object.values(scores);
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isAfterMode ? 'Final Wellbeing Assessment' : 'Initial Wellbeing Assessment'}
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            {isAfterMode
              ? 'Reflect on your wellbeing after implementing your ERRC action plan'
              : 'Rate your current satisfaction in each life dimension on a scale of 1-10'
            }
          </p>
          {isAfterMode && (
            <div className="mt-4 inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              Compare with your initial scores to see your progress
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Wellbeing Wheel Visualization */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Wellbeing Wheel</h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-rose-600">{calculateAverage()}</div>
              <div className="text-sm text-gray-500">Average Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Object.keys(scores) as WellbeingDimension[]).map((dimension) => (
              <div key={dimension} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${DIMENSION_COLORS[dimension]} text-white`}>
                      {DIMENSION_ICONS[dimension]}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {WELLBEING_DIMENSION_LABELS[dimension]}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {DIMENSION_DESCRIPTIONS[dimension]}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{scores[dimension]}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scores[dimension]}
                    onChange={(e) => handleScoreChange(dimension, parseInt(e.target.value))}
                    className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br
                      [&::-webkit-slider-thumb]:${DIMENSION_COLORS[dimension]} [&::-webkit-slider-thumb]:shadow-md
                      [&::-webkit-slider-thumb]:cursor-pointer`}
                  />
                  <span className="text-xs text-gray-400">10</span>
                </div>

                {/* Score indicators */}
                <div className="flex justify-between px-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleScoreChange(dimension, num)}
                      className={`w-6 h-6 text-xs rounded-full transition-all ${
                        scores[dimension] === num
                          ? `bg-gradient-to-br ${DIMENSION_COLORS[dimension]} text-white font-semibold`
                          : 'hover:bg-gray-100 text-gray-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isAfterMode ? 'Reflection Notes' : 'Additional Notes'}
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isAfterMode
              ? 'Reflect on your journey and the changes you\'ve experienced...'
              : 'Any additional thoughts about your current wellbeing...'
            }
            className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/errc')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Overview
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Progress
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              {isAfterMode ? 'Complete Assessment' : 'Continue to ERRC Canvas'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WellbeingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <WellbeingContent />
    </Suspense>
  );
}
