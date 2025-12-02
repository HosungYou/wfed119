'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Save,
  Users,
  Tv,
  Palette,
  Quote,
  BookOpen,
  Brain,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import {
  QUESTION_CONFIG,
  QuestionNumber,
  RoleModelEntry,
  MediaEntry,
  HobbyEntry,
  MottoEntry,
  SubjectsResponse,
  SubjectEntry,
  MemoryEntry,
  ResponseData,
  MEDIA_TYPES,
  getNextStep,
  getStepByQuestion,
} from '@/lib/types/lifeThemes';

const QUESTION_ICONS: Record<QuestionNumber, React.ReactNode> = {
  1: <Users className="w-8 h-8" />,
  2: <Tv className="w-8 h-8" />,
  3: <Palette className="w-8 h-8" />,
  4: <Quote className="w-8 h-8" />,
  5: <BookOpen className="w-8 h-8" />,
  6: <Brain className="w-8 h-8" />,
};

export default function QuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionNum = parseInt(params.question as string) as QuestionNumber;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<ResponseData | null>(null);

  const { updateStage } = useModuleProgress('life-themes');

  // Validate question number
  const isValidQuestion = questionNum >= 1 && questionNum <= 6;
  const config = isValidQuestion ? QUESTION_CONFIG[questionNum] : null;

  const fetchResponse = useCallback(async () => {
    if (!isValidQuestion) {
      setLoading(false);
      return;
    }

    try {
      // First ensure session exists
      let sessionRes = await fetch('/api/life-themes/session');
      let sessionData = sessionRes.ok ? await sessionRes.json() : null;

      if (!sessionData?.id) {
        // Create new session
        sessionRes = await fetch('/api/life-themes/session', { method: 'POST' });
        sessionData = sessionRes.ok ? await sessionRes.json() : null;
      }

      // Fetch existing response for this question
      const res = await fetch(`/api/life-themes/responses?question=${questionNum}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.response_data) {
          setResponseData(data.response_data);
        } else {
          // Initialize with empty data
          initializeEmptyData();
        }
      } else {
        initializeEmptyData();
      }

      setLoading(false);
    } catch (err) {
      console.error('[Question] Error:', err);
      setError('Failed to load response');
      setLoading(false);
    }
  }, [questionNum, isValidQuestion]);

  const initializeEmptyData = () => {
    switch (questionNum) {
      case 1:
        setResponseData([{ name: '', description: '', similarities: '', differences: '' }] as RoleModelEntry[]);
        break;
      case 2:
        setResponseData([{ name: '', type: 'book', reasons: '' }] as MediaEntry[]);
        break;
      case 3:
        setResponseData([{ hobby: '', enjoyment_reasons: '' }] as HobbyEntry[]);
        break;
      case 4:
        setResponseData([{ motto: '', source: '', meaning: '' }] as MottoEntry[]);
        break;
      case 5:
        setResponseData({ liked: [{ subject: '', reasons: '' }], disliked: [] } as SubjectsResponse);
        break;
      case 6:
        setResponseData([{ title: '', content: '', feelings: '', age_range: '3-6' }] as MemoryEntry[]);
        break;
    }
  };

  useEffect(() => {
    fetchResponse();
  }, [fetchResponse]);

  const handleSave = async (proceed: boolean = false) => {
    if (!responseData || !config) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/life-themes/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_number: questionNum,
          response_data: responseData,
          is_completed: proceed,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save response');
      }

      if (proceed) {
        // Navigate to next question or patterns
        if (questionNum < 6) {
          await updateStage(QUESTION_CONFIG[questionNum + 1 as QuestionNumber].step, (questionNum / 6) * 60);
          router.push(`/discover/life-themes/questions/${questionNum + 1}`);
        } else {
          await updateStage('patterns', 60);
          router.push('/discover/life-themes/patterns');
        }
      }
    } catch (err) {
      console.error('[Question] Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Type-specific handlers
  const addEntry = () => {
    if (!responseData) return;

    switch (questionNum) {
      case 1:
        setResponseData([...(responseData as RoleModelEntry[]), { name: '', description: '', similarities: '', differences: '' }]);
        break;
      case 2:
        setResponseData([...(responseData as MediaEntry[]), { name: '', type: 'book', reasons: '' }]);
        break;
      case 3:
        setResponseData([...(responseData as HobbyEntry[]), { hobby: '', enjoyment_reasons: '' }]);
        break;
      case 4:
        setResponseData([...(responseData as MottoEntry[]), { motto: '', source: '', meaning: '' }]);
        break;
      case 6:
        setResponseData([...(responseData as MemoryEntry[]), { title: '', content: '', feelings: '', age_range: '3-6' }]);
        break;
    }
  };

  const removeEntry = (index: number) => {
    if (!responseData || !Array.isArray(responseData)) return;
    setResponseData(responseData.filter((_, i) => i !== index));
  };

  const updateEntry = <T extends Record<string, unknown>>(index: number, field: keyof T, value: unknown) => {
    if (!responseData) return;

    if (questionNum === 5) {
      // Handle subjects differently
      return;
    }

    const newData = [...(responseData as T[])];
    newData[index] = { ...newData[index], [field]: value };
    setResponseData(newData as ResponseData);
  };

  // Question 5 specific handlers
  const addSubject = (type: 'liked' | 'disliked') => {
    if (questionNum !== 5 || !responseData) return;
    const data = responseData as SubjectsResponse;
    setResponseData({
      ...data,
      [type]: [...data[type], { subject: '', reasons: '' }],
    });
  };

  const removeSubject = (type: 'liked' | 'disliked', index: number) => {
    if (questionNum !== 5 || !responseData) return;
    const data = responseData as SubjectsResponse;
    setResponseData({
      ...data,
      [type]: data[type].filter((_, i) => i !== index),
    });
  };

  const updateSubject = (type: 'liked' | 'disliked', index: number, field: keyof SubjectEntry, value: string) => {
    if (questionNum !== 5 || !responseData) return;
    const data = responseData as SubjectsResponse;
    const newList = [...data[type]];
    newList[index] = { ...newList[index], [field]: value };
    setResponseData({ ...data, [type]: newList });
  };

  if (!isValidQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <p className="text-gray-600">Invalid question number</p>
          <button
            onClick={() => router.push('/discover/life-themes')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Question {questionNum} of 6</span>
            <span className="text-sm text-gray-500">{Math.round((questionNum / 6) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
              style={{ width: `${(questionNum / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg text-white">
            {QUESTION_ICONS[questionNum]}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{config!.title}</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">{config!.prompt}</p>
          <p className="text-sm text-gray-500 mt-2">{config!.subPrompt}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-5 h-5" /></button>
          </div>
        )}

        {/* Question-Specific Forms */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Q1: Role Models */}
          {questionNum === 1 && responseData && (
            <div className="space-y-6">
              {(responseData as RoleModelEntry[]).map((entry, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Role Model {idx + 1}</h3>
                    {idx > 0 && (
                      <button onClick={() => removeEntry(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Name of the person you admire"
                    value={entry.name}
                    onChange={(e) => updateEntry<RoleModelEntry>(idx, 'name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    placeholder="Who are they? What makes them admirable?"
                    value={entry.description}
                    onChange={(e) => updateEntry<RoleModelEntry>(idx, 'description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-24"
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <textarea
                      placeholder="How are you similar to them?"
                      value={entry.similarities}
                      onChange={(e) => updateEntry<RoleModelEntry>(idx, 'similarities', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-20"
                    />
                    <textarea
                      placeholder="How are you different from them?"
                      value={entry.differences}
                      onChange={(e) => updateEntry<RoleModelEntry>(idx, 'differences', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-20"
                    />
                  </div>
                </div>
              ))}
              {(responseData as RoleModelEntry[]).length < config!.maxEntries && (
                <button
                  onClick={addEntry}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Another Role Model
                </button>
              )}
            </div>
          )}

          {/* Q2: Media */}
          {questionNum === 2 && responseData && (
            <div className="space-y-6">
              {(responseData as MediaEntry[]).map((entry, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Media {idx + 1}</h3>
                    {idx > 0 && (
                      <button onClick={() => removeEntry(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Name of book, show, channel, etc."
                      value={entry.name}
                      onChange={(e) => updateEntry<MediaEntry>(idx, 'name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={entry.type}
                      onChange={(e) => updateEntry<MediaEntry>(idx, 'type', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      {MEDIA_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    placeholder="Why do you enjoy this? What draws you to it?"
                    value={entry.reasons}
                    onChange={(e) => updateEntry<MediaEntry>(idx, 'reasons', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-24"
                  />
                </div>
              ))}
              {(responseData as MediaEntry[]).length < config!.maxEntries && (
                <button
                  onClick={addEntry}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Another Media
                </button>
              )}
            </div>
          )}

          {/* Q3: Hobbies */}
          {questionNum === 3 && responseData && (
            <div className="space-y-6">
              {(responseData as HobbyEntry[]).map((entry, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Hobby {idx + 1}</h3>
                    {idx > 0 && (
                      <button onClick={() => removeEntry(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="What is the hobby or activity?"
                    value={entry.hobby}
                    onChange={(e) => updateEntry<HobbyEntry>(idx, 'hobby', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    placeholder="What aspects bring you joy? Why do you enjoy it?"
                    value={entry.enjoyment_reasons}
                    onChange={(e) => updateEntry<HobbyEntry>(idx, 'enjoyment_reasons', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-24"
                  />
                </div>
              ))}
              {(responseData as HobbyEntry[]).length < config!.maxEntries && (
                <button
                  onClick={addEntry}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Another Hobby
                </button>
              )}
            </div>
          )}

          {/* Q4: Mottos */}
          {questionNum === 4 && responseData && (
            <div className="space-y-6">
              {(responseData as MottoEntry[]).map((entry, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Motto {idx + 1}</h3>
                    {idx > 0 && (
                      <button onClick={() => removeEntry(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    placeholder="The quote, phrase, or motto that resonates with you"
                    value={entry.motto}
                    onChange={(e) => updateEntry<MottoEntry>(idx, 'motto', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-20"
                  />
                  <input
                    type="text"
                    placeholder="Source (optional) - where did you hear/read this?"
                    value={entry.source || ''}
                    onChange={(e) => updateEntry<MottoEntry>(idx, 'source', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    placeholder="Why does this resonate with you? What does it mean to you?"
                    value={entry.meaning}
                    onChange={(e) => updateEntry<MottoEntry>(idx, 'meaning', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-24"
                  />
                </div>
              ))}
              {(responseData as MottoEntry[]).length < config!.maxEntries && (
                <button
                  onClick={addEntry}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Another Motto
                </button>
              )}
            </div>
          )}

          {/* Q5: Subjects */}
          {questionNum === 5 && responseData && (
            <div className="space-y-8">
              {/* Liked Subjects */}
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-4">Subjects You Liked</h3>
                <div className="space-y-4">
                  {(responseData as SubjectsResponse).liked.map((entry, idx) => (
                    <div key={idx} className="p-4 border border-green-200 bg-green-50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Liked Subject {idx + 1}</span>
                        {idx > 0 && (
                          <button onClick={() => removeSubject('liked', idx)} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Subject name"
                        value={entry.subject}
                        onChange={(e) => updateSubject('liked', idx, 'subject', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                      />
                      <textarea
                        placeholder="Why did you like this subject?"
                        value={entry.reasons}
                        onChange={(e) => updateSubject('liked', idx, 'reasons', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 h-20"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addSubject('liked')}
                    className="w-full p-3 border-2 border-dashed border-green-300 rounded-xl text-green-600 hover:bg-green-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add Liked Subject
                  </button>
                </div>
              </div>

              {/* Disliked Subjects */}
              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-4">Subjects You Disliked</h3>
                <div className="space-y-4">
                  {(responseData as SubjectsResponse).disliked.map((entry, idx) => (
                    <div key={idx} className="p-4 border border-red-200 bg-red-50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-red-700">Disliked Subject {idx + 1}</span>
                        <button onClick={() => removeSubject('disliked', idx)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Subject name"
                        value={entry.subject}
                        onChange={(e) => updateSubject('disliked', idx, 'subject', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500"
                      />
                      <textarea
                        placeholder="Why didn't you like this subject?"
                        value={entry.reasons}
                        onChange={(e) => updateSubject('disliked', idx, 'reasons', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 h-20"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addSubject('disliked')}
                    className="w-full p-3 border-2 border-dashed border-red-300 rounded-xl text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add Disliked Subject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Q6: Memories */}
          {questionNum === 6 && responseData && (
            <div className="space-y-6">
              {(responseData as MemoryEntry[]).map((entry, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Memory {idx + 1}</h3>
                    {idx > 0 && (
                      <button onClick={() => removeEntry(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Give this memory a title"
                      value={entry.title}
                      onChange={(e) => updateEntry<MemoryEntry>(idx, 'title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={entry.age_range}
                      onChange={(e) => updateEntry<MemoryEntry>(idx, 'age_range', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="3-6">Ages 3-6</option>
                      <option value="younger">Younger than 3</option>
                      <option value="older">Older than 6</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Describe the memory in detail. What happened?"
                    value={entry.content}
                    onChange={(e) => updateEntry<MemoryEntry>(idx, 'content', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-32"
                  />
                  <textarea
                    placeholder="What feelings do you remember having? How did you feel?"
                    value={entry.feelings}
                    onChange={(e) => updateEntry<MemoryEntry>(idx, 'feelings', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-20"
                  />
                </div>
              ))}
              {(responseData as MemoryEntry[]).length < config!.maxEntries && (
                <button
                  onClick={addEntry}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Another Memory
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              if (questionNum === 1) {
                router.push('/discover/life-themes');
              } else {
                router.push(`/discover/life-themes/questions/${questionNum - 1}`);
              }
            }}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            {questionNum === 1 ? 'Back to Overview' : 'Previous Question'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Progress
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {questionNum === 6 ? 'Continue to Patterns' : 'Next Question'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
