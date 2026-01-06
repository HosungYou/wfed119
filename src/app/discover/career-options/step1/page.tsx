'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

// Holland RIASEC Questions (30 questions, 5 per type)
const HOLLAND_QUESTIONS = [
  // R - Realistic
  { id: 'R1', type: 'R', text: 'I like to work with tools and machines.', textKo: '도구와 기계로 작업하는 것을 좋아합니다.' },
  { id: 'R2', type: 'R', text: 'I enjoy building or fixing things.', textKo: '물건을 만들거나 고치는 것을 즐깁니다.' },
  { id: 'R3', type: 'R', text: 'I prefer hands-on activities over reading.', textKo: '읽기보다 직접 체험하는 활동을 선호합니다.' },
  { id: 'R4', type: 'R', text: 'I like working outdoors.', textKo: '야외에서 일하는 것을 좋아합니다.' },
  { id: 'R5', type: 'R', text: 'I am good at physical tasks.', textKo: '육체적인 작업을 잘합니다.' },
  // I - Investigative
  { id: 'I1', type: 'I', text: 'I enjoy solving complex problems.', textKo: '복잡한 문제를 해결하는 것을 즐깁니다.' },
  { id: 'I2', type: 'I', text: 'I like to analyze data and find patterns.', textKo: '데이터를 분석하고 패턴을 찾는 것을 좋아합니다.' },
  { id: 'I3', type: 'I', text: 'I am curious about how things work.', textKo: '사물이 어떻게 작동하는지 궁금합니다.' },
  { id: 'I4', type: 'I', text: 'I enjoy conducting research.', textKo: '연구를 수행하는 것을 즐깁니다.' },
  { id: 'I5', type: 'I', text: 'I prefer to think before acting.', textKo: '행동하기 전에 생각하는 것을 선호합니다.' },
  // A - Artistic
  { id: 'A1', type: 'A', text: 'I enjoy creative activities like art or music.', textKo: '예술이나 음악 같은 창의적 활동을 즐깁니다.' },
  { id: 'A2', type: 'A', text: 'I like to express myself through writing or design.', textKo: '글쓰기나 디자인을 통해 자신을 표현하는 것을 좋아합니다.' },
  { id: 'A3', type: 'A', text: 'I prefer work that allows originality.', textKo: '독창성을 발휘할 수 있는 일을 선호합니다.' },
  { id: 'A4', type: 'A', text: 'I have a good imagination.', textKo: '상상력이 풍부합니다.' },
  { id: 'A5', type: 'A', text: 'I appreciate beauty and aesthetics.', textKo: '아름다움과 미학을 중시합니다.' },
  // S - Social
  { id: 'S1', type: 'S', text: 'I enjoy helping and teaching others.', textKo: '다른 사람을 돕고 가르치는 것을 즐깁니다.' },
  { id: 'S2', type: 'S', text: 'I am good at understanding others\' feelings.', textKo: '다른 사람의 감정을 잘 이해합니다.' },
  { id: 'S3', type: 'S', text: 'I prefer working with people over things.', textKo: '사물보다 사람과 일하는 것을 선호합니다.' },
  { id: 'S4', type: 'S', text: 'I like teamwork and collaboration.', textKo: '팀워크와 협업을 좋아합니다.' },
  { id: 'S5', type: 'S', text: 'I am patient when explaining things.', textKo: '설명할 때 인내심이 있습니다.' },
  // E - Enterprising
  { id: 'E1', type: 'E', text: 'I enjoy leading and managing others.', textKo: '다른 사람을 이끌고 관리하는 것을 즐깁니다.' },
  { id: 'E2', type: 'E', text: 'I like to persuade and influence people.', textKo: '사람들을 설득하고 영향력을 미치는 것을 좋아합니다.' },
  { id: 'E3', type: 'E', text: 'I am comfortable taking risks.', textKo: '위험을 감수하는 것이 편합니다.' },
  { id: 'E4', type: 'E', text: 'I prefer competitive environments.', textKo: '경쟁적인 환경을 선호합니다.' },
  { id: 'E5', type: 'E', text: 'I have good public speaking skills.', textKo: '대중 앞에서 말하는 능력이 있습니다.' },
  // C - Conventional
  { id: 'C1', type: 'C', text: 'I enjoy organizing and planning.', textKo: '정리하고 계획하는 것을 즐깁니다.' },
  { id: 'C2', type: 'C', text: 'I prefer structured work environments.', textKo: '체계적인 업무 환경을 선호합니다.' },
  { id: 'C3', type: 'C', text: 'I am detail-oriented and accurate.', textKo: '세부 사항에 주의를 기울이고 정확합니다.' },
  { id: 'C4', type: 'C', text: 'I like working with numbers and data.', textKo: '숫자와 데이터로 작업하는 것을 좋아합니다.' },
  { id: 'C5', type: 'C', text: 'I follow rules and procedures well.', textKo: '규칙과 절차를 잘 따릅니다.' },
];

