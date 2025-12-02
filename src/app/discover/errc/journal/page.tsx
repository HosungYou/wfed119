'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  X,
  Calendar,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { ErrcReflection } from '@/lib/types/errc';

const REFLECTION_PROMPTS = [
  "What progress have you made this week on your ERRC goals?",
  "What challenges did you face and how did you overcome them?",
  "What surprised you about your behavior change journey?",
  "How has your wellbeing changed since starting this plan?",
  "What would you do differently next week?",
  "What are you most proud of accomplishing?",
  "Who or what has supported your progress?",
  "What habits are becoming easier to maintain?",
];

export default function ERRCJournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reflections, setReflections] = useState<ErrcReflection[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood_rating: 5,
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { updateStage } = useModuleProgress('errc');

  const fetchReflections = useCallback(async () => {
    try {
      const res = await fetch('/api/errc/reflections');
      if (res.ok) {
        const data = await res.json();
        setReflections(data || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('[ERRC Journal] Error:', err);
      setError('Failed to load reflections');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReflections();
  }, [fetchReflections]);

  const handleSave = async () => {
    if (!formData.content.trim()) {
      setError('Please write some reflection content');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/errc/reflections?id=${editingId}` : '/api/errc/reflections';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim() || `Reflection - ${new Date().toLocaleDateString()}`,
          content: formData.content.trim(),
          mood_rating: formData.mood_rating,
          tags: formData.tags.length > 0 ? formData.tags : null,
        }),
      });

      if (res.ok) {
        await fetchReflections();
        setIsEditing(false);
        setEditingId(null);
        setFormData({ title: '', content: '', mood_rating: 5, tags: [] });
      }
    } catch (err) {
      console.error('[ERRC Journal] Save error:', err);
      setError('Failed to save reflection');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reflection: ErrcReflection) => {
    setEditingId(reflection.id);
    setFormData({
      title: reflection.title || '',
      content: reflection.content,
      mood_rating: reflection.mood_rating || 5,
      tags: reflection.tags || [],
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reflection?')) return;

    try {
      const res = await fetch(`/api/errc/reflections?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchReflections();
      }
    } catch (err) {
      console.error('[ERRC Journal] Delete error:', err);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleUsePrompt = (prompt: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${prompt}\n` : `${prompt}\n`,
    }));
  };

  const handleContinue = async () => {
    try {
      await fetch('/api/errc/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_step: 'wellbeing_after' }),
      });
      await updateStage('wellbeing_after', 85);
      router.push('/discover/errc/wellbeing?mode=after');
    } catch (err) {
      console.error('[ERRC Journal] Continue error:', err);
    }
  };

  const getMoodEmoji = (rating: number) => {
    if (rating <= 2) return { emoji: '😔', label: 'Struggling' };
    if (rating <= 4) return { emoji: '😐', label: 'Neutral' };
    if (rating <= 6) return { emoji: '🙂', label: 'Good' };
    if (rating <= 8) return { emoji: '😊', label: 'Great' };
    return { emoji: '🌟', label: 'Excellent' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reflection Journal</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Document your journey, insights, and progress
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* New Reflection Button */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full mb-8 p-6 bg-white rounded-2xl shadow-xl border-2 border-dashed border-rose-200 hover:border-rose-400 transition-colors flex items-center justify-center gap-3 text-rose-600 hover:text-rose-700"
          >
            <Plus className="w-6 h-6" />
            <span className="font-semibold text-lg">Write New Reflection</span>
          </button>
        )}

        {/* Editor */}
        {isEditing && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Reflection' : 'New Reflection'}
              </h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormData({ title: '', content: '', mood_rating: 5, tags: [] });
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Week 1 Progress"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              {/* Mood Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How are you feeling? {getMoodEmoji(formData.mood_rating).emoji}
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.mood_rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, mood_rating: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">10</span>
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                    {getMoodEmoji(formData.mood_rating).label}
                  </span>
                </div>
              </div>

              {/* Prompts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Reflection Prompts
                </label>
                <div className="flex flex-wrap gap-2">
                  {REFLECTION_PROMPTS.slice(0, 4).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUsePrompt(prompt)}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition-colors"
                    >
                      {prompt.slice(0, 40)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Reflection
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your thoughts, insights, and reflections here..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none h-48"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (optional)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add a tag..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditingId(null);
                    setFormData({ title: '', content: '', mood_rating: 5, tags: [] });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.content.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Save Reflection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reflections List */}
        <div className="space-y-4 mb-8">
          {reflections.length === 0 && !isEditing ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reflections yet. Start documenting your journey!</p>
            </div>
          ) : (
            reflections.map(reflection => (
              <div
                key={reflection.id}
                className="bg-white rounded-2xl shadow-xl p-6 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {reflection.title || 'Reflection'}
                      {reflection.mood_rating && (
                        <span className="text-lg">
                          {getMoodEmoji(reflection.mood_rating).emoji}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(reflection.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(reflection)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(reflection.id)}
                      className="p-2 hover:bg-red-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 whitespace-pre-wrap mb-4">
                  {reflection.content}
                </p>

                {reflection.tags && reflection.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reflection.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/discover/errc/progress')}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Progress
          </button>

          <button
            onClick={handleContinue}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Continue to Final Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
