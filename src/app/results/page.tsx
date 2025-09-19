"use client";

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import StrengthRadarChart to avoid SSR issues
const StrengthRadarChart = dynamic(
  () => import('@/components/visualization/StrengthRadarChart').then(mod => ({ default: mod.StrengthRadarChart })),
  { ssr: false }
);

type Strengths = { skills: string[]; attitudes: string[]; values: string[] };
interface EnneagramResult {
  primaryType?: string | null;
  confidence?: string | null;
  wingEstimate?: string | null;
  instinct?: string | null;
  typeProbabilities?: Record<string, number | string> | null;
}

const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

function ResultsPageContent() {
  const search = useSearchParams();
  const initialSession = search.get('sessionId') ?? '';
  const [sessionId, setSessionId] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strengths, setStrengths] = useState<Strengths>({ skills: [], attitudes: [], values: [] });
  const [enneagram, setEnneagram] = useState<EnneagramResult | null>(null);

  const canFetch = useMemo(() => sessionId && sessionId.length > 0, [sessionId]);

  const fetchResults = async () => {
    if (!canFetch) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/results/${sessionId}`);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json() as Partial<{ strengths: Strengths; enneagram: EnneagramResult | null }>;
      setStrengths(data?.strengths ?? { skills: [], attitudes: [], values: [] });
      setEnneagram(data?.enneagram ?? null);
    } catch (error) {
      setError(toErrorMessage(error, 'Failed to load results'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canFetch) fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Unified Results</h1>

        {/* Session input */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow flex items-center space-x-2">
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter sessionId"
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={fetchResults}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!canFetch || loading}
          >
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded">{error}</div>
        )}

        {/* Strengths Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Strengths</h2>
          <StrengthRadarChart data={strengths} showDetails allowDelete={false} />
        </section>

        {/* Enneagram Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Enneagram</h2>
          {enneagram ? (
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">Primary Type</div>
                  <div className="text-lg font-semibold">{enneagram.primaryType ?? '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Confidence</div>
                  <div className="text-lg font-semibold capitalize">{enneagram.confidence ?? '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Wing</div>
                  <div className="text-lg">{enneagram.wingEstimate ?? '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Instinct</div>
                  <div className="text-lg">{enneagram.instinct ?? '-'}</div>
                </div>
              </div>
              {/* Probabilities */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(enneagram.typeProbabilities ?? {}).map(([t, v]) => (
                  <div key={t} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded">
                    <span className="font-mono">Type {t}</span>
                    <span>{(Number(v) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-600">No Enneagram data yet.</div>
          )}
        </section>

        {/* Export Buttons */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-3">Export</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                const r = await fetch('/api/enneagram/export', { method: 'POST', body: JSON.stringify({ sessionId }) });
                if (r.ok) alert('Enneagram JSON exported (server-side artifact created).');
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
              disabled={!canFetch}
            >
              Export Enneagram JSON
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResultsPageContent />
    </Suspense>
  );
}
