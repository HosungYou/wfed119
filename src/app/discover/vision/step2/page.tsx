'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, Check, Sparkles, FileText } from 'lucide-react';
import StepProgress from '../components/StepProgress';
import AIChatBox from '../components/AIChatBox';

interface VisionSession {
  id: string;
  user_id: string;
  future_imagery: string | null;
  brainstormed_options: BrainstormedOption[] | null;
  selected_option_index: number | null;
  final_statement: string | null;
  current_step: number;
}

interface BrainstormedOption {
  statement: string;
  wordCount: number;
  explanation: string;
}

interface Context {
  values: any;
  strengths: any;
  futureImagery: string;
}

export default function VisionStep2() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<VisionSession | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [brainstormedOptions, setBrainstormedOptions] = useState<BrainstormedOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [customVision, setCustomVision] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

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

      // Verify Step 1 is complete
      if (!sessionData.future_imagery) {
        alert('Please complete Step 1 first.');
        router.push('/discover/vision/step1');
        return;
      }

      setSession(sessionData);
      setBrainstormedOptions(sessionData.brainstormed_options || []);
      setSelectedIndex(sessionData.selected_option_index);

      // Load context
      const contextRes = await fetch('/api/discover/vision/context');
      if (!contextRes.ok) throw new Error('Failed to load context');
      const contextData = await contextRes.json();
      setContext({
        ...contextData,
        futureImagery: sessionData.future_imagery
      });

    } catch (error) {
      console.error('[Step2] Load error:', error);
      alert('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const customWordCount = countWords(customVision);
  const isCustomValid = customWordCount > 0 && customWordCount <= 6;

  const handleOptionSelect = (index: number) => {
    setSelectedIndex(index);
    setShowCustomInput(false);
    setCustomVision('');
  };

  const handleCustomSelect = () => {
    setShowCustomInput(true);
    setSelectedIndex(null);
  };

  async function goToNextStep() {
    if (selectedIndex === null && !customVision.trim()) {
      alert('Please select an option or create your own vision statement.');
      return;
    }

    if (showCustomInput && !isCustomValid) {
      alert('Your custom vision must be 6 words or less.');
      return;
    }

    setSaving(true);

    try {
      const finalStatement = showCustomInput
        ? customVision.trim()
        : brainstormedOptions[selectedIndex!].statement;

      await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          brainstormed_options: brainstormedOptions,
          selected_option_index: showCustomInput ? null : selectedIndex,
          final_statement: finalStatement
        })
      });

      router.push('/discover/vision/step3');
    } catch (error) {
      console.error('[Step2] Next step error:', error);
      alert('Failed to proceed to next step.');
      setSaving(false);
    }
  }

  const handleAIResponse = (response: string) => {
    // AI가 options을 생성했는지 확인
    // Format: **Option 1:** "..." 패턴 감지
    const optionRegex = /\*\*Option \d+:\*\*\s*"([^"]+)"/g;
    const matches = [...response.matchAll(optionRegex)];

    if (matches.length >= 3) {
      // AI가 options 제안함
      const newOptions: BrainstormedOption[] = matches.map((match, index) => {
        const statement = match[1];
        // Explanation 추출 (다음 줄의 *Why it works:* 부분)
        const explanationMatch = response.match(
          new RegExp(`\\*\\*Option ${index + 1}:\\*\\*[^*]+\\*Why it works:\\*\\s*([^\\n*]+)`)
        );

        return {
          statement: statement,
          wordCount: countWords(statement),
          explanation: explanationMatch?.[1]?.trim() || 'AI-generated vision option'
        };
      });

      setBrainstormedOptions(newOptions);
    }
  };

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
            onClick={() => router.push('/discover/vision/step1')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous Step
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 2: Brainstorm Your Vision</h1>
          <p className="text-gray-600">Transform your future story into a powerful 6-word vision statement.</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <StepProgress currentStep={2} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Step 1 Output + AI Chat */}
          <div className="space-y-6">
            {/* Step 1 Future Vision - READ ONLY DISPLAY */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Your Future Vision Story</h2>
                <span className="ml-auto text-xs text-gray-500">From Step 1</span>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {context.futureImagery}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Task:</strong> We'll distill this story into a powerful 6-word vision statement.
                  Chat with the AI below to identify key elements: impact magnitude, scope, and core action.
                </p>
              </div>
            </div>

            {/* AI Chat for Clarifying Questions */}
            <AIChatBox
              step={2}
              context={context}
              onResponseComplete={handleAIResponse}
              placeholder="Ask AI to generate 6-word vision options..."
              initialMessage={`I've read your future vision story! Let me help you create a powerful 6-word vision statement.

Looking at your vision, I can see some great elements. Now let me ask a few clarifying questions:

1. **Impact Magnitude**: I see you mentioned impact on people/communities. Can you be more specific about the scale? For example:
   - How many people? (e.g., "10,000", "1 million", "10 million")
   - Or use descriptors like "thousands", "millions", "global communities"

2. **Scope**: Is this impact:
   - Global (worldwide)
   - National (specific country)
   - Local/Regional (specific area)
   - Or focused on specific groups (e.g., "underserved communities", "youth", "educators")

3. **Core Action**: What's the primary verb that describes what you do?
   - Transform, Empower, Create, Inspire, Connect, Build, Enable, Lead?

Please share your thoughts on these, and I'll generate 3-5 powerful 6-word vision options for you!`}
            />
          </div>

          {/* Right Column - Vision Options */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Vision Statement</h2>
              <p className="text-sm text-gray-600 mb-6">
                Select one of the AI-generated options below, or create your own 6-word vision.
              </p>

              {/* AI-Generated Options */}
              {brainstormedOptions.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {brainstormedOptions.map((option, index) => (
                    <VisionOptionCard
                      key={index}
                      option={option}
                      index={index}
                      selected={selectedIndex === index}
                      onSelect={() => handleOptionSelect(index)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center mb-6">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Chat with the AI coach to generate 6-word vision options.
                  </p>
                </div>
              )}

              {/* Custom Input Option */}
              <div className="border-2 border-gray-300 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="radio"
                    checked={showCustomInput}
                    onChange={handleCustomSelect}
                    className="w-4 h-4 text-purple-600"
                  />
                  <label className="font-semibold text-gray-900 cursor-pointer" onClick={handleCustomSelect}>
                    ✏️ Create Your Own (6 words or less)
                  </label>
                </div>

                {showCustomInput && (
                  <div className="space-y-3">
                    <textarea
                      value={customVision}
                      onChange={(e) => setCustomVision(e.target.value)}
                      placeholder="Enter your 6-word vision..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isCustomValid ? 'text-gray-600' : 'text-red-600'}`}>
                        {customWordCount} / 6 words
                      </span>
                      {customWordCount > 6 && (
                        <span className="text-red-600 text-sm font-medium">
                          ⚠ Please reduce to 6 words or less
                        </span>
                      )}
                      {isCustomValid && (
                        <span className="text-green-600 text-sm font-medium">
                          ✓ Within word limit
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Guide Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Great 6-Word Visions</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Include impact magnitude (e.g., "10 million", "global")</li>
                <li>• Use strong action verbs (transform, empower, create)</li>
                <li>• Be specific about who benefits</li>
                <li>• Keep it inspiring and clear</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/discover/vision/step1')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Step 1
          </button>
          <button
            onClick={goToNextStep}
            disabled={saving || (selectedIndex === null && !customVision.trim())}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Next Step
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Vision Option Card Component
function VisionOptionCard({
  option,
  index,
  selected,
  onSelect
}: {
  option: BrainstormedOption;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
        selected
          ? 'border-purple-500 bg-purple-50 shadow-md'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          checked={selected}
          onChange={onSelect}
          className="mt-1 w-4 h-4 text-purple-600"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
              Option {index + 1}
            </span>
            <span className="text-xs text-gray-500">
              {option.wordCount} {option.wordCount === 1 ? 'word' : 'words'} ✓
            </span>
          </div>
          <p className="font-semibold text-lg text-gray-900 mb-2">
            "{option.statement}"
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Why it works:</span> {option.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
