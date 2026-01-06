'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle, Trophy, Medal, Award } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface ExploredCareer {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  requirements: string;
  notes: string;
  interestLevel: number;
}

interface ComparisonCriterion {
  id: string;
  name: string;
  nameKo: string;
  weight: number;
}

const DEFAULT_CRITERIA: ComparisonCriterion[] = [
  { id: 'interest', name: 'Interest Level', nameKo: '관심도', weight: 20 },
  { id: 'values', name: 'Values Alignment', nameKo: '가치 일치', weight: 20 },
  { id: 'skills', name: 'Skills Match', nameKo: '기술 적합성', weight: 15 },
  { id: 'growth', name: 'Growth Potential', nameKo: '성장 가능성', weight: 15 },
  { id: 'worklife', name: 'Work-Life Balance', nameKo: '일-삶 균형', weight: 15 },
  { id: 'salary', name: 'Salary Potential', nameKo: '급여 전망', weight: 15 },
];

const STEPS = [
  { id: 'step1', label: 'Holland Assessment', labelKo: 'Holland 적성 검사' },
  { id: 'step2', label: 'AI Career Suggestions', labelKo: 'AI 경력 추천' },
  { id: 'step3', label: 'Career Research', labelKo: '경력 조사' },
  { id: 'step4', label: 'Career Comparison', labelKo: '경력 비교' },
];

