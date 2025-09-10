"use client";

import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [knownSessionId, setKnownSessionId] = useState('');

  useEffect(() => {
    try {
      const last = localStorage.getItem('lifecraft:lastSessionId') || '';
      if (last) setKnownSessionId(last);
    } catch {}
  }, []);

  const createSessionAndGo = (path: string) => {
    const sid = uuidv4();
    try { localStorage.setItem('lifecraft:lastSessionId', sid); } catch {}
    window.location.href = `${path}?sessionId=${encodeURIComponent(sid)}`;
  };

  const goToResults = () => {
    const sid = sessionId || knownSessionId;
    if (!sid) return;
    window.location.href = `/results?sessionId=${encodeURIComponent(sid)}`;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center">
      <div className="max-w-5xl mx-auto w-full py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">LifeCraft — WFED 119</h1>
          <p className="text-gray-600 mt-2">Discover strengths, understand patterns, and build your Career OS.</p>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 border">
            <h2 className="text-xl font-semibold mb-2">Strength Discovery</h2>
            <p className="text-gray-600 mb-4">Socratic interview to surface skills, attitudes, and values from your stories.</p>
            <button
              onClick={() => createSessionAndGo('/discover/strengths')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start Strength Stories
            </button>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border">
            <h2 className="text-xl font-semibold mb-2">Enneagram Profiler</h2>
            <p className="text-gray-600 mb-4">Progressive screener, tie-breakers, wings/instincts, and narrative validation.</p>
            <div className="flex gap-3">
              <button
                onClick={() => createSessionAndGo('/discover/enneagram')}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Start Enneagram
              </button>
              <a href="/discover/enneagram" className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Open</a>
            </div>
          </div>
        </div>

        {/* Results Access */}
        <div className="mt-10 bg-white rounded-xl shadow p-6 border">
          <h3 className="font-semibold mb-2">Go to Results</h3>
          <div className="flex gap-3 items-center">
            <input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder={knownSessionId ? `e.g., ${knownSessionId.slice(0,8)}…` : 'Enter sessionId'}
              className="flex-1 border rounded px-3 py-2"
            />
            <button onClick={goToResults} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black">Open Results</button>
          </div>
        </div>
      </div>
    </div>
  );
}
