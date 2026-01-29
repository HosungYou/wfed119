'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Loader2,
  Save,
  Users,
  Tv,
  Palette,
  Quote,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { TableInput, TableColumn } from '@/components/life-themes/TableInput';
import {
  QUESTION_CONFIG,
  QuestionNumber,
  RoleModelEntry,
  MediaEntry,
  HobbyEntry,
  MottoEntry,
  SubjectsResponse,
  SubjectEntry,
  MemoriesData,
  ResponseData,
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
  const { language } = useTranslation();

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
        setResponseData([{ name: '', similarities: '', differences: '' }] as RoleModelEntry[]);
        break;
      case 2:
        setResponseData([{ name: '', why: '' }] as MediaEntry[]);
        break;
      case 3:
        setResponseData([{ hobby: '', why: '' }] as HobbyEntry[]);
        break;
      case 4:
        setResponseData([{ motto: '' }] as MottoEntry[]);
        break;
      case 5:
        setResponseData({ liked: [{ subject: '', reasons: '' }], disliked: [{ subject: '', reasons: '' }] } as SubjectsResponse);
        break;
      case 6:
        setResponseData({ memory1: '', memory2: '', memory3: '' } as MemoriesData);
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
        // Navigate to next question or findings
        if (questionNum < 6) {
          await updateStage(QUESTION_CONFIG[questionNum + 1 as QuestionNumber].step, (questionNum / 6) * 60);
          router.push(`/discover/life-themes/questions/${questionNum + 1}`);
        } else {
          await updateStage('findings', 60);
          router.push('/discover/life-themes/findings');
        }
      }
    } catch (err) {
      console.error('[Question] Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Table column configurations
  const roleModelColumns: TableColumn[] = [
    { key: 'name', label: 'Name', labelKo: '이름', type: 'text', placeholder: 'Name of person', placeholderKo: '롤모델 이름', width: 'w-1/4' },
    { key: 'similarities', label: 'Similarities', labelKo: '유사점', type: 'textarea', placeholder: 'How are you similar?', placeholderKo: '어떤 점이 비슷한가요?', width: 'flex-1' },
    { key: 'differences', label: 'Differences', labelKo: '차이점', type: 'textarea', placeholder: 'How are you different?', placeholderKo: '어떻게 다른가요?', width: 'flex-1' },
  ];

  const mediaColumns: TableColumn[] = [
    { key: 'name', label: 'Name', labelKo: '이름', type: 'text', placeholder: 'Book, show, channel name', placeholderKo: '책, 프로그램, 채널 이름', width: 'w-1/3' },
    { key: 'why', label: 'Why?', labelKo: '이유', type: 'textarea', placeholder: 'Why do you enjoy it?', placeholderKo: '왜 좋아하나요?', width: 'flex-1' },
  ];

  const hobbyColumns: TableColumn[] = [
    { key: 'hobby', label: 'Hobby', labelKo: '취미', type: 'text', placeholder: 'Activity name', placeholderKo: '활동 이름', width: 'w-1/3' },
    { key: 'why', label: 'Why?', labelKo: '이유', type: 'textarea', placeholder: 'What brings you joy?', placeholderKo: '어떤 점이 즐거운가요?', width: 'flex-1' },
  ];

  const subjectColumns: TableColumn[] = [
    { key: 'subject', label: 'Subject', labelKo: '과목', type: 'text', placeholder: 'Subject name', placeholderKo: '과목 이름', width: 'w-1/3' },
    { key: 'reasons', label: 'Reasons', labelKo: '이유', type: 'textarea', placeholder: 'Why?', placeholderKo: '이유', width: 'flex-1' },
  ];

  if (!isValidQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <p className="text-gray-600">Invalid question number</p>
          <button
            onClick={() => router.push('/discover/life-themes')}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  const getTitle = () => language === 'ko' ? config!.titleKo : config!.title;
  const getPrompt = () => language === 'ko' ? config!.promptKo : config!.prompt;
  const getSubPrompt = () => language === 'ko' ? config!.subPromptKo : config!.subPrompt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              {language === 'ko' ? `질문 ${questionNum} / 6` : `Question ${questionNum} of 6`}
            </span>
            <span className="text-sm text-gray-500">{Math.round((questionNum / 6) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
              style={{ width: `${(questionNum / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4 shadow-lg text-white">
            {QUESTION_ICONS[questionNum]}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">{getPrompt()}</p>
          <p className="text-sm text-gray-500 mt-2">{getSubPrompt()}</p>
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
            <TableInput<RoleModelEntry>
              columns={roleModelColumns}
              data={responseData as RoleModelEntry[]}
              onChange={(newData) => setResponseData(newData)}
              minRows={config!.minEntries}
              maxRows={config!.maxEntries}
              language={language}
              addButtonText="Add Another Role Model"
              addButtonTextKo="롤모델 추가"
              emptyRowTemplate={{ name: '', similarities: '', differences: '' }}
            />
          )}

          {/* Q2: Media */}
          {questionNum === 2 && responseData && (
            <TableInput<MediaEntry>
              columns={mediaColumns}
              data={responseData as MediaEntry[]}
              onChange={(newData) => setResponseData(newData)}
              minRows={config!.minEntries}
              maxRows={config!.maxEntries}
              language={language}
              addButtonText="Add Another Media"
              addButtonTextKo="미디어 추가"
              emptyRowTemplate={{ name: '', why: '' }}
            />
          )}

          {/* Q3: Hobbies */}
          {questionNum === 3 && responseData && (
            <TableInput<HobbyEntry>
              columns={hobbyColumns}
              data={responseData as HobbyEntry[]}
              onChange={(newData) => setResponseData(newData)}
              minRows={config!.minEntries}
              maxRows={config!.maxEntries}
              language={language}
              addButtonText="Add Another Hobby"
              addButtonTextKo="취미 추가"
              emptyRowTemplate={{ hobby: '', why: '' }}
            />
          )}

          {/* Q4: Mottos */}
          {questionNum === 4 && responseData && (
            <TableInput<MottoEntry>
              columns={[
                { key: 'motto', label: 'Motto / Quote', labelKo: '좌우명 / 명언', type: 'textarea', placeholder: 'Your favorite phrase or motto', placeholderKo: '좋아하는 문구나 좌우명', width: 'flex-1' }
              ]}
              data={responseData as MottoEntry[]}
              onChange={(newData) => setResponseData(newData)}
              minRows={config!.minEntries}
              maxRows={config!.maxEntries}
              language={language}
              addButtonText="Add Another Motto"
              addButtonTextKo="좌우명 추가"
              emptyRowTemplate={{ motto: '' }}
            />
          )}

          {/* Q5: Subjects */}
          {questionNum === 5 && responseData && (
            <div className="space-y-8">
              {/* Liked Subjects */}
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-4">
                  {language === 'ko' ? '좋아했던 과목' : 'Subjects You Liked'}
                </h3>
                <TableInput<SubjectEntry>
                  columns={subjectColumns}
                  data={(responseData as SubjectsResponse).liked}
                  onChange={(newData) => setResponseData({ ...(responseData as SubjectsResponse), liked: newData })}
                  minRows={1}
                  maxRows={6}
                  language={language}
                  addButtonText="Add Liked Subject"
                  addButtonTextKo="좋아한 과목 추가"
                  emptyRowTemplate={{ subject: '', reasons: '' }}
                />
              </div>

              {/* Disliked Subjects */}
              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-4">
                  {language === 'ko' ? '싫어했던 과목' : 'Subjects You Disliked'}
                </h3>
                <TableInput<SubjectEntry>
                  columns={subjectColumns}
                  data={(responseData as SubjectsResponse).disliked}
                  onChange={(newData) => setResponseData({ ...(responseData as SubjectsResponse), disliked: newData })}
                  minRows={0}
                  maxRows={6}
                  language={language}
                  addButtonText="Add Disliked Subject"
                  addButtonTextKo="싫어한 과목 추가"
                  emptyRowTemplate={{ subject: '', reasons: '' }}
                />
              </div>
            </div>
          )}

          {/* Q6: Memories */}
          {questionNum === 6 && responseData && (
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  {language === 'ko' ? '6.1 첫 번째 기억' : '6.1 First Memory'}
                </label>
                <textarea
                  value={(responseData as MemoriesData).memory1}
                  onChange={(e) => setResponseData({ ...(responseData as MemoriesData), memory1: e.target.value })}
                  placeholder={language === 'ko' ? '첫 번째 어린 시절 기억을 자세히 적어주세요...' : 'Describe your first early memory in detail...'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 h-32"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  {language === 'ko' ? '6.2 두 번째 기억' : '6.2 Second Memory'}
                </label>
                <textarea
                  value={(responseData as MemoriesData).memory2}
                  onChange={(e) => setResponseData({ ...(responseData as MemoriesData), memory2: e.target.value })}
                  placeholder={language === 'ko' ? '두 번째 어린 시절 기억을 자세히 적어주세요...' : 'Describe your second early memory in detail...'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 h-32"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  {language === 'ko' ? '6.3 세 번째 기억' : '6.3 Third Memory'}
                </label>
                <textarea
                  value={(responseData as MemoriesData).memory3}
                  onChange={(e) => setResponseData({ ...(responseData as MemoriesData), memory3: e.target.value })}
                  placeholder={language === 'ko' ? '세 번째 어린 시절 기억을 자세히 적어주세요...' : 'Describe your third early memory in detail...'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 h-32"
                />
              </div>
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
            {questionNum === 1
              ? (language === 'ko' ? '개요로 돌아가기' : 'Back to Overview')
              : (language === 'ko' ? '이전 질문' : 'Previous Question')
            }
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {language === 'ko' ? '진행상황 저장' : 'Save Progress'}
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {questionNum === 6
                ? (language === 'ko' ? '발견으로 계속' : 'Continue to Findings')
                : (language === 'ko' ? '다음 질문' : 'Next Question')
              }
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
