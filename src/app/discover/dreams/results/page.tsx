'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Download, ArrowLeft, Loader2, Heart, Brain, Dumbbell,
  Home, DollarSign, Briefcase, Coffee, Edit3, Check, X, FileText
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';

interface Dream {
  id: string;
  title: string;
  description?: string;
  life_stage?: LifeStage;
  wellbeing_area?: WellbeingArea;
  why?: string;
  is_completed: boolean;
}

type LifeStage = '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';
type WellbeingArea = 'relationship' | 'spiritual' | 'intellectual' | 'physical' | 'environment' | 'financial' | 'career' | 'leisure';

const LIFE_STAGES: LifeStage[] = ['20s', '30s', '40s', '50s', '60s', '70s+'];

const WELLBEING_AREAS: { id: WellbeingArea; name: string; icon: any; color: string }[] = [
  { id: 'relationship', name: 'Relationship', icon: Heart, color: 'text-pink-600 bg-pink-50' },
  { id: 'spiritual', name: 'Spiritual', icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
  { id: 'intellectual', name: 'Intellectual', icon: Brain, color: 'text-blue-600 bg-blue-50' },
  { id: 'physical', name: 'Physical', icon: Dumbbell, color: 'text-green-600 bg-green-50' },
  { id: 'environment', name: 'Environment', icon: Home, color: 'text-amber-600 bg-amber-50' },
  { id: 'financial', name: 'Financial', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'career', name: 'Career', icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'leisure', name: 'Leisure', icon: Coffee, color: 'text-orange-600 bg-orange-50' }
];

export default function DreamResultsPage() {
  const router = useRouter();
  const { completeModule } = useModuleProgress('dreams');
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [aiFeedback, setAiFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  useEffect(() => {
    loadDreams();
  }, []);

  async function loadDreams() {
    try {
      const res = await fetch('/api/dreams/session');
      if (res.ok) {
        const data = await res.json();
        const loadedDreams = data.dreams || [];
        setDreams(loadedDreams);

        if (loadedDreams.length > 0) {
          generateAIFeedback(loadedDreams);
        }
      }
    } catch (error) {
      console.error('Failed to load dreams:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateAIFeedback(dreamList: Dream[]) {
    setFeedbackLoading(true);
    try {
      const res = await fetch('/api/dreams/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dreams: dreamList })
      });

      if (res.ok) {
        const data = await res.json();
        setAiFeedback(data.feedback || 'Your dream matrix shows thoughtful life planning across multiple dimensions.');
        setEditedFeedback(data.feedback || '');

        // Complete module when finalized
        completeModule();
      }
    } catch (error) {
      console.error('Failed to generate feedback:', error);
      setAiFeedback('Your dreams reflect a balanced approach to life planning.');
      setEditedFeedback('Your dreams reflect a balanced approach to life planning.');
    } finally {
      setFeedbackLoading(false);
    }
  }

  function saveFeedbackEdit() {
    setAiFeedback(editedFeedback);
    setIsEditingFeedback(false);
  }

  function cancelFeedbackEdit() {
    setEditedFeedback(aiFeedback);
    setIsEditingFeedback(false);
  }

  async function handleDownloadPDF() {
    setIsPdfGenerating(true);

    try {
      // Dynamic import for html2canvas and jspdf
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = printRef.current;
      if (!element) {
        throw new Error('Print element not found');
      }

      // Create canvas from the element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`Dream-Life-Matrix-${date}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again or use browser print (Ctrl/Cmd + P).');
    } finally {
      setIsPdfGenerating(false);
    }
  }

  // Group dreams by wellbeing area
  const dreamsByArea = WELLBEING_AREAS.map(area => ({
    ...area,
    dreams: dreams.filter(d => d.wellbeing_area === area.id)
  })).filter(area => area.dreams.length > 0);

  // Calculate stats
  const totalDreams = dreams.length;
  const assignedDreams = dreams.filter(d => d.wellbeing_area && d.life_stage).length;
  const coveredAreas = new Set(dreams.map(d => d.wellbeing_area).filter(Boolean)).size;
  const coveredStages = new Set(dreams.map(d => d.life_stage).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (dreams.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Dreams Yet</h1>
          <p className="text-gray-600 mb-6">Add some dreams to your matrix first.</p>
          <button
            onClick={() => router.push('/discover/dreams/categories')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
          >
            Go to Dream Matrix
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/discover/dreams/categories')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Matrix
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isPdfGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {isPdfGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download PDF
              </>
            )}
          </button>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="bg-white rounded-2xl shadow-xl p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dream Life Matrix</h1>
            <p className="text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">{totalDreams}</div>
              <div className="text-sm text-gray-600">Total Dreams</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600">{assignedDreams}</div>
              <div className="text-sm text-gray-600">Organized</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">{coveredAreas}/8</div>
              <div className="text-sm text-gray-600">Areas Covered</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <div className="text-3xl font-bold text-amber-600">{coveredStages}/6</div>
              <div className="text-sm text-gray-600">Life Stages</div>
            </div>
          </div>

          {/* AI Feedback */}
          <div className="mb-8 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">AI Coach Feedback</h3>
                  {feedbackLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating personalized feedback...
                    </div>
                  ) : isEditingFeedback ? (
                    <textarea
                      value={editedFeedback}
                      onChange={(e) => setEditedFeedback(e.target.value)}
                      className="w-full p-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-500"
                      rows={4}
                      autoFocus
                    />
                  ) : (
                    <p className="text-gray-700">{aiFeedback}</p>
                  )}
                </div>
              </div>
              {!feedbackLoading && (
                <div className="flex gap-2">
                  {isEditingFeedback ? (
                    <>
                      <button
                        onClick={saveFeedbackEdit}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelFeedbackEdit}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingFeedback(true)}
                      className="p-2 bg-white text-purple-600 rounded-lg hover:bg-purple-100 border border-purple-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dreams by Wellbeing Area */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Dreams by Wellbeing Area</h2>

            {dreamsByArea.map((area) => {
              const Icon = area.icon;
              const colorClasses = area.color.split(' ');

              return (
                <div key={area.id} className="border rounded-xl overflow-hidden">
                  <div className={`px-4 py-3 ${colorClasses[1]} border-b flex items-center gap-3`}>
                    <Icon className={`w-5 h-5 ${colorClasses[0]}`} />
                    <h3 className={`font-bold ${colorClasses[0]}`}>
                      {area.name} ({area.dreams.length})
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {area.dreams.map((dream) => (
                        <div key={dream.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{dream.title}</span>
                              {dream.life_stage && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                  {dream.life_stage}
                                </span>
                              )}
                            </div>
                            {dream.description && (
                              <p className="text-sm text-gray-600 mt-1">{dream.description}</p>
                            )}
                            {dream.why && (
                              <p className="text-xs text-gray-500 mt-1 italic">💡 {dream.why}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Matrix Overview Table */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Matrix Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-purple-50">
                    <th className="p-2 text-left font-semibold text-gray-700 border border-gray-200">Area</th>
                    {LIFE_STAGES.map(stage => (
                      <th key={stage} className="p-2 text-center font-semibold text-purple-700 border border-gray-200">
                        {stage}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WELLBEING_AREAS.map((area) => {
                    const Icon = area.icon;
                    return (
                      <tr key={area.id}>
                        <td className="p-2 border border-gray-200">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">{area.name}</span>
                          </div>
                        </td>
                        {LIFE_STAGES.map(stage => {
                          const cellDreams = dreams.filter(
                            d => d.wellbeing_area === area.id && d.life_stage === stage
                          );
                          return (
                            <td key={stage} className="p-2 border border-gray-200 text-center">
                              {cellDreams.length > 0 ? (
                                <div className="space-y-1">
                                  {cellDreams.map(dream => (
                                    <div
                                      key={dream.id}
                                      className="text-xs bg-purple-100 text-purple-800 rounded px-1 py-0.5 truncate"
                                      title={dream.title}
                                    >
                                      {dream.title.length > 15 ? dream.title.substring(0, 15) + '...' : dream.title}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-gray-400 text-sm">
            <p>Generated by Dream Life Matrix • WFED 119</p>
          </div>
        </div>
      </div>
    </div>
  );
}
