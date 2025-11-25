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
    <div className="min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 font-outfit text-gray-900">Unified Results</h1>

        {/* Session input */}
        <div className="mb-6 glass-panel p-6 rounded-2xl flex items-center space-x-4">
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter sessionId"
            className="flex-1 border border-white/40 bg-white/50 backdrop-blur-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
          <button
            onClick={fetchResults}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canFetch || loading}
          >
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 rounded-xl">{error}</div>
        )}

        {/* Strengths Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 font-outfit text-gray-900">Strengths</h2>
          <div className="glass-card p-6 rounded-3xl">
            <StrengthRadarChart data={strengths} showDetails allowDelete={false} />
          </div>
        </section>

        {/* Enneagram Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 font-outfit text-gray-900">Enneagram</h2>
          {enneagram ? (
            <div className="glass-card p-8 rounded-3xl">
              <div className="flex flex-wrap gap-8 mb-8">
                <div className="bg-white/50 rounded-2xl p-4 min-w-[120px]">
                  <div className="text-sm text-gray-500 mb-1">Primary Type</div>
                  <div className="text-3xl font-bold text-primary-700 font-outfit">{enneagram.primaryType ?? '-'}</div>
                </div>
                <div className="bg-white/50 rounded-2xl p-4 min-w-[120px]">
                  <div className="text-sm text-gray-500 mb-1">Confidence</div>
                  <div className="text-xl font-semibold capitalize text-gray-800">{enneagram.confidence ?? '-'}</div>
                </div>
                <div className="bg-white/50 rounded-2xl p-4 min-w-[120px]">
                  <div className="text-sm text-gray-500 mb-1">Wing</div>
                  <div className="text-xl font-semibold text-gray-800">{enneagram.wingEstimate ?? '-'}</div>
                </div>
                <div className="bg-white/50 rounded-2xl p-4 min-w-[120px]">
                  <div className="text-sm text-gray-500 mb-1">Instinct</div>
                  <div className="text-xl font-semibold text-gray-800">{enneagram.instinct ?? '-'}</div>
                </div>
              </div>
              {/* Probabilities */}
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Type Probabilities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(enneagram.typeProbabilities ?? {}).map(([t, v]) => (
                  <div key={t} className="flex items-center justify-between px-4 py-3 bg-white/40 rounded-xl border border-white/30">
                    <span className="font-mono font-medium text-gray-700">Type {t}</span>
                    <span className="font-bold text-primary-600">{(Number(v) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 rounded-3xl text-gray-600 italic">No Enneagram data yet.</div>
          )}
        </section>

        {/* Export Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4 font-outfit text-gray-900">Export</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                const r = await fetch('/api/enneagram/export', { method: 'POST', body: JSON.stringify({ sessionId }) });
                if (r.ok) alert('Enneagram JSON exported (server-side artifact created).');
              }}
              className="px-6 py-3 bg-gradient-to-r from-accent-600 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-accent-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
