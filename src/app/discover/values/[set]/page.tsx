'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ArrowLeft, Save, Download, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import * as htmlToImage from 'html-to-image';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type Value = { id: string; name: string; description: string };
type SetKey = 'terminal' | 'instrumental' | 'work';

const TERMINAL: Value[] = [
  { id: 'tv1', name: 'Family Security', description: "Ensuring the safety, well-being, and financial security of one's family" },
  { id: 'tv2', name: 'Personal Growth', description: "Self-improvement, learning, and developing one's potential" },
  { id: 'tv3', name: 'Health and Wellness', description: 'Physical, mental, and emotional well-being' },
  { id: 'tv4', name: 'National Security', description: "Safety and stability of one's nation" },
  { id: 'tv5', name: 'Global Citizenship', description: 'Belonging and responsibility to the global community' },
  { id: 'tv6', name: 'Inner Peace', description: 'Inner tranquility, contentment, and balance' },
  { id: 'tv7', name: 'Social Justice', description: 'Fair, equitable, and just society' },
  { id: 'tv8', name: 'Mature Love', description: 'Deep, committed relationship with intimacy and passion' },
  { id: 'tv9', name: 'Sense of Accomplishment', description: 'Achieving goals and feeling successful' },
  { id: 'tv10', name: 'A World of Beauty', description: 'Beauty in nature, art, and life experiences' },
  { id: 'tv11', name: 'Spirituality', description: 'Connection beyond the material world' },
  { id: 'tv12', name: 'Recognition', description: 'Acknowledgment, respect, and esteem from others' },
  { id: 'tv13', name: 'Freedom', description: 'Autonomy and the right to make choices' },
  { id: 'tv14', name: 'Financial Freedom', description: 'Economic independence; freedom from constraints' },
  { id: 'tv15', name: 'Pleasure', description: 'Enjoyable and satisfying experiences' },
  { id: 'tv16', name: 'Sustainable Planet', description: 'Eco-friendly, sustainable world' },
  { id: 'tv17', name: 'Wisdom', description: 'Knowledge, insight, and sound judgment' },
  { id: 'tv18', name: 'Authenticity', description: 'Being true to oneself with sincerity' },
  { id: 'tv19', name: 'True Friendship', description: 'Deep, meaningful, loyal friendships' },
  { id: 'tv20', name: 'Comfortable Life', description: 'Contentment, ease, and security' },
  { id: 'tv21', name: 'A World at Peace', description: 'Peace, cooperation, and mutual understanding' },
  { id: 'tv22', name: 'Happiness', description: 'Joy and a sense of purpose' },
  { id: 'tv23', name: 'Innovation', description: 'Creativity, progress, and new ideas' },
  { id: 'tv24', name: 'An Exciting Life', description: 'Adventure and stimulation' }
];

const INSTRUMENTAL: Value[] = [
  { id: 'iv1', name: 'Open-mindedness', description: 'Consider new ideas; revise views based on evidence' },
  { id: 'iv2', name: 'Humility', description: 'Be grounded; learn from others' },
  { id: 'iv3', name: 'Empathy', description: 'Resonate with others\' feelings and respond appropriately' },
  { id: 'iv4', name: 'Tolerance', description: 'Accept differences even when uncomfortable' },
  { id: 'iv5', name: 'Discipline', description: 'Act consistently with principles and rules' },
  { id: 'iv6', name: 'Logical Thinking', description: 'Systematic, rational reasoning' },
  { id: 'iv7', name: 'Helpfulness', description: 'Recognize needs and offer support' },
  { id: 'iv8', name: 'Responsiveness', description: 'Respond quickly and sensitively to needs' },
  { id: 'iv9', name: 'Imagination', description: 'Envision possibilities beyond current reality' },
  { id: 'iv10', name: 'Reliability', description: 'Keep promises; be consistent and dependable' },
  { id: 'iv11', name: 'Ambition', description: 'Hold big dreams and strive to realize them' },
  { id: 'iv12', name: 'Courage', description: 'Choose right action despite fear or difficulty' },
  { id: 'iv13', name: 'Competence', description: 'Perform tasks effectively and with quality' },
  { id: 'iv14', name: 'Perseverance', description: 'Endure hardship and do not give up' },
  { id: 'iv15', name: 'Assertiveness', description: 'Express opinions and rights confidently' },
  { id: 'iv16', name: 'Self-control', description: 'Regulate impulses and emotions' },
  { id: 'iv17', name: 'Adaptability', description: 'Adjust flexibly to changing environments' },
  { id: 'iv18', name: 'Respect', description: 'Value others\' dignity and rights' },
  { id: 'iv19', name: 'Initiative', description: 'Take the lead and create opportunities' },
  { id: 'iv20', name: 'Intellectual Activity', description: 'Expand knowledge via learning and thinking' },
  { id: 'iv21', name: 'Integrity', description: 'Speak truth; align inner and outer self' },
  { id: 'iv22', name: 'Creativity', description: 'Generate original ideas and solutions' },
  { id: 'iv23', name: 'Cleanliness & Order', description: 'Keep spaces hygienic and organized' },
  { id: 'iv24', name: 'Loyalty', description: 'Maintain unwavering commitment and allegiance' },
  { id: 'iv25', name: 'Responsibility', description: 'Own outcomes; carry roles to completion' },
  { id: 'iv26', name: 'Kindness', description: 'Be warm and considerate to others' },
  { id: 'iv27', name: 'Cooperation', description: 'Work harmoniously with others toward goals' },
  { id: 'iv28', name: 'Resilience', description: 'Bounce back quickly from setbacks' }
];

