'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Loader2, Check, Sparkles, RefreshCw } from 'lucide-react';
import StepProgress from '../components/StepProgress';
import AIChatBox from '../components/AIChatBox';

interface VisionSession {
  id: string;
  user_id: string;
  future_imagery: string | null;
  core_aspirations: { keyword: string; reason: string }[] | null;
  final_statement: string | null;
  statement_style: string | null;
  selected_template_id: string | null;
  is_completed: boolean;
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

interface VisionCardTemplate {
  id: string;
  name: string;
  design_config: {
    background: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

export default function VisionStep3() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<VisionSession | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [templates, setTemplates] = useState<VisionCardTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [finalStatement, setFinalStatement] = useState('');
  const [firstAction, setFirstAction] = useState('');
  const [validationPassed, setValidationPassed] = useState(false);
  const [validating, setValidating] = useState(false);
  const [aiValidationResult, setAiValidationResult] = useState<{
    passed: boolean;
    feedback: string;
    suggestions?: string[];
  } | null>(null);

  // Word count utility
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const wordCount = countWords(finalStatement);
  const isWithinWordLimit = wordCount > 0 && wordCount <= 6;

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

      // Verify Step 3 is complete
      if (!sessionData.final_statement) {
        alert('Please complete Step 3 first.');
        router.push('/discover/vision/step3');
        return;
      }

      setSession(sessionData);
      setFinalStatement(sessionData.final_statement);
      setSelectedTemplateId(sessionData.selected_template_id);

      // Load context
      const contextRes = await fetch('/api/discover/vision/context');
      if (!contextRes.ok) throw new Error('Failed to load context');
      const contextData = await contextRes.json();
      setContext(contextData);

      // Load templates
      const templatesRes = await fetch('/api/discover/vision/templates');
      if (!templatesRes.ok) throw new Error('Failed to load templates');
      const templatesData = await templatesRes.json();
      setTemplates(templatesData);

      // Select first template if none selected
      if (!sessionData.selected_template_id && templatesData.length > 0) {
        setSelectedTemplateId(templatesData[0].id);
      }

    } catch (error) {
      console.error('[Step4] Load error:', error);
      alert('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  async function validateStatement() {
    if (!finalStatement.trim()) {
      alert('Please enter your vision statement.');
      return;
    }

    try {
      setValidating(true);
      setAiValidationResult(null);

      const response = await fetch('/api/discover/vision/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: finalStatement,
          context: {
            values: context?.values,
            strengths: context?.strengths,
            futureImagery: session?.future_imagery,
            coreAspirations: session?.core_aspirations
          }
        })
      });

      if (!response.ok) throw new Error('Validation failed');

      const result = await response.json();
      setAiValidationResult(result);

