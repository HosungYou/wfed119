'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save, Loader2, Sparkles } from 'lucide-react';
import StepProgress from '../components/StepProgress';
import ValuesSummary from '../components/ValuesSummary';
import AIChatBox from '../components/AIChatBox';

interface VisionSession {
  id: string;
  user_id: string;
  future_imagery: string | null;
  core_aspirations: { keyword: string; reason: string }[] | null;
  draft_versions: { style: string; text: string; timestamp: string }[] | null;
  final_statement: string | null;
  statement_style: string | null;
  current_step: number;
}

interface Context {
  values: {
    terminal: { rank: number; value: string; description: string }[];
    instrumental: { rank: number; value: string; description: string }[];
    work: { rank: number; value: string; description: string }[];
  };
  strengths: { rank: number; strength: string; description: string }[];
}

type VisionStyle = 'action' | 'state' | 'inspirational';

const STYLE_INFO: Record<VisionStyle, { label: string; description: string; example: string }> = {
  action: {
    label: 'Action-Oriented',
    description: 'Focus on concrete actions and impact',
    example: 'I create [impact] through [action]'
  },
  state: {
    label: 'State-Oriented',
    description: 'Focus on desired role or state',
    example: 'As [role/state], I realize [value]'
  },
  inspirational: {
    label: 'Inspirational',
    description: 'Focus on metaphors and ideals',
    example: 'Pursue [ideal] as [metaphor]'
  }
};