const WORK: Value[] = [
  { id: 'wv1', name: 'Supervisory Opportunity', description: 'Leadership experience managing team members' },
  { id: 'wv2', name: 'Fairness', description: 'Equitable and just treatment at work' },
  { id: 'wv3', name: 'Relationships', description: 'Positive relationships with colleagues and supervisors' },
  { id: 'wv4', name: 'Work–Life Balance', description: 'Harmony between work and personal life' },
  { id: 'wv5', name: 'Compensation', description: 'Sufficient financial rewards' },
  { id: 'wv6', name: 'Contribution (Impact)', description: 'Make meaningful impact and add value' },
  { id: 'wv7', name: 'Task Variety', description: 'Diverse tasks and responsibilities' },
  { id: 'wv8', name: 'Challenge', description: 'Test and develop abilities' },
  { id: 'wv9', name: 'Autonomy/Independence', description: 'Perform tasks with minimal interference' },
  { id: 'wv10', name: 'Prestige', description: 'Respect via reputable role or organization' },
  { id: 'wv11', name: 'Achievement', description: 'Feel accomplishment by achieving goals' },
  { id: 'wv12', name: 'Advancement', description: 'Opportunities for higher roles and responsibility' },
  { id: 'wv13', name: 'Security/Stability', description: 'Safe conditions and stable employment' },
  { id: 'wv14', name: 'Travel (Business Trips)', description: 'Visit various locations through work' },
  { id: 'wv15', name: 'Geographic Location', description: 'Convenient location for commute and life' },
  { id: 'wv16', name: 'Flexibility', description: 'Flexible time or place of work' },
  { id: 'wv17', name: 'Ethics', description: 'Strong ethical standards in the environment' },
  { id: 'wv18', name: 'Recognition', description: 'Appropriate evaluation and appreciation' },
  { id: 'wv19', name: 'Person–Job Fit', description: 'Tasks match ability and disposition' },
  { id: 'wv20', name: 'Working Conditions', description: 'Pleasant and efficient physical environment' },
  { id: 'wv21', name: 'Professional Development', description: 'Learn and grow into expertise' },
  { id: 'wv22', name: 'Supportive Supervision', description: 'Encouraging, constructive manager' },
  { id: 'wv23', name: 'Creativity', description: 'Exercise free, original ideas' },
  { id: 'wv24', name: 'Teamwork', description: 'Collaborate to achieve shared goals' },
  { id: 'wv25', name: 'Innovation', description: 'Introduce new methods/technologies for change' }
];

type Layout = {
  very_important: string[];
  important: string[];
  somewhat_important: string[];
  not_important: string[];
};
const emptyLayout: Layout = { very_important: [], important: [], somewhat_important: [], not_important: [] };

