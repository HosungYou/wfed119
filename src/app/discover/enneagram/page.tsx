"use client";

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

type Stage = 'screener' | 'discriminators' | 'wings' | 'narrative' | 'complete';
type Locale = 'en' | 'kr';

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

  // ensure session id exists
  useEffect(() => {
    if (!sessionId) {
      const sid = uuidv4();
      setSessionId(sid);
      const params = new URLSearchParams(Array.from(search.entries()));
      params.set('sessionId', sid);
      router.replace(`?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canFetch = useMemo(() => !!sessionId, [sessionId]);

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
    if (canFetch) loadItems(stage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, locale, stage]);

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
      if (!res.ok) throw new Error(`Failed to submit (${res.status})`);
      const data = (await res.json()) as { nextStage?: unknown };
      if (isStage(data.nextStage)) {
        setStage(data.nextStage);
      }
    } catch (error) {
      setError(toErrorMessage(error, 'Failed to submit'));
    } finally {
      setLoading(false);
    }
  }

  async function scoreAndGoResults() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/enneagram/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
      if (!res.ok) throw new Error(`Failed to score (${res.status})`);
      // optional: show a toast/summary
      router.push(`/results?sessionId=${encodeURIComponent(sessionId)}`);
    } catch (error) {
      setError(toErrorMessage(error, 'Failed to score'));
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
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Top Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-2 rounded shadow">
            <span className="text-sm text-gray-500">Session</span>
            <code className="px-2 py-1 bg-gray-100 rounded text-xs">{sessionId || '—'}</code>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-white p-2 rounded shadow">
            <span className="text-sm text-gray-500">Language</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="border rounded px-2 py-1"
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
          <div className="bg-white p-6 rounded-lg shadow">
            <StageHeader
              title={locale === 'kr' ? '스테이지 1 — 스크리너 (36문항)' : 'Stage 1 — Screener (36 items)'}
              subtitle={locale === 'kr' ? '각 문항에 대해 1(전혀 아니다) ~ 5(매우 그렇다)' : 'Rate each 1 (Strongly Disagree) to 5 (Strongly Agree)'}
            />
            <div className="space-y-4">
              {screenerItems.map((it) => (
                <div key={it.id} className="border rounded p-3">
                  <div className="mb-2">{it.text}</div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <label key={v} className={`px-3 py-1 rounded cursor-pointer border ${screenerResponses[it.id] === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>
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
          <div className="bg-white p-6 rounded-lg shadow">
            <StageHeader title={locale === 'kr' ? '스테이지 2 — 구분 문항' : 'Stage 2 — Discriminators'} />
            <div className="space-y-4">
              {discItems.map((it) => (
                <div key={it.id} className="border rounded p-3">
                  <div className="mb-2">{it.prompt}</div>
                  <div className="flex flex-col gap-2">
                    <label className={`px-3 py-2 rounded border cursor-pointer ${discResponses[it.id] === 'A' ? 'bg-blue-50 border-blue-400' : ''}`}>
                      <input
                        type="radio"
                        name={it.id}
                        className="hidden"
                        checked={discResponses[it.id] === 'A'}
                        onChange={() => setDiscResponses((s) => ({ ...s, [it.id]: 'A' }))}
                      />
                      A) {it.optionA}
                    </label>
                    <label className={`px-3 py-2 rounded border cursor-pointer ${discResponses[it.id] === 'B' ? 'bg-blue-50 border-blue-400' : ''}`}>
                      <input
                        type="radio"
                        name={it.id}
                        className="hidden"
                        checked={discResponses[it.id] === 'B'}
                        onChange={() => setDiscResponses((s) => ({ ...s, [it.id]: 'B' }))}
                      />
                      B) {it.optionB}
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
          <div className="bg-white p-6 rounded-lg shadow">
            <StageHeader title={locale === 'kr' ? '스테이지 3 — 본능 경향' : 'Stage 3 — Instincts'} subtitle={locale === 'kr' ? '각 문항 1~5점' : 'Rate each 1–5'} />
            <div className="space-y-4">
              {instinctItems.map((it) => (
                <div key={it.id} className="border rounded p-3">
                  <div className="mb-2">{it.text}</div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <label key={v} className={`px-3 py-1 rounded cursor-pointer border ${instinctResponses[it.id] === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>
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
          <div className="bg-white p-6 rounded-lg shadow">
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
                    onChange={(e) => setNarrativeTexts((arr) => { const n=[...arr]; n[idx]=e.target.value; return n; })}
                    rows={4}
                    className="w-full border rounded p-2"
                    placeholder={locale === 'kr' ? '여기에 작성하세요…' : 'Type here…'}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={submitStage}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {locale === 'kr' ? '완료' : 'Complete'}
              </button>
            </div>
          </div>
        )}

        {stage === 'complete' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <StageHeader title={locale === 'kr' ? '완료' : 'Complete'} subtitle={locale === 'kr' ? '점수를 계산하고 결과 페이지로 이동합니다.' : 'Score and view your unified results.'} />
            <div className="flex gap-3">
              <button
                onClick={scoreAndGoResults}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {locale === 'kr' ? '점수 계산 및 결과 보기' : 'Score & View Results'}
              </button>
              <button
                onClick={() => router.push(`/results?sessionId=${encodeURIComponent(sessionId)}`)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                {locale === 'kr' ? '결과로 이동' : 'Go to Results'}
              </button>
            </div>
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
