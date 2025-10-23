'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Download, FileText, Home } from 'lucide-react';

interface SWOTSummary {
  vision_or_goal: string;
  strengths: any[];
  weaknesses: any[];
  opportunities: any[];
  threats: any[];
  so_strategies: any[];
  wo_strategies: any[];
  st_strategies: any[];
  wt_strategies: any[];
  reflection: string;
}

export default function ReflectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [swotData, setSwotData] = useState<SWOTSummary | null>(null);
  const [reflection, setReflection] = useState('');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const words = reflection.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [reflection]);

  async function loadData() {
    try {
      const res = await fetch('/api/swot/session');
      const data = await res.json();

      if (!data.id) {
        router.push('/discover/swot/analysis');
        return;
      }

      setSwotData(data);
      setReflection(data.reflection || '');
      setLoading(false);
    } catch (error) {
      console.error('[Reflection] Error loading:', error);
      setLoading(false);
    }
  }

  async function handleSaveReflection() {
    if (wordCount < 200) {
      alert('Reflection must be at least 200 words.');
      return;
    }

    setSaving(true);

    try {
      await fetch('/api/swot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflection,
          current_stage: 'completed',
          is_completed: true,
          completed_at: new Date().toISOString()
        })
      });

      alert('SWOT Analysis completed successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('[Reflection] Error saving:', error);
      alert('Failed to save reflection. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPDF() {
    alert('PDF export feature will be implemented in Phase 3. For now, you can copy your content manually.');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (!swotData) {
    return null;
  }

  const isReflectionValid = wordCount >= 200 && wordCount <= 300;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reflection & Summary</h1>
          <p className="text-gray-600">Review your SWOT analysis and write your reflection</p>
        </div>

        {/* SWOT Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your SWOT Analysis Summary</h2>

          {/* Vision */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Vision / Goal</h3>
            <p className="text-gray-800 bg-indigo-50 p-4 rounded-lg">{swotData.vision_or_goal}</p>
          </div>

          {/* SWOT Elements */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <SummarySection title="Strengths" items={swotData.strengths} color="green" />
            <SummarySection title="Weaknesses" items={swotData.weaknesses} color="red" />
            <SummarySection title="Opportunities" items={swotData.opportunities} color="blue" />
            <SummarySection title="Threats" items={swotData.threats} color="orange" />
          </div>

          {/* Strategies Summary */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Strategic Insights</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg">
                <strong className="text-green-700">SO Strategies:</strong> {swotData.so_strategies.length} created
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <strong className="text-blue-700">WO Strategies:</strong> {swotData.wo_strategies.length} created
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <strong className="text-purple-700">ST Strategies:</strong> {swotData.st_strategies.length} created
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <strong className="text-red-700">WT Strategies:</strong> {swotData.wt_strategies.length} created
              </div>
            </div>
          </div>
        </div>

        {/* Reflection Essay */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Reflection Essay</h2>
          <p className="text-gray-600 mb-4">
            Write a 200-300 word reflection on what you learned from this SWOT analysis and how you plan to apply these insights.
          </p>

          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="How has this exercise helped clarify your path forward? Are there any strategies that surprised you? What next steps will you take to implement your highest-priority strategies?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={12}
          />

          <div className="mt-3 flex items-center justify-between">
            <div className={`text-sm ${wordCount >= 200 && wordCount <= 300 ? 'text-green-600' : 'text-gray-500'}`}>
              {wordCount} words
              {wordCount < 200 && ` (${200 - wordCount} more needed)`}
              {wordCount > 300 && ` (${wordCount - 300} over limit)`}
            </div>
            {isReflectionValid && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Word count valid
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={handleExportPDF}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border-2 border-indigo-500 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export as PDF
          </button>

          <button
            onClick={handleSaveReflection}
            disabled={!isReflectionValid || saving}
            className={`
              flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold
              transition-all duration-200 shadow-lg
              ${isReflectionValid && !saving
                ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Complete SWOT Analysis
              </>
            )}
          </button>
        </div>

        {/* Completion Message */}
        {isReflectionValid && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Complete!</h3>
            <p className="text-gray-600 mb-4">
              You've successfully completed all sections of the SWOT Analysis. Click "Complete SWOT Analysis" to finalize your work.
            </p>
          </div>
        )}

        {/* Back Navigation */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/discover/swot/action')}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← Back to Action Plan
          </button>
        </div>
      </div>
    </div>
  );
}

interface SummarySectionProps {
  title: string;
  items: any[];
  color: 'green' | 'red' | 'blue' | 'orange';
}

function SummarySection({ title, items, color }: SummarySectionProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200'
  };

  const titleColorClasses = {
    green: 'text-green-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
    orange: 'text-orange-700'
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${colorClasses[color]}`}>
      <h4 className={`font-semibold mb-2 ${titleColorClasses[color]}`}>
        {title} ({items.length})
      </h4>
      <ul className="space-y-1 text-sm text-gray-700">
        {items.slice(0, 4).map((item, i) => (
          <li key={i} className="truncate">• {item.text || item}</li>
        ))}
        {items.length > 4 && (
          <li className="text-gray-500">+ {items.length - 4} more...</li>
        )}
      </ul>
    </div>
  );
}