export default function CareerOptionsStep4() {
  const router = useRouter();
  const { language } = useLanguage();
  const { completeModule } = useModuleProgress('career-options');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [careers, setCareers] = useState<ExploredCareer[]>([]);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});
  const [topChoices, setTopChoices] = useState<Array<{ rank: number; title: string; reason: string }>>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/career-options/session');
      const data = await res.json();

      if (data.current_step < 4) {
        router.push(`/discover/career-options/step${data.current_step}`);
        return;
      }

      setSession(data);
      setCareers(data.explored_careers || []);

      if (data.comparison_matrix?.ratings) {
        setRatings(data.comparison_matrix.ratings);
      } else {
        // Initialize ratings
        const initialRatings: Record<string, Record<string, number>> = {};
        data.explored_careers?.forEach((career: ExploredCareer) => {
          initialRatings[career.title] = {};
          DEFAULT_CRITERIA.forEach(criterion => {
            initialRatings[career.title][criterion.id] = 0;
          });
        });
        setRatings(initialRatings);
      }

      if (data.top_career_choices && data.top_career_choices.length > 0) {
        setTopChoices(data.top_career_choices);
      }

      setIsCompleted(data.status === 'completed');
      setLoading(false);
    } catch (error) {
      console.error('[Career Step 4] Error:', error);
      setLoading(false);
    }
  }

  function updateRating(careerTitle: string, criterionId: string, value: number) {
    setRatings(prev => ({
      ...prev,
      [careerTitle]: {
        ...prev[careerTitle],
        [criterionId]: value,
      },
    }));
  }

  function calculateScore(careerTitle: string): number {
    const careerRatings = ratings[careerTitle] || {};
    let totalScore = 0;
    let totalWeight = 0;

    DEFAULT_CRITERIA.forEach(criterion => {
      const rating = careerRatings[criterion.id] || 0;
      totalScore += rating * criterion.weight;
      totalWeight += criterion.weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight * 10) : 0;
  }

  function getRankedCareers() {
    return [...careers]
      .map(c => ({ ...c, score: calculateScore(c.title) }))
      .sort((a, b) => b.score - a.score);
  }

  function updateTopChoice(rank: number, field: 'title' | 'reason', value: string) {
    setTopChoices(prev => {
      const updated = [...prev];
      const existing = updated.find(c => c.rank === rank);
      if (existing) {
        existing[field] = value;
      } else {
        updated.push({ rank, title: field === 'title' ? value : '', reason: field === 'reason' ? value : '' });
      }
      return updated.sort((a, b) => a.rank - b.rank);
    });
  }

  async function handleComplete() {
    if (topChoices.length < 1 || !topChoices[0]?.title) {
      alert(language === 'ko'
        ? '최소 1순위 경력을 선택해주세요.'
        : 'Please select at least your top career choice.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/career-options/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          comparison_matrix: {
            criteria: DEFAULT_CRITERIA,
            ratings,
          },
          top_career_choices: topChoices,
        }),
      });

      await completeModule();
      setIsCompleted(true);
    } catch (error) {
      console.error('[Career Step 4] Complete error:', error);
      alert(language === 'ko' ? '완료 실패' : 'Completion failed');
    } finally {
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/career-options', 4, [1, 2, 3]);
  const rankedCareers = getRankedCareers();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Completion Screen
  if (isCompleted) {
    return (
      <ModuleShell moduleId="career-options" showProgress={false}>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'ko' ? '경력 탐색 완료!' : 'Career Exploration Complete!'}
          </h1>

          <p className="text-gray-600 mb-8">
            {language === 'ko'
              ? '축하합니다! 경력 탐색 모듈을 완료했습니다.'
              : 'Congratulations! You have completed the career exploration module.'}
          </p>

          {/* Top Choices */}
          <ModuleCard padding="large" className="mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              {language === 'ko' ? '최종 선택' : 'Your Top Choices'}
            </h2>
            <div className="space-y-4">
              {topChoices.slice(0, 3).map((choice, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                    index === 1 ? 'bg-gray-100 border border-gray-200' :
                    'bg-orange-50 border border-orange-200'
                  }`}
                >
                  {index === 0 ? <Trophy className="w-6 h-6 text-yellow-500" /> :
                   index === 1 ? <Medal className="w-6 h-6 text-gray-400" /> :
                   <Award className="w-6 h-6 text-orange-400" />}
                  <div>
                    <p className="font-semibold text-gray-900">{choice.title}</p>
                    {choice.reason && (
                      <p className="text-sm text-gray-600">{choice.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ModuleCard>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ModuleButton onClick={() => router.push('/dashboard')}>
              {language === 'ko' ? '대시보드로 이동' : 'Go to Dashboard'}
            </ModuleButton>
            <ModuleButton
              onClick={() => router.push('/discover/swot')}
              variant="secondary"
            >
              {language === 'ko' ? '다음 모듈: SWOT 분석' : 'Next: SWOT Analysis'}
            </ModuleButton>
          </div>
        </div>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell
      moduleId="career-options"
      currentStep={4}
      totalSteps={4}
      title={language === 'ko' ? '경력 비교' : 'Career Comparison'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Instructions */}
        <ModuleCard padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'ko' ? '의사결정 매트릭스' : 'Decision Matrix'}
          </h2>
          <p className="text-sm text-gray-600">
            {language === 'ko'
              ? '각 경력을 기준별로 1-10점으로 평가하세요. 점수가 높을수록 좋습니다.'
              : 'Rate each career from 1-10 on each criterion. Higher is better.'}
          </p>
        </ModuleCard>

        {/* Comparison Matrix */}
        <div className="overflow-x-auto">
          <ModuleCard padding="none">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-40">
                    {language === 'ko' ? '기준' : 'Criterion'}
                  </th>
                  {careers.map(career => (
                    <th key={career.title} className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      {career.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEFAULT_CRITERIA.map(criterion => (
                  <tr key={criterion.id} className="border-b">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>
                        {language === 'ko' ? criterion.nameKo : criterion.name}
                        <span className="text-xs text-gray-400 ml-1">({criterion.weight}%)</span>
                      </div>
                    </td>
                    {careers.map(career => (
                      <td key={career.title} className="px-4 py-3 text-center">
                        <select
                          value={ratings[career.title]?.[criterion.id] || 0}
                          onChange={(e) => updateRating(career.title, criterion.id, Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-indigo-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-indigo-800">
                    {language === 'ko' ? '총점' : 'Total Score'}
                  </td>
                  {careers.map(career => (
                    <td key={career.title} className="px-4 py-3 text-center text-indigo-700 text-lg">
                      {calculateScore(career.title)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </ModuleCard>
        </div>

        {/* Rankings */}
        <ModuleCard padding="normal">
          <h3 className="font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '점수 기반 순위' : 'Score-Based Rankings'}
          </h3>
          <div className="space-y-2">
            {rankedCareers.map((career, index) => (
              <div
                key={career.title}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                  index === 1 ? 'bg-gray-100' :
                  index === 2 ? 'bg-orange-50' :
                  'bg-gray-50'
                }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-orange-300 text-orange-900' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </span>
                <span className="flex-1 font-medium text-gray-900">{career.title}</span>
                <span className="text-indigo-600 font-semibold">{career.score}</span>
              </div>
            ))}
          </div>
        </ModuleCard>

        {/* Final Selection */}
        <ModuleCard padding="normal">
          <h3 className="font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '최종 선택' : 'Your Final Selection'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {language === 'ko'
              ? '점수와 직감을 고려하여 최종 순위를 결정하세요.'
              : 'Consider scores and your gut feeling to make your final ranking.'}
          </p>

          <div className="space-y-4">
            {[1, 2, 3].map(rank => (
              <div key={rank} className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                  rank === 2 ? 'bg-gray-100 text-gray-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {rank === 1 ? <Trophy className="w-5 h-5" /> :
                   rank === 2 ? <Medal className="w-5 h-5" /> :
                   <Award className="w-5 h-5" />}
                </span>
                <div className="flex-1 space-y-2">
                  <select
                    value={topChoices.find(c => c.rank === rank)?.title || ''}
                    onChange={(e) => updateTopChoice(rank, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{language === 'ko' ? '경력 선택...' : 'Select career...'}</option>
                    {careers.map(career => (
                      <option key={career.title} value={career.title}>{career.title}</option>
                    ))}
                  </select>
                  {topChoices.find(c => c.rank === rank)?.title && (
                    <input
                      type="text"
                      value={topChoices.find(c => c.rank === rank)?.reason || ''}
                      onChange={(e) => updateTopChoice(rank, 'reason', e.target.value)}
                      placeholder={language === 'ko' ? '선택 이유 (선택사항)' : 'Reason for this choice (optional)'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </ModuleCard>

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => router.push('/discover/career-options/step3')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <ModuleButton
            onClick={handleComplete}
            disabled={saving}
            size="large"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            {language === 'ko' ? '경력 탐색 완료' : 'Complete Career Exploration'}
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