const STEPS = [
  { id: 'step1', label: 'Holland Assessment', labelKo: 'Holland 적성 검사' },
  { id: 'step2', label: 'AI Career Suggestions', labelKo: 'AI 경력 추천' },
  { id: 'step3', label: 'Career Research', labelKo: '경력 조사' },
  { id: 'step4', label: 'Career Comparison', labelKo: '경력 비교' },
];

const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree', labelKo: '매우 아님' },
  { value: 2, label: 'Disagree', labelKo: '아님' },
  { value: 3, label: 'Neutral', labelKo: '보통' },
  { value: 4, label: 'Agree', labelKo: '그렇다' },
  { value: 5, label: 'Strongly Agree', labelKo: '매우 그렇다' },
];

type HollandType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export default function CareerOptionsStep1() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);

  const questionsPerPage = 6;
  const totalPages = Math.ceil(HOLLAND_QUESTIONS.length / questionsPerPage);
  const currentQuestions = HOLLAND_QUESTIONS.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/career-options/session');
      const data = await res.json();

      if (data.holland_responses && Object.keys(data.holland_responses).length > 0) {
        setResponses(data.holland_responses);
      }

      setLoading(false);
    } catch (error) {
      console.error('[Career Step 1] Error:', error);
      setLoading(false);
    }
  }

  function handleResponse(questionId: string, value: number) {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  }

  function calculateScores(): Record<HollandType, number> {
    const scores: Record<HollandType, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    HOLLAND_QUESTIONS.forEach(q => {
      const response = responses[q.id];
      if (response) {
        scores[q.type as HollandType] += response;
      }
    });

    // Normalize to 0-100 scale (max is 25 per type: 5 questions × 5 max)
    Object.keys(scores).forEach(type => {
      scores[type as HollandType] = Math.round((scores[type as HollandType] / 25) * 100);
    });

    return scores;
  }

  function getHollandCode(scores: Record<HollandType, number>): string {
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
    return sorted.join('');
  }

  async function handleNext() {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
      return;
    }

    // Check if all questions answered
    const answered = Object.keys(responses).length;
    if (answered < HOLLAND_QUESTIONS.length) {
      alert(language === 'ko'
        ? '모든 질문에 답해주세요.'
        : 'Please answer all questions.');
      return;
    }

    setSaving(true);
    try {
      const scores = calculateScores();
      const code = getHollandCode(scores);

      await fetch('/api/discover/career-options/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 2,
          holland_responses: responses,
          holland_scores: scores,
          holland_code: code,
        }),
      });

      router.push('/discover/career-options/step2');
    } catch (error) {
      console.error('[Career Step 1] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  function handlePrevPage() {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    } else {
      router.push('/discover/career-options');
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/career-options', 1, []);
  const answeredCount = Object.keys(responses).length;
  const progress = Math.round((answeredCount / HOLLAND_QUESTIONS.length) * 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <ModuleShell
      moduleId="career-options"
      currentStep={1}
      totalSteps={4}
      title={language === 'ko' ? 'Holland 적성 검사' : 'Holland Assessment'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Progress */}
        <ModuleCard padding="normal">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {language === 'ko' ? 'RIASEC 직업 흥미 검사' : 'RIASEC Career Interest Inventory'}
            </h2>
            <span className="text-sm text-gray-500">
              {answeredCount}/{HOLLAND_QUESTIONS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {language === 'ko'
              ? '각 문장이 자신에게 얼마나 해당되는지 표시해주세요.'
              : 'Indicate how much each statement describes you.'}
          </p>
        </ModuleCard>

        {/* Questions */}
        <div className="space-y-4">
          {currentQuestions.map((q, index) => {
            const isAnswered = responses[q.id] !== undefined;

            return (
              <ModuleCard
                key={q.id}
                padding="normal"
                className={isAnswered ? 'border-indigo-200 bg-indigo-50' : ''}
              >
                <div className="flex items-start gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isAnswered ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isAnswered ? <CheckCircle className="w-5 h-5" /> : currentPage * questionsPerPage + index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-4">
                      {language === 'ko' ? q.textKo : q.text}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {LIKERT_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleResponse(q.id, option.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            responses[q.id] === option.value
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {language === 'ko' ? option.labelKo : option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ModuleCard>
            );
          })}
        </div>

        {/* Page Navigation */}
        <div className="flex items-center justify-between">
          <ModuleButton onClick={handlePrevPage} variant="secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentPage === 0 ? (language === 'ko' ? '뒤로' : 'Back') : (language === 'ko' ? '이전' : 'Previous')}
          </ModuleButton>

          <span className="text-sm text-gray-500">
            {language === 'ko' ? `${currentPage + 1} / ${totalPages} 페이지` : `Page ${currentPage + 1} of ${totalPages}`}
          </span>

          <ModuleButton
            onClick={handleNext}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {currentPage < totalPages - 1
              ? (language === 'ko' ? '다음' : 'Next')
              : (language === 'ko' ? '결과 보기' : 'See Results')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
