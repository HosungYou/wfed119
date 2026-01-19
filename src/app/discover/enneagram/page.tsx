"use client";

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { RefreshCw } from 'lucide-react';
import EnneagramResultDisplay from '@/components/enneagram/EnneagramResultDisplay';

type Stage = 'screener' | 'discriminators' | 'wings' | 'narrative' | 'complete';
type Locale = 'en' | 'kr';

// Types for AI interpretation
interface EnneagramResult {
  primaryType: string;
  typeProbabilities: Record<string, number>;
  confidence: string;
  wingEstimate: string | null;
  instinct: string | null;
}

interface InterpretationData {
  typeOverview: string;
  wingInfluence: string;
  instinctFocus: string;
  strengthsSynergy?: string;
  growthPath: string;
  careerInsights: string;
  integratedInsight?: string;
}

interface TypeProfile {
  name: { en: string; ko: string };
  nickname: { en: string; ko: string };
  coreFear: { en: string; ko: string };
  coreDesire: { en: string; ko: string };
  healthyTraits: { en: string[]; ko: string[] };
  growthDirection: number;
}

interface InterpretResponse {
  interpretation: InterpretationData;
  typeProfile: TypeProfile;
  source: 'ai' | 'fallback';
}

interface ScreenerItem { id: string; type: number; text: string }
interface DiscItem { id: string; pair: string; leftType: number; rightType: number; prompt: string; optionA: string; optionB: string }
interface InstinctItem { id: string; instinct: 'sp' | 'so' | 'sx'; text: string }

const isStage = (value: unknown): value is Stage =>
  value === 'screener' || value === 'discriminators' || value === 'wings' || value === 'narrative' || value === 'complete';

const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