      // Show validation result in alert
      if (result.passed) {
        alert(`✓ AI Validation Passed!\n\n${result.feedback}\n\nDo you agree with this assessment? If yes, your statement is validated.`);
      } else {
        alert(`Please refine your vision statement.\n\n${result.feedback}\n\n${result.suggestions ? 'Suggestions:\n' + result.suggestions.join('\n') : ''}`);
      }
    } catch (error) {
      console.error('[Step4] Validation error:', error);
      alert('Failed to validate statement. Please try again.');
    } finally {
      setValidating(false);
    }
  }

  function userConfirmValidation() {
    if (aiValidationResult?.passed) {
      setValidationPassed(true);
      alert('✓ Vision statement validated successfully!');
    } else {
      alert('Please validate with AI first.');
    }
  }

  async function exportCard() {
    if (!cardRef.current) return;

    try {
      setExporting(true);

      // Dynamic import to reduce bundle size
      const htmlToImage = await import('html-to-image');

      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2
      });

      // Download
      const link = document.createElement('a');
      link.download = `vision-card-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();

      alert('Vision card downloaded successfully!');
    } catch (error) {
      console.error('[Step4] Export error:', error);
      alert('Failed to export vision card.');
    } finally {
      setExporting(false);
    }
  }

  async function completeModule() {
    if (!session) return;

    // Validate word count
    if (wordCount > 6) {
      alert('Please reduce your vision statement to 6 words or less.');
      return;
    }

    if (!finalStatement.trim()) {
      alert('Please enter your vision statement.');
      return;
    }

    if (!selectedTemplateId) {
      alert('Please select a vision card template.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/discover/vision/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          final_statement: finalStatement.trim(),
          selected_template_id: selectedTemplateId,
          is_completed: true
        })
      });

      if (!response.ok) throw new Error('Save failed');

      alert('🎉 Vision Statement module completed!');

      // Redirect to SWOT analysis (or dashboard)
      router.push('/dashboard'); // TODO: Change to SWOT module when ready
    } catch (error) {
      console.error('[Step4] Complete error:', error);
      alert('Failed to complete module.');
    } finally {
      setSaving(false);
    }
  }

  async function startNewSession() {
    if (!confirm('Are you sure you want to start a new vision statement? Your current work will be saved as a completed session.')) {
      return;
    }

    try {
      setSaving(true);

      // First, complete current session if not already completed
      if (!session?.is_completed) {
        await fetch('/api/discover/vision/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_step: 3,
            final_statement: finalStatement.trim(),
            selected_template_id: selectedTemplateId,
            is_completed: true
          })
        });
      }

      // Create new session by resetting to step 1
      const response = await fetch('/api/discover/vision/session', {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to reset session');

      alert('✓ New session started! Redirecting to Step 1...');
      router.push('/discover/vision/step1');
    } catch (error) {
      console.error('[Step4] New session error:', error);
      alert('Failed to start new session.');
    } finally {
      setSaving(false);
    }
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

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
            onClick={() => router.push('/discover/vision/step3')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous Step
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 3: Compose & Visualize</h1>
          <p className="text-gray-600">Finalize your 6-word vision statement and create your vision card.</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <StepProgress currentStep={3} />
        </div>

        {/* Main Content - 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Validation & First Action */}
          <div className="space-y-6">
            {/* Final Statement */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Final Vision Statement</h2>

              {/* From Step 2 Info */}
              {finalStatement && (
                <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                      From Step 2
                    </span>
                    <span className="text-xs text-gray-500">
                      You can refine it below ↓
                    </span>
                  </div>
                  <p className="text-sm text-green-900">
                    <strong>Your selected vision:</strong> "{finalStatement}"
                  </p>
                </div>
              )}

              <textarea
                value={finalStatement}
                onChange={(e) => {
                  setFinalStatement(e.target.value);
                  setValidationPassed(false); // Reset validation
                  setAiValidationResult(null); // Reset AI result
                }}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Enter your final vision statement..."
              />

              {/* Word Counter */}
              <div className="flex items-center justify-between mt-2 mb-4">
                <span className={`text-sm font-medium ${isWithinWordLimit ? 'text-gray-600' : 'text-red-600'}`}>
                  {wordCount} / 6 words
                </span>
                {wordCount > 6 && (
                  <span className="text-red-600 text-sm font-medium">
                    ⚠ Please reduce to 6 words or less
                  </span>
                )}
                {wordCount > 0 && isWithinWordLimit && (
                  <span className="text-green-600 text-sm font-medium">
                    ✓ Within word limit
                  </span>
                )}
              </div>

              {/* AI Validation Result */}
              {aiValidationResult && (
                <div className={`mb-4 p-4 rounded-lg ${aiValidationResult.passed ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <h4 className={`font-semibold text-sm mb-2 ${aiValidationResult.passed ? 'text-green-900' : 'text-yellow-900'}`}>
                    {aiValidationResult.passed ? '✓ AI Validation Passed' : '⚠ AI Suggestions'}
                  </h4>
                  <p className={`text-sm mb-2 ${aiValidationResult.passed ? 'text-green-700' : 'text-yellow-700'}`}>
                    {aiValidationResult.feedback}
                  </p>
                  {aiValidationResult.suggestions && aiValidationResult.suggestions.length > 0 && (
                    <ul className="text-sm text-yellow-700 space-y-1 mt-2">
                      {aiValidationResult.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={validateStatement}
                  disabled={!finalStatement.trim() || validating}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {validating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reviewing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI Review (Optional)
                    </>
                  )}
                </button>

                {aiValidationResult?.passed && !validationPassed && (
                  <button
                    onClick={userConfirmValidation}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    Confirm & Accept
                  </button>
                )}

                {validationPassed && (
                  <span className="text-green-600 font-medium text-sm flex items-center gap-1">
                    <Check className="w-5 h-5" />
                    Validated
                  </span>
                )}
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900 text-sm mb-2">Validation Criteria</h3>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>✓ Concise: 6 words or less</li>
                  <li>✓ Clear: Meaning is clear and easy to understand</li>
                  <li>✓ Inspiring: Has the power to move me into action</li>
                  <li>✓ Unique: My own distinctive expression</li>
                </ul>
              </div>
            </div>

            {/* First Action Item */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">First Action Item</h2>
              <p className="text-sm text-gray-600 mb-4">
                What small action can you start today to realize your vision?
              </p>

              <textarea
                value={firstAction}
                onChange={(e) => setFirstAction(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="e.g., Study related field for 30 minutes daily"
              />
            </div>

            {/* AI Timeline Connection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Past-Present-Future Connection</h2>
              <p className="text-sm text-gray-600 mb-4">
                Explore how your vision connects to your past, present, and future through AI conversation.
              </p>

              <AIChatBox
                step={4}
                context={{
                  ...context,
                  futureImagery: session.future_imagery,
                  coreAspirations: session.core_aspirations,
                  finalStatement: finalStatement
                }}
                onResponseComplete={(response) => console.log('[Step4] Timeline reflection:', response)}
                placeholder="Connect your vision to your story..."
                initialMessage="Please explain how my vision statement connects to my past experiences, present strengths, and future aspirations."
              />
            </div>
          </div>

          {/* Right Column - Vision Card */}
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Vision Card Template</h2>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedTemplateId === template.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      background: template.design_config.background
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: template.design_config.textColor }}>
                      {template.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vision Card Preview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Vision Card Preview</h2>
                <button
                  onClick={exportCard}
                  disabled={exporting || !selectedTemplateId}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PNG
                    </>
                  )}
                </button>
              </div>

              {/* Card */}
              <div
                ref={cardRef}
                className="w-full aspect-[4/3] rounded-xl shadow-2xl flex flex-col items-center justify-center p-8 text-center"
                style={{
                  background: selectedTemplate?.design_config.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontFamily: selectedTemplate?.design_config.fontFamily || 'inherit'
                }}
              >
                <div className="mb-6">
                  <Sparkles
                    className="w-12 h-12 mx-auto mb-4"
                    style={{ color: selectedTemplate?.design_config.accentColor || '#fbbf24' }}
                  />
                  <h3
                    className="text-sm font-medium tracking-wider uppercase mb-2"
                    style={{ color: selectedTemplate?.design_config.textColor || '#ffffff' }}
                  >
                    My Vision
                  </h3>
                </div>

                <p
                  className="text-2xl font-bold leading-relaxed max-w-lg"
                  style={{ color: selectedTemplate?.design_config.textColor || '#ffffff' }}
                >
                  {finalStatement || 'Your vision statement will appear here'}
                </p>

                <div className="mt-8">
                  <div
                    className="h-1 w-16 mx-auto rounded-full mb-4"
                    style={{ background: selectedTemplate?.design_config.accentColor || '#fbbf24' }}
                  />
                  <p
                    className="text-sm opacity-90"
                    style={{ color: selectedTemplate?.design_config.textColor || '#ffffff' }}
                  >
                    {new Date().getFullYear()}
                  </p>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={completeModule}
            disabled={saving || !finalStatement.trim() || wordCount > 6 || !selectedTemplateId}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-6 h-6" />
                Complete Vision Statement
              </>
            )}
          </button>

          <button
            onClick={startNewSession}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-4 bg-white text-purple-600 text-lg font-semibold rounded-xl hover:bg-purple-50 border-2 border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
}