export default function VisionStep3() {
  const router = useRouter();
  const [session, setSession] = useState<VisionSession | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<VisionStyle | null>(null);
  const [customStatement, setCustomStatement] = useState('');
  const [draftVersions, setDraftVersions] = useState<{ style: string; text: string; timestamp: string }[]>([]);
  const [generatedDrafts, setGeneratedDrafts] = useState<Record<VisionStyle, string>>({
    action: '',
    state: '',
    inspirational: ''
  });

  // NEW: Choose Only ONE aspiration
  const [primaryAspiration, setPrimaryAspiration] = useState<string | null>(null);
  const [showMagnitudeQuestions, setShowMagnitudeQuestions] = useState(false);
  const [magnitudeOfImpact, setMagnitudeOfImpact] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Load session
      const sessionRes = await fetch('/api/discover/vision/session');
      if (!sessionRes.ok) throw new Error('Failed to load session');
      const sessionData = await sessionRes.json();

      // Verify Step 2 is complete
      if (!sessionData.core_aspirations || sessionData.core_aspirations.length < 3) {
        alert('Please complete Step 2 first.');
        router.push('/discover/vision/step2');
        return;
      }

      setSession(sessionData);

      // Load existing drafts if any
      if (sessionData.draft_versions && Array.isArray(sessionData.draft_versions)) {
        setDraftVersions(sessionData.draft_versions);
      }

      if (sessionData.final_statement) {
        setCustomStatement(sessionData.final_statement);
      }

      if (sessionData.statement_style) {
        setSelectedStyle(sessionData.statement_style as VisionStyle);
      }

      // Load context
      const contextRes = await fetch('/api/discover/vision/context');
      if (!contextRes.ok) throw new Error('Failed to load context');
      const contextData = await contextRes.json();
      setContext(contextData);

    } catch (error) {
      console.error('[Step3] Load error:', error);
      alert('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  async function generateDrafts() {
    if (!session || !context) return;

    try {
      setGenerating(true);

      // Call AI to generate 3 style drafts
      const response = await fetch('/api/discover/vision/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3,
          userMessage: 'Based on the core aspirations discovered, please generate vision statements in three styles.',
          conversationHistory: [],
          context: {
            ...context,
            futureImagery: session.future_imagery,
            coreAspirations: session.core_aspirations
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate drafts');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              fullResponse += data.content;
            }
          }
        }
      }

      // Parse the three drafts from AI response
      const parsedDrafts = parseDraftsFromAI(fullResponse);
      setGeneratedDrafts(parsedDrafts);

    } catch (error) {
      console.error('[Step3] Generate error:', error);
      alert('Failed to generate vision statements.');
    } finally {
      setGenerating(false);
    }
  }

  function parseDraftsFromAI(response: string): Record<VisionStyle, string> {
    const drafts: Record<VisionStyle, string> = {
      action: '',
      state: '',
      inspirational: ''
    };

    // Simple parsing: look for patterns like "1. Action-Oriented:" or "**Action-Oriented**"
    const actionMatch = response.match(/(?:1\.|Action)[:\s]*([^\n]+)/i);
    const stateMatch = response.match(/(?:2\.|State)[:\s]*([^\n]+)/i);
    const inspirationalMatch = response.match(/(?:3\.|Inspirational|Inspirational)[:\s]*([^\n]+)/i);

    if (actionMatch) drafts.action = actionMatch[1].trim();
    if (stateMatch) drafts.state = stateMatch[1].trim();
    if (inspirationalMatch) drafts.inspirational = inspirationalMatch[1].trim();

    return drafts;
  }

  function selectDraft(style: VisionStyle, text: string) {
    setSelectedStyle(style);
    setCustomStatement(text);
  }

  function saveDraftVersion() {
    if (!customStatement.trim()) {
      alert('Please enter your vision statement.');
      return;
    }

    const newDraft = {
      style: selectedStyle || 'custom',
      text: customStatement.trim(),
      timestamp: new Date().toISOString()
    };

    setDraftVersions(prev => [...prev, newDraft]);
    alert('Draft saved successfully.');
  }

  async function saveProgress() {
    if (!session) return;

    try {
      setSaving(true);

      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          draft_versions: draftVersions,
          final_statement: customStatement.trim() || null,
          statement_style: selectedStyle,
          primary_aspiration: primaryAspiration,
          magnitude_of_impact: magnitudeOfImpact
        })
      });

      if (!response.ok) throw new Error('Save failed');

      alert('Saved successfully!');
    } catch (error) {
      console.error('[Step3] Save error:', error);
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function goToNextStep() {
    if (!session) return;

    if (!primaryAspiration) {
      alert('Please choose your primary aspiration first.');
      return;
    }

    if (!customStatement.trim()) {
      alert('Please write your vision statement.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 4,
          draft_versions: draftVersions,
          final_statement: customStatement.trim(),
          statement_style: selectedStyle,
          primary_aspiration: primaryAspiration,
          magnitude_of_impact: magnitudeOfImpact
        })
      });

      if (!response.ok) throw new Error('Save failed');

      router.push('/discover/vision/step4');
    } catch (error) {
      console.error('[Step3] Next step error:', error);
      alert('Failed to proceed to next step.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!session || !context) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load session.</p>
          <button
            onClick={() => router.push('/discover/vision')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/discover/vision/step2')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous Step
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 3: Draft Vision Statement</h1>
          <p className="text-gray-600">Generate vision statements in three styles and refine them with AI.</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <StepProgress currentStep={3} />
        </div>

        {/* STEP 3A: Choose Only ONE Aspiration */}
        {!primaryAspiration && (
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-2xl p-8 shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  The Most Important Question
                </h2>
                <p className="text-lg text-gray-800 mb-4">
                  You've identified {session.core_aspirations?.length} core aspirations from your future vision.
                </p>
                <p className="text-xl font-semibold text-gray-900 mb-6">
                  <strong>If you had to choose ONLY ONE that represents the essence of your future, which would it be?</strong>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {session.core_aspirations?.map((aspiration, index) => (
                <label
                  key={index}
                  className={`flex items-start gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    primaryAspiration === aspiration.keyword
                      ? 'border-yellow-500 bg-yellow-100 shadow-md'
                      : 'border-gray-300 bg-white hover:border-yellow-300 hover:bg-yellow-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="primary"
                    checked={primaryAspiration === aspiration.keyword}
                    onChange={() => setPrimaryAspiration(aspiration.keyword)}
                    className="mt-1 w-5 h-5 text-yellow-600"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{aspiration.keyword}</h3>
                    <p className="text-gray-700">{aspiration.reason}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={() => setShowMagnitudeQuestions(true)}
              disabled={!primaryAspiration}
              className="mt-6 w-full px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with "{primaryAspiration || 'your choice'}"
            </button>
          </div>
        )}

        {/* STEP 3B: Magnitude Questions (shown after selecting ONE) */}
        {primaryAspiration && !showMagnitudeQuestions && (
          <div className="mb-8 bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">✨ You selected: {primaryAspiration}</h3>
            <button
              onClick={() => setShowMagnitudeQuestions(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue to Next Step
            </button>
          </div>
        )}

        {/* Main Content - Only show after primary aspiration is selected */}
        {primaryAspiration && showMagnitudeQuestions && (
          <>
            {/* Magnitude of Impact Questions */}
            <div className="mb-8 bg-white rounded-xl shadow-xl p-8 border-2 border-blue-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📊 Let's explore the scale of your vision
              </h2>
              <p className="text-gray-700 mb-6">
                Help us understand the magnitude and reach of your aspiration: <strong>{primaryAspiration}</strong>
              </p>

              <AIChatBox
                step={3}
                context={{
                  ...context,
                  futureImagery: session.future_imagery,
                  coreAspirations: session.core_aspirations,
                  primaryAspiration
                }}
                onResponseComplete={(response) => {
                  console.log('[Step3] Magnitude response:', response);
                  setMagnitudeOfImpact(prev => prev + '\n' + response);
                }}
                placeholder="Tell me about the scale and impact of your vision..."
                initialMessage={`You chose "${primaryAspiration}" as your core aspiration. Let's explore this deeper:

**Magnitude Questions:**
1. What SCALE of impact do you envision?
   - Community level?
   - National level?
   - International/Global level?

2. How many people do you hope to impact through your work?

3. What would be the most SYMBOLIC moment that represents achieving this vision?

4. What timeframe do you see for making this impact?

Share your thoughts freely!`}
              />

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary of Your Impact Vision
                </label>
                <textarea
                  value={magnitudeOfImpact}
                  onChange={(e) => setMagnitudeOfImpact(e.target.value)}
                  placeholder="Summarize the scale and reach of your intended impact..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Main Content - 3 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              {/* Left Column - Primary Aspiration Summary */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Core Focus</h2>
                  <div className="p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-400">
                    <h3 className="font-bold text-yellow-900 text-lg mb-2">{primaryAspiration}</h3>
                    <p className="text-sm text-yellow-800">
                      {session.core_aspirations?.find(a => a.keyword === primaryAspiration)?.reason}
                    </p>
                  </div>
                </div>

                <ValuesSummary values={context.values} mode="compact" />
              </div>

          {/* Middle Column - Draft Generation & Editing */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Generate Vision Statement</h2>
                <button
                  onClick={generateDrafts}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI Generate
                    </>
                  )}
                </button>
              </div>

              {/* Three Style Drafts */}
              <div className="space-y-4 mb-6">
                {(Object.keys(STYLE_INFO) as VisionStyle[]).map(style => (
                  <div
                    key={style}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedStyle === style
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => generatedDrafts[style] && selectDraft(style, generatedDrafts[style])}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{STYLE_INFO[style].label}</h3>
                        <p className="text-xs text-gray-500">{STYLE_INFO[style].description}</p>
                      </div>
                      {selectedStyle === style && (
                        <span className="text-purple-600 text-sm font-medium">✓ Selected</span>
                      )}
                    </div>
                    {generatedDrafts[style] ? (
                      <p className="text-sm text-gray-700 italic mt-2">"{generatedDrafts[style]}"</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">{STYLE_INFO[style].example}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Custom Editing Area */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edit and Write Vision Statement
                </label>
                <textarea
                  value={customStatement}
                  onChange={(e) => setCustomStatement(e.target.value)}
                  placeholder="Select an AI-generated statement or write your own..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Write a concise, clear, and inspiring sentence.
                </p>
              </div>

              <button
                onClick={saveDraftVersion}
                disabled={!customStatement.trim()}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Save Current Version
              </button>
            </div>

            {/* AI Chat for Refinement */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Refine with AI</h2>
              <p className="text-sm text-gray-600 mb-4">
                Chat with AI to refine your vision statement and find better expressions.
              </p>

              <AIChatBox
                step={3}
                context={{
                  ...context,
                  futureImagery: session.future_imagery,
                  coreAspirations: session.core_aspirations,
                  currentDraft: customStatement
                }}
                onResponseComplete={(response) => console.log('[Step3] AI refinement:', response)}
                placeholder="Ask for feedback on your vision statement..."
              />
            </div>
          </div>

          {/* Right Column - Draft History */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Drafts</h2>

              {draftVersions.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <p>No saved drafts yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {draftVersions.map((draft, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => setCustomStatement(draft.text)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-purple-600">
                          {STYLE_INFO[draft.style as VisionStyle]?.label || 'Custom'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(draft.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 italic">"{draft.text}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={saveProgress}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save
          </button>

          <button
            onClick={goToNextStep}
            disabled={saving || !customStatement.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Step
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
