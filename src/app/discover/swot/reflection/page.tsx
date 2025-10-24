'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Sparkles, Edit2, Check } from 'lucide-react';
import { StepProgress } from '../components/StepProgress';

export default function ReflectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [reflection, setReflection] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/swot/session');
      const data = await res.json();
      if (!data.id) router.push('/discover/swot/analysis');
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }

  async function genQuestions() {
    setGenerating(true);
    try {
      const res = await fetch('/api/swot/generate-reflection-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swotData: {}, strategies: [], priorities: [] })
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setAnswers(new Array(data.questions.length).fill(''));
      setStep(1);
    } catch (e) {
      alert('Failed to generate questions');
    }
    setGenerating(false);
  }

  async function genDraft() {
    setGenerating(true);
    try {
      const res = await fetch('/api/swot/generate-reflection-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swotData: {},
          strategies: [],
          priorities: [],
          answers: questions.map((q, i) => ({ question: q, answer: answers[i] }))
        })
      });
      const data = await res.json();
      setReflection(data.reflection || '');
      setStep(2);
    } catch (e) {
      alert('Failed to generate draft');
    }
    setGenerating(false);
  }

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/swot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflection,
          current_stage: 'completed',
          is_completed: true
        })
      });
      alert('Completed!');
      router.push('/discover/swot');
    } catch (e) {
      alert('Failed to save');
    }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <StepProgress currentStage="reflection" />
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reflection</h1>
          <p className="text-gray-600">Reflect on your SWOT journey</p>
        </div>

        {step === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Sparkles className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Generate Reflection Questions</h3>
            <button onClick={genQuestions} disabled={generating} className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold">
              {generating ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold mb-6">Answer Questions</h3>
            {questions.map((q, i) => (
              <div key={i} className="mb-6">
                <label className="block font-medium mb-2">Q{i+1}: {q}</label>
                <textarea
                  value={answers[i]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[i] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  className="w-full px-4 py-3 border rounded-lg"
                  rows={4}
                />
              </div>
            ))}
            <button onClick={genDraft} disabled={generating} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold">
              {generating ? 'Generating...' : 'Generate Draft'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold mb-6">Your Reflection</h3>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg"
              rows={12}
            />
            <button onClick={save} disabled={saving} className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold">
              {saving ? 'Saving...' : 'Complete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