function EnneagramWizardContent() {
  const router = useRouter();
  const search = useSearchParams();
  const initialSession = search.get('sessionId') || '';

  const [sessionId, setSessionId] = useState(initialSession);
  const [locale, setLocale] = useState<Locale>('en');
  const [stage, setStage] = useState<Stage>('screener');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Items per stage
  const [screenerItems, setScreenerItems] = useState<ScreenerItem[]>([]);
  const [discItems, setDiscItems] = useState<DiscItem[]>([]);
  const [instinctItems, setInstinctItems] = useState<InstinctItem[]>([]);
  const [narrativePrompts, setNarrativePrompts] = useState<string[]>([]);

  // Responses
  const [screenerResponses, setScreenerResponses] = useState<Record<string, number>>({});
  const [discResponses, setDiscResponses] = useState<Record<string, 'A' | 'B'>>({});
  const [instinctResponses, setInstinctResponses] = useState<Record<string, number>>({});
  const [narrativeTexts, setNarrativeTexts] = useState<string[]>(['', '']);

  // Results & AI Interpretation
  const [enneagramResult, setEnneagramResult] = useState<EnneagramResult | null>(null);
  const [interpretation, setInterpretation] = useState<InterpretResponse | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sessionRestored, setSessionRestored] = useState(false);

  // Restore existing session on mount (for authenticated users)
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch('/api/enneagram/session');
        if (!res.ok) return;

        const { session } = await res.json();
        if (session && session.sessionId) {
          // Restore session ID
          setSessionId(session.sessionId);
          setLocale(session.locale || 'en');

          // Restore stage
          if (session.isComplete && session.primaryType) {
            setStage('complete');
            // Pre-populate result data if available
            setEnneagramResult({
              primaryType: session.primaryType,
              typeProbabilities: session.scores?.probabilities || {},
              confidence: session.confidence || 'medium',
              wingEstimate: session.wingEstimate,
              instinct: session.instinct,
            });
          } else if (session.stage && isStage(session.stage)) {
            setStage(session.stage);
            // Restore responses from session
            const responses = session.responses || {};
            if (responses.screener && Array.isArray(responses.screener)) {
              const restored: Record<string, number> = {};
              responses.screener.forEach((r: { itemId: string; value: number }) => {
                if (r.itemId && typeof r.value === 'number') {
                  restored[r.itemId] = r.value;
                }
              });
              setScreenerResponses(restored);
            }
            if (responses.discriminators && Array.isArray(responses.discriminators)) {
              const restored: Record<string, 'A' | 'B'> = {};
              responses.discriminators.forEach((r: { itemId: string; choice: 'A' | 'B' }) => {
                if (r.itemId && (r.choice === 'A' || r.choice === 'B')) {
                  restored[r.itemId] = r.choice;
                }
              });
              setDiscResponses(restored);
            }
            if (responses.wings && Array.isArray(responses.wings)) {
              const restored: Record<string, number> = {};
              responses.wings.forEach((r: { itemId: string; value: number }) => {
                if (r.itemId && typeof r.value === 'number') {
                  restored[r.itemId] = r.value;
                }
              });
              setInstinctResponses(restored);
            }
            if (responses.narrative && Array.isArray(responses.narrative)) {
              setNarrativeTexts(responses.narrative);
            }
          }

          // Update URL with restored session ID
          const params = new URLSearchParams(Array.from(search.entries()));
          params.set('sessionId', session.sessionId);
          router.replace(`?${params.toString()}`);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setSessionRestored(true);
      }
    }

    // Only try to restore if no session ID in URL
    if (!initialSession) {
      restoreSession();
    } else {
      setSessionRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ensure session id exists (after restoration attempt)
  useEffect(() => {
    if (!sessionRestored) return;

    if (!sessionId) {
      const sid = uuidv4();
      setSessionId(sid);
      const params = new URLSearchParams(Array.from(search.entries()));
      params.set('sessionId', sid);
      router.replace(`?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionRestored]);

  const canFetch = useMemo(() => !!sessionId && sessionRestored, [sessionId, sessionRestored]);

  async function loadItems(targetStage: Stage) {
    if (!canFetch) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/enneagram/items?sessionId=${encodeURIComponent(sessionId)}&stage=${targetStage}&locale=${locale}`);
      if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
      const data = await res.json();
      if (targetStage === 'screener') setScreenerItems(data.items || []);
      if (targetStage === 'discriminators') setDiscItems(data.items || []);
      if (targetStage === 'wings') setInstinctItems(data.items || []);
      if (targetStage === 'narrative') setNarrativePrompts(data.prompts || []);
    } catch (error) {
      setError(toErrorMessage(error, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Skip loading items for 'complete' stage - no items needed
    if (canFetch && stage !== 'complete') loadItems(stage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, locale, stage, refreshKey]);

  // Auto-fetch results and AI interpretation when entering complete stage
  useEffect(() => {
    if (stage === 'complete' && canFetch && !resultLoading) {
      // If we have result but no interpretation (session restored), fetch interpretation only
      if (enneagramResult && !interpretation) {
        fetchInterpretationOnly();
      } else if (!enneagramResult) {
        // Fresh complete - fetch both results and interpretation
        fetchResultsAndInterpretation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, canFetch, enneagramResult, interpretation]);

  async function fetchResultsAndInterpretation() {
    setResultLoading(true);
    setResultError(null);

    try {
      // Step 1: Score the session
      const scoreRes = await fetch('/api/enneagram/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!scoreRes.ok) {
        throw new Error(`Failed to calculate score (${scoreRes.status})`);
      }

      const scoreData: EnneagramResult = await scoreRes.json();
      setEnneagramResult(scoreData);

      // Step 2: Fetch AI interpretation
      const type = parseInt(scoreData.primaryType, 10);
      const wing = scoreData.wingEstimate ? parseInt(scoreData.wingEstimate.split('w')[1], 10) : type;
      const instinct = (scoreData.instinct as 'sp' | 'so' | 'sx') || 'sp';

      const interpretRes = await fetch('/api/enneagram/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enneagram: {
            type,
            wing,
            instinct,
            confidence: scoreData.confidence,
            probabilities: scoreData.typeProbabilities,
          },
          locale: locale === 'kr' ? 'ko' : 'en',
        }),
      });

      if (interpretRes.ok) {
        const interpretData: InterpretResponse = await interpretRes.json();
        setInterpretation(interpretData);
      }
    } catch (err) {
      setResultError(toErrorMessage(err, 'Failed to load results'));
    } finally {
      setResultLoading(false);
    }
  }

  // Fetch interpretation only (for session restoration case)
  async function fetchInterpretationOnly() {
    if (!enneagramResult) return;

    setResultLoading(true);
    setResultError(null);

    try {
      const type = parseInt(enneagramResult.primaryType, 10);
      const wing = enneagramResult.wingEstimate ? parseInt(enneagramResult.wingEstimate.split('w')[1], 10) : type;
      const instinct = (enneagramResult.instinct as 'sp' | 'so' | 'sx') || 'sp';

      const interpretRes = await fetch('/api/enneagram/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enneagram: {
            type,
            wing,
            instinct,
            confidence: enneagramResult.confidence,
            probabilities: enneagramResult.typeProbabilities,
          },
          locale: locale === 'kr' ? 'ko' : 'en',
        }),
      });

      if (interpretRes.ok) {
        const interpretData: InterpretResponse = await interpretRes.json();
        setInterpretation(interpretData);
      }
    } catch (err) {
      setResultError(toErrorMessage(err, 'Failed to load interpretation'));
    } finally {
      setResultLoading(false);
    }
  }

  async function submitStage() {
    if (!canFetch) return;
    setLoading(true);
    setError(null);
    try {
      const payload: { sessionId: string; stage: Stage; locale: Locale; input?: unknown } = { sessionId, stage, locale };
      if (stage === 'screener') {
        payload.input = { items: Object.entries(screenerResponses).map(([itemId, value]) => ({ itemId, value })) };
      } else if (stage === 'discriminators') {
        payload.input = { answers: Object.entries(discResponses).map(([itemId, choice]) => ({ itemId, choice })) };
      } else if (stage === 'wings') {
        payload.input = { items: Object.entries(instinctResponses).map(([itemId, value]) => ({ itemId, value })) };
      } else if (stage === 'narrative') {
        payload.input = { texts: narrativeTexts };
      }

      const res = await fetch('/api/enneagram/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { nextStage?: unknown; error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Failed to submit (${res.status})`);
      }
      if (isStage(data.nextStage)) {
        setStage(data.nextStage);
      }
    } catch (error) {
      setError(toErrorMessage(error, 'Failed to submit'));
    } finally {
      setLoading(false);
    }
  }

  function StageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Top Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-xl">
            <span className="text-sm text-gray-500 font-medium">Session</span>
            <code className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-mono">{sessionId || '—'}</code>
          </div>
          <div className="ml-auto flex items-center gap-2 glass-panel px-4 py-2 rounded-xl">
            <span className="text-sm text-gray-500 font-medium">Language</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="bg-transparent border-none text-gray-700 font-medium focus:ring-0 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="kr">한국어</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
        )}

        {/* Stages */}
        {stage === 'screener' && (
          <div className="glass-panel p-8 rounded-3xl">
            <StageHeader
              title={locale === 'kr' ? '스테이지 1 — 스크리너 (45문항)' : 'Stage 1 — Screener (45 items)'}
              subtitle={locale === 'kr' ? '각 문항에 대해 1(전혀 아니다) ~ 5(매우 그렇다)' : 'Rate each 1 (Strongly Disagree) to 5 (Strongly Agree)'}
            />
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setRefreshKey(k => k + 1);
                  setScreenerResponses({});
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {locale === 'kr' ? '순서 섞기' : 'Shuffle Items'}
              </button>
            </div>
            <div className="space-y-4">
              {screenerItems.map((it) => (
                <div key={it.id} className="border border-white/40 bg-white/30 rounded-xl p-4">
                  <div className="mb-3 font-medium text-gray-800">{it.text}</div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <label key={v} className={`flex-1 py-2 rounded-lg cursor-pointer border text-center transition-all ${screenerResponses[it.id] === v ? 'bg-primary-500 text-white border-primary-500 shadow-md' : 'bg-white/50 border-white/40 hover:bg-white/80'}`}>
                        <input
                          type="radio"
                          name={it.id}
                          className="hidden"
                          checked={screenerResponses[it.id] === v}
                          onChange={() => setScreenerResponses((s) => ({ ...s, [it.id]: v }))}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={submitStage}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {locale === 'kr' ? '다음' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {stage === 'discriminators' && (
          <div className="glass-panel p-8 rounded-3xl">
            <StageHeader title={locale === 'kr' ? '스테이지 2 — 구분 문항' : 'Stage 2 — Discriminators'} />
            <div className="space-y-4">
              {discItems.map((it) => (
                <div key={it.id} className="border border-white/40 bg-white/30 rounded-xl p-6">
                  <div className="mb-4 font-medium text-lg text-gray-800">{it.prompt}</div>
                  <div className="flex flex-col gap-3">
                    <label className={`p-4 rounded-xl border cursor-pointer transition-all ${discResponses[it.id] === 'A' ? 'bg-primary-50 border-primary-400 shadow-md' : 'bg-white/50 border-white/40 hover:bg-white/80'}`}>
                      <input
                        type="radio"
                        name={it.id}
                        className="hidden"
                        checked={discResponses[it.id] === 'A'}
                        onChange={() => setDiscResponses((s) => ({ ...s, [it.id]: 'A' }))}
                      />
                      <span className="font-bold text-primary-700 mr-2">A)</span> {it.optionA}
                    </label>
                    <label className={`p-4 rounded-xl border cursor-pointer transition-all ${discResponses[it.id] === 'B' ? 'bg-primary-50 border-primary-400 shadow-md' : 'bg-white/50 border-white/40 hover:bg-white/80'}`}>
                      <input
                        type="radio"
                        name={it.id}
                        className="hidden"
                        checked={discResponses[it.id] === 'B'}
                        onChange={() => setDiscResponses((s) => ({ ...s, [it.id]: 'B' }))}
                      />
                      <span className="font-bold text-primary-700 mr-2">B)</span> {it.optionB}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={submitStage}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {locale === 'kr' ? '다음' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {stage === 'wings' && (
          <div className="glass-panel p-8 rounded-3xl">
            <StageHeader title={locale === 'kr' ? '스테이지 3 — 본능 경향' : 'Stage 3 — Instincts'} subtitle={locale === 'kr' ? '각 문항 1~5점' : 'Rate each 1–5'} />
            <div className="space-y-4">
              {instinctItems.map((it) => (
                <div key={it.id} className="border border-white/40 bg-white/30 rounded-xl p-4">
                  <div className="mb-3 font-medium text-gray-800">{it.text}</div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <label key={v} className={`flex-1 py-2 rounded-lg cursor-pointer border text-center transition-all ${instinctResponses[it.id] === v ? 'bg-secondary-500 text-white border-secondary-500 shadow-md' : 'bg-white/50 border-white/40 hover:bg-white/80'}`}>
                        <input
                          type="radio"
                          name={it.id}
                          className="hidden"
                          checked={instinctResponses[it.id] === v}
                          onChange={() => setInstinctResponses((s) => ({ ...s, [it.id]: v }))}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={submitStage}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {locale === 'kr' ? '다음' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {stage === 'narrative' && (
          <div className="glass-panel p-8 rounded-3xl">
            <StageHeader title={locale === 'kr' ? '스테이지 4 — 내러티브 검증' : 'Stage 4 — Narrative Validation'} />
            <div className="space-y-4">
              {(narrativePrompts.length ? narrativePrompts : [
                'Describe a recent situation that felt “very you.” What were you seeking, avoiding, or protecting?',
                'In stress or ease, how do your priorities and behavior shift? Give a brief example.'
              ]).map((p, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="text-sm text-gray-600">{p}</div>
                  <textarea
                    value={narrativeTexts[idx] || ''}
                    onChange={(e) => setNarrativeTexts((arr) => { const n = [...arr]; n[idx] = e.target.value; return n; })}
                    rows={4}
                    className="w-full border border-white/40 bg-white/50 backdrop-blur-sm rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder={locale === 'kr' ? '여기에 작성하세요…' : 'Type here…'}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={submitStage}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50"
              >
                {locale === 'kr' ? '완료' : 'Complete'}
              </button>
            </div>
          </div>
        )}

        {stage === 'complete' && (
          <div className="space-y-6">
            {/* Error State */}
            {resultError && !resultLoading && (
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
                <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl p-4 mb-4">
                  {resultError}
                </div>
                <button
                  onClick={fetchResultsAndInterpretation}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  {locale === 'kr' ? '다시 시도' : 'Try Again'}
                </button>
              </div>
            )}

            {/* New Visual Results Display */}
            {enneagramResult && (
              <EnneagramResultDisplay
                result={enneagramResult}
                interpretation={interpretation}
                locale={locale}
                onNavigateToDashboard={() => router.push('/dashboard')}
                loading={resultLoading}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EnneagramWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <EnneagramWizardContent />
    </Suspense>
  );
}
