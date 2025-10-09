'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Circle } from 'lucide-react';
import StepProgress from '../components/StepProgress';
import ValuesSummary from '../components/ValuesSummary';
import AIChatBox from '../components/AIChatBox';

interface VisionSession {
  id: string;
  current_step: number;
  future_imagery?: string;
  future_imagery_analysis?: any;
}

interface Context {
  values: any;
  strengths: any;
  user: any;
  hasValues: boolean;
  hasStrengths: boolean;
}

export default function VisionStep1() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<VisionSession | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [futureImagery, setFutureImagery] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // 1. Session retrieval/creation
      const sessionRes = await fetch('/api/discover/vision/session');
      const sessionData = await sessionRes.json();
      setSession(sessionData);
      setFutureImagery(sessionData.future_imagery || '');

      // 2. Context retrieval (Values, Strengths)
      const contextRes = await fetch('/api/discover/vision/context');
      const contextData = await contextRes.json();

      // Check if user has completed prerequisites
      const hasValues = contextData?.values && (
        contextData.values.terminal?.top3?.length > 0 ||
        contextData.values.instrumental?.top3?.length > 0 ||
        contextData.values.work?.top3?.length > 0
      );

      const hasStrengths = contextData?.strengths && contextData.strengths.length > 0;

      setContext({
        ...contextData,
        hasValues,
        hasStrengths
      });

      setLoading(false);
    } catch (error) {
      console.error('[Step 1] Error loading data:', error);
      alert('Error loading data. Please try again.');
      setLoading(false);
    }
  }

  async function saveProgress() {
    if (!futureImagery.trim()) {
      alert('Please enter your future imagery.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 1,
          future_imagery: futureImagery
        })
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setLastSaved(new Date());
      alert('Saved successfully!');
    } catch (error) {
      console.error('[Step 1] Save error:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function goToNextStep() {
    if (!futureImagery.trim()) {
      alert('Please write your future imagery first.');
      return;
    }

    setSaving(true);

    try {
      // Save and move to next step
      await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 2,
          future_imagery: futureImagery
        })
      });

      router.push('/discover/vision/step2');
    } catch (error) {
      console.error('[Step 1] Next step error:', error);
      alert('Failed to proceed to next step.');
      setSaving(false);
    }
  }

  const handleAIResponse = (response: string) => {
    // Callback when AI response completes
    // Additional processing can be done here if needed
    console.log('[Step 1] AI response received:', response.substring(0, 100) + '...');
  };

  const handleDraftSuggested = (draft: string) => {
    // Draft를 Free Writing Area에 입력
    setFutureImagery(draft);
    console.log('[Step 1] Draft accepted:', draft);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  const hasPrerequisites = context?.hasValues || context?.hasStrengths;

  const initialMessage = hasPrerequisites
    ? `Hello! 👋

I'm your AI coach for this vision discovery journey.

Looking at ${context?.user?.name || 'your'} key values:
${formatTopValues(context?.values)}

${context?.hasStrengths ? `And your top strengths:
${formatTopStrengths(context?.strengths)}` : ''}

Now, let's imagine your life 10 years from now.

**Close your eyes and envision:**
- Where do you wake up in the morning?
- What do you see around you?
- What's the most meaningful moment of that day?

Share freely what comes to mind. Let's bring it to life together.`
    : `Hello! 👋

I'm your AI coach for this vision discovery journey.

**Note:** You haven't completed the Values and Strengths modules yet. While you can continue, completing those first will help me provide more personalized guidance based on your core values and unique strengths.

For now, let's imagine your ideal future 10 years from now:
- Where do you wake up in the morning?
- What do you see around you?
- What's the most meaningful moment of that day?

Share freely what comes to mind!`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <StepProgress currentStep={1} completedSteps={[]} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Step 1: Imagine Your Future
          </h1>
          <p className="text-gray-600">
            Freely envision your ideal day 10 years from now.
          </p>
        </div>

        {/* Prerequisites Warning */}
        {!hasPrerequisites && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">📋 Recommendation</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  For the best experience, we recommend completing <strong>Values Discovery</strong> and <strong>Strengths Discovery</strong> first.
                  This will help the AI provide more personalized and meaningful guidance based on your core values and unique strengths.
                </p>
                <div className="flex gap-3">
                  <a
                    href="/discover/values"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Complete Values First
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => {/* Just close the warning */}}
                    className="px-4 py-2 border border-yellow-600 text-yellow-700 text-sm font-medium rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    Continue Anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Values & Strengths Summary */}
          <div className="lg:col-span-1 space-y-6">
            {hasPrerequisites ? (
              <>
                <ValuesSummary values={context?.values || {}} />

                {/* Strengths Box */}
                {context?.hasStrengths && context.strengths && context.strengths.length > 0 && (
                  <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Your Top Strengths</h3>
                    </div>
                    <div className="space-y-2">
                      {context.strengths.slice(0, 3).map((strength: any, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold text-sm">{index + 1}.</span>
                          <span className="text-sm text-gray-700">{strength.name || strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-6 text-center">
                <Circle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">No prerequisite data found</p>
                <p className="text-xs text-gray-500">
                  Complete Values & Strengths modules to see your results here.
                </p>
              </div>
            )}

            {/* Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Guide</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Chat with AI to refine your future vision</li>
                <li>• Focus on visual details</li>
                <li>• Think about "why it matters"</li>
                <li>• No need to be perfect. Be free!</li>
              </ul>
            </div>

            {/* Save Status */}
            {lastSaved && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                ✓ Saved at {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Center: AI Chat */}
          <div className="lg:col-span-2 space-y-6">
            <AIChatBox
              step={1}
              context={context}
              onResponseComplete={handleAIResponse}
              onDraftSuggested={handleDraftSuggested}
              placeholder="Chat with AI to imagine your future..."
              initialMessage={initialMessage}
            />

            {/* Free Writing Area */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                📝 Free Writing Area
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Organize your thoughts inspired by the AI conversation. (Recommended: 300+ characters)
              </p>
              <textarea
                value={futureImagery}
                onChange={(e) => setFutureImagery(e.target.value)}
                placeholder="In 10 years, I will be..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-500">
                  {futureImagery.length} characters
                </span>
                <button
                  onClick={saveProgress}
                  disabled={saving || !futureImagery.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Progress
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Exit
              </button>
              <button
                onClick={goToNextStep}
                disabled={saving || !futureImagery.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTopValues(values: any): string {
  if (!values) return 'Loading values...';

  const parts: string[] = [];

  if (values.terminal?.top3?.[0]) {
    parts.push(`Terminal Value - ${values.terminal.top3[0]}`);
  }
  if (values.instrumental?.top3?.[0]) {
    parts.push(`Instrumental Value - ${values.instrumental.top3[0]}`);
  }
  if (values.work?.top3?.[0]) {
    parts.push(`Work Value - ${values.work.top3[0]}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No values data available';
}

function formatTopStrengths(strengths: any[]): string {
  if (!strengths || strengths.length === 0) return 'No strengths data available';

  return strengths
    .slice(0, 3)
    .map((s, i) => `${i + 1}. ${s.name || s}`)
    .join('\n');
}
