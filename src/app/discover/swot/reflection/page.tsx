'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Sparkles, Edit2, Check, BarChart3 } from 'lucide-react';
import { StepProgress } from '../components/StepProgress';

interface Strategy {
  id: string;
  text: string;
  impact: number;
  feasibility: number;
  priority_group?: string;
}

export default function ReflectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [reflection, setReflection] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [priorityGroups, setPriorityGroups] = useState<{
    'Execute First': Strategy[];
    'Quick Wins': Strategy[];
    'Strategic Planning': Strategy[];
    'Reconsider': Strategy[];
  }>({
    'Execute First': [],
    'Quick Wins': [],
    'Strategic Planning': [],
    'Reconsider': []
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/swot/session');
      const data = await res.json();
      if (!data.id) router.push('/discover/swot/analysis');

      // Load prioritized strategies
      const allStrategies = data.strategy_priorities || [];
      setStrategies(allStrategies);

      // Group by priority
      setPriorityGroups({
        'Execute First': allStrategies.filter((s: Strategy) => s.priority_group === 'Execute First'),
        'Quick Wins': allStrategies.filter((s: Strategy) => s.priority_group === 'Quick Wins'),
        'Strategic Planning': allStrategies.filter((s: Strategy) => s.priority_group === 'Strategic Planning'),
        'Reconsider': allStrategies.filter((s: Strategy) => s.priority_group === 'Reconsider')
      });

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

        {/* Priority Matrix - Always Visible at Top */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">Your Strategy Priorities</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Review your prioritized strategies as you reflect on your SWOT journey
          </p>
          <div className="grid grid-cols-2 gap-4">
            <PriorityQuadrant
              title="Execute First"
              subtitle="High Impact, High Feasibility"
              strategies={priorityGroups['Execute First']}
              color="green"
            />
            <PriorityQuadrant
              title="Strategic Planning"
              subtitle="High Impact, Low Feasibility"
              strategies={priorityGroups['Strategic Planning']}
              color="yellow"
            />
            <PriorityQuadrant
              title="Quick Wins"
              subtitle="Low Impact, High Feasibility"
              strategies={priorityGroups['Quick Wins']}
              color="blue"
            />
            <PriorityQuadrant
              title="Reconsider"
              subtitle="Low Impact, Low Feasibility"
              strategies={priorityGroups['Reconsider']}
              color="gray"
            />
          </div>
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

function PriorityQuadrant({ title, subtitle, strategies, color }: {
  title: string;
  subtitle: string;
  strategies: Strategy[];
  color: 'green' | 'yellow' | 'blue' | 'gray';
}) {
  const colors = {
    green: 'bg-green-50 border-green-300',
    yellow: 'bg-yellow-50 border-yellow-300',
    blue: 'bg-blue-50 border-blue-300',
    gray: 'bg-gray-50 border-gray-300'
  };

  return (
    <div className={`rounded-xl border-2 p-4 min-h-[160px] ${colors[color]}`}>
      <h4 className="font-bold text-sm mb-1">{title}</h4>
      <p className="text-xs text-gray-600 mb-3">{subtitle}</p>
      <div className="space-y-2">
        {strategies.map((s, i) => (
          <div key={s.id} className="text-xs bg-white rounded p-2">
            {i + 1}. {s.text.length > 40 ? s.text.substring(0, 40) + '...' : s.text}
          </div>
        ))}
        {strategies.length === 0 && (
          <p className="text-xs text-gray-400 italic">No strategies in this category</p>
        )}
      </div>
    </div>
  );
}