export default function ValueSetPage({ params }: { params: Promise<{ set: SetKey }> }) {
  const [routeSet, setRouteSet] = useState<SetKey>('work');
  useEffect(() => { (async () => { const p = await params; setRouteSet(p.set); })(); }, [params]);

  const VALUES = useMemo(() => {
    switch (routeSet) {
      case 'terminal': return TERMINAL;
      case 'instrumental': return INSTRUMENTAL;
      default: return WORK;
    }
  }, [routeSet]);

  const { data: session, status } = useSession();
  const [palette, setPalette] = useState<string[]>([]);
  const [layout, setLayout] = useState<Layout>(emptyLayout);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPalette(VALUES.map(v => v.id)); setLayout(emptyLayout); }, [VALUES]);

  // Load saved from server if available
  useEffect(() => {
    const userId = session?.user?.email || (session as any)?.user?.id;
    if (!userId || !routeSet) return;
    fetch(`/api/discover/values/results?user_id=${encodeURIComponent(userId)}&set=${routeSet}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.exists) {
          const saved: Layout = data.layout;
          setLayout(saved);
          const placed = new Set([...saved.very_important, ...saved.important, ...saved.somewhat_important, ...saved.not_important]);
          setPalette(VALUES.filter(v => !placed.has(v.id)).map(v => v.id));
        }
      })
      .catch(() => {});
  }, [session, routeSet, VALUES]);

  const byId = useMemo(() => Object.fromEntries(VALUES.map(v => [v.id, v])), [VALUES]);

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;
    if (sourceId === destId && source.index === destination.index) return;

    const nextLayout: Layout = JSON.parse(JSON.stringify(layout));

    // Remove from source
    if (sourceId === 'palette') {
      setPalette(prev => prev.filter(x => x !== draggableId));
    } else {
      const arr = (nextLayout[sourceId as keyof Layout] as string[]).filter(x => x !== draggableId);
      (nextLayout[sourceId as keyof Layout] as string[]) = arr;
    }

    // Add to dest
    if (destId === 'palette') {
      setPalette(prev => { const arr = [...prev]; arr.splice(destination.index, 0, draggableId); return arr; });
      // Ensure layout reflects removal from the source bucket
      setLayout(nextLayout);
    } else {
      const arr = [...(nextLayout[destId as keyof Layout] as string[])];
      arr.splice(destination.index, 0, draggableId);
      (nextLayout[destId as keyof Layout] as string[]) = arr;
      setLayout(nextLayout);
    }
  }

  const counts = [layout.very_important.length, layout.important.length, layout.somewhat_important.length, layout.not_important.length];
  const top3 = layout.very_important.slice(0, 3).map(id => byId[id]?.name || id);
  const chartData = { labels: ['Very Important', 'Important', 'Somewhat Important', 'Not Important'], datasets: [{ label: 'Count', data: counts, backgroundColor: ['#7c3aed', '#2563eb', '#10b981', '#9ca3af'] }] };
  const chartRef = useRef<any>(null);

  function exportChartPNG() {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.toBase64Image();
    const a = document.createElement('a');
    a.href = url; a.download = `${routeSet}_values_summary.png`; a.click();
  }

  async function exportBoardPNG() {
    if (!boardRef.current) return;
    const dataUrl = await htmlToImage.toPng(boardRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = dataUrl; a.download = `${routeSet}_values_board.png`; a.click();
  }

  async function saveToServer() {
    const userId = (session as any)?.user?.id || session?.user?.email;
    if (!userId) { alert('Please sign in to save.'); return; }
    const payload = { user_id: userId, set: routeSet, layout, top3 };
    const res = await fetch('/api/discover/values/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) alert('Save failed'); else alert('Saved successfully');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/discover/values" className="flex items-center space-x-2 text-gray-800 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Values</span>
          </Link>
          <div className="flex items-center gap-2">
            {status !== 'authenticated' ? (
              <button onClick={() => signIn('google')} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><LogIn className="w-4 h-4"/>Sign in with Google</button>
            ) : (
              <button onClick={() => signOut()} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><LogOut className="w-4 h-4"/>Sign out</button>
            )}
            <button onClick={saveToServer} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg"><Save className="w-4 h-4"/>Save</button>
            <button onClick={exportChartPNG} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><Download className="w-4 h-4"/>Chart PNG</button>
            <button onClick={exportBoardPNG} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><Download className="w-4 h-4"/>Board PNG</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4 capitalize">{routeSet} Values — Categorize</h1>

        <div className="mb-4 text-xs text-gray-800 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> When saved, your values classification (set, placements, Top 3) will be stored in the database for future module analysis.</div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div ref={boardRef} className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {(['very_important','important','somewhat_important','not_important'] as const).map((bucket) => (
              <Droppable key={bucket} droppableId={bucket}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="order-2 bg-white p-4 rounded-xl border min-h-[240px] flex flex-col lg:order-1"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-semibold text-gray-900">{bucket.replace('_',' ').replace('_',' ').replace(/^./, (c) => c.toUpperCase())}</h2>
                      <span className="text-xs font-medium text-gray-700">{(layout[bucket] as string[]).length}</span>
                    </div>
                    <div className="flex-1">
                      {(layout[bucket] as string[]).map((id, index) => (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="border rounded-lg p-3 mb-2 bg-white shadow-sm"
                            >
                              <div className="font-medium text-gray-900">{byId[id].name}</div>
                              <div className="text-sm text-gray-700">{byId[id].description}</div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}

            <Droppable droppableId="palette">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="order-1 bg-white p-4 rounded-xl border min-h-[320px] lg:order-2 lg:col-span-4"
                >
                  <h2 className="font-semibold mb-2 text-gray-900">Values Library</h2>
                  <p className="mb-4 text-sm text-gray-700">
                    Drag any value into the importance buckets above. Rearrange cards whenever you change your mind.
                  </p>
                  {palette.map((id, index) => (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="border rounded-lg p-3 mb-2 bg-white shadow-sm"
                        >
                          <div className="font-medium text-gray-900">{byId[id].name}</div>
                          <div className="text-sm text-gray-700">{byId[id].description}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>

        <section className="mt-8 bg-white rounded-xl border p-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Bar ref={chartRef as any} data={chartData} options={{ responsive: true, plugins: { legend: { display: false }}}} />
            </div>
            <div>
              <h3 className="font-medium mb-1">Top 3</h3>
              <ol className="list-decimal list-inside text-sm text-gray-700">
                {top3.map((n)=> (<li key={n}>{n}</li>))}
              </ol>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
