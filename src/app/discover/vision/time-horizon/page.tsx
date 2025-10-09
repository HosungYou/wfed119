'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Calendar, Clock } from 'lucide-react';

export default function TimeHorizonSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [horizonType, setHorizonType] = useState<'years_from_now' | 'specific_age'>('years_from_now');
  const [yearsFromNow, setYearsFromNow] = useState(10);
  const [specificAge, setSpecificAge] = useState(65);

  async function handleContinue() {
    setSaving(true);

    try {
      const timeHorizon = horizonType === 'years_from_now' ? yearsFromNow : specificAge;

      // First, ensure session exists by calling GET
      const getResponse = await fetch('/api/discover/vision/session');
      if (!getResponse.ok) {
        console.error('[Time Horizon] Failed to load session');
        throw new Error('Failed to load session');
      }

      const sessionData = await getResponse.json();
      console.log('[Time Horizon] Session loaded:', sessionData);

      // Then update with time horizon
      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_horizon: timeHorizon,
          time_horizon_type: horizonType,
          current_step: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Time Horizon] Update error:', errorData);
        throw new Error('Failed to save time horizon');
      }

      const updatedData = await response.json();
      console.log('[Time Horizon] Updated successfully:', updatedData);

      router.push('/discover/vision/step1');
    } catch (error) {
      console.error('[Time Horizon] Error:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-3xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            When do you want to envision your future?
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Choose a time horizon that feels meaningful to you. There's no right or wrong answer—pick what resonates with your life stage and aspirations.
          </p>
        </div>

        {/* Options Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Option 1: Years from now */}
          <div
            onClick={() => setHorizonType('years_from_now')}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all mb-6 ${
              horizonType === 'years_from_now'
                ? 'border-purple-500 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                horizonType === 'years_from_now'
                  ? 'border-purple-500 bg-purple-500'
                  : 'border-gray-300'
              }`}>
                {horizonType === 'years_from_now' && (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Years from now</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Think about where you'll be in a specific number of years from today.
                </p>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">How many years?</label>
                  <select
                    value={yearsFromNow}
                    onChange={(e) => setYearsFromNow(Number(e.target.value))}
                    disabled={horizonType !== 'years_from_now'}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value={5}>5 years</option>
                    <option value={10}>10 years</option>
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={25}>25 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Specific age */}
          <div
            onClick={() => setHorizonType('specific_age')}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              horizonType === 'specific_age'
                ? 'border-purple-500 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                horizonType === 'specific_age'
                  ? 'border-purple-500 bg-purple-500'
                  : 'border-gray-300'
              }`}>
                {horizonType === 'specific_age' && (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">At a specific age</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Envision yourself at a particular age milestone (e.g., retirement, mid-career peak).
                </p>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">What age?</label>
                  <input
                    type="number"
                    value={specificAge}
                    onChange={(e) => setSpecificAge(Number(e.target.value))}
                    disabled={horizonType !== 'specific_age'}
                    min={18}
                    max={100}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., 65"
                  />
                  <span className="text-sm text-gray-500">years old</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Why does this matter?</h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            Your time horizon helps ground your vision in reality. Whether you're envisioning your career in 10 years or imagining yourself at age 65, this context makes your vision statement more concrete and actionable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/discover/vision')}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={saving}
            className="flex-1 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue to Step 1
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
