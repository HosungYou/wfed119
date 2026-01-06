'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Home, CheckCircle, Circle, Briefcase, Target, Sparkles, Heart } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton } from '@/components/modules';

interface ModuleStatus {
  values: boolean;
  strengths: boolean;
  vision: boolean;
  mission: boolean;
  careerOptions: {
    started: boolean;
    currentStep: number;
    completed: boolean;
    hollandCode?: string;
  };
}

export default function CareerOptionsLanding() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ModuleStatus | null>(null);
  const { startModule, canStartModule } = useModuleProgress('career-options');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      // Check prerequisites
      const prereqRes = await fetch('/api/discover/career-options/check-prerequisites');
      const prereqData = await prereqRes.json();

      // Check career session
      const sessionRes = await fetch('/api/discover/career-options/session');
      const sessionData = await sessionRes.json();

      setStatus({
        values: prereqData.values || false,
        strengths: prereqData.strengths || false,
        vision: prereqData.vision || false,
        mission: prereqData.mission || false,
        careerOptions: {
          started: sessionData.current_step > 0,
          currentStep: sessionData.current_step || 0,
          completed: sessionData.status === 'completed',
          hollandCode: sessionData.holland_code,
        },
      });

      setLoading(false);
    } catch (error) {
      console.error('[Career Options Landing] Error:', error);
      setLoading(false);
    }
  }

  async function handleStart() {
    if (!canStartModule) {
      alert(language === 'ko'
        ? '이전 모듈을 먼저 완료해주세요.'
        : 'Please complete previous modules first.');
      return;
    }

    await startModule();
    router.push('/discover/career-options/step1');
  }

  async function handleContinue() {
    const step = status?.careerOptions.currentStep || 1;
    router.push(`/discover/career-options/step${step}`);
  }

  async function handleRestart() {
    if (!confirm(language === 'ko'
      ? '새로 시작하시겠습니까? 현재 진행 상황이 초기화됩니다.'
      : 'Start fresh? Your current progress will be reset.')) {
      return;
    }

    try {
      await fetch('/api/discover/career-options/session', { method: 'DELETE' });
      await startModule();
      router.push('/discover/career-options/step1');
    } catch (error) {
      console.error('[Career Options Landing] Reset error:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'ko' ? '로딩 중...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const hasStarted = status?.careerOptions.started;

  return (
    <ModuleShell moduleId="career-options" showProgress={false}>
      <div className="max-w-3xl mx-auto">
        {/* Module Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '경력 탐색' : 'Career Options'}
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            {language === 'ko'
              ? 'Holland 직업 적성 검사와 AI 분석을 통해 당신에게 맞는 경력 옵션을 탐색합니다.'
              : 'Explore career options that match your personality using Holland RIASEC assessment and AI analysis.'}
          </p>
        </div>

        {/* Holland Code Badge (if completed) */}
        {status?.careerOptions.hollandCode && (
          <ModuleCard className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200" padding="normal">
            <div className="text-center">
              <p className="text-sm text-indigo-600 mb-2">
                {language === 'ko' ? '당신의 Holland 코드' : 'Your Holland Code'}
              </p>
              <p className="text-4xl font-bold text-indigo-700">
                {status.careerOptions.hollandCode}
              </p>
            </div>
          </ModuleCard>
        )}

        {/* Prerequisites Card */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '이전 모듈 데이터' : 'Previous Module Data'}
          </h2>

          <div className="grid grid-cols-4 gap-3">
            {[
              { key: 'values', icon: Heart, label: language === 'ko' ? '가치관' : 'Values', done: status?.values },
              { key: 'strengths', icon: Sparkles, label: language === 'ko' ? '강점' : 'Strengths', done: status?.strengths },
              { key: 'vision', icon: Target, label: language === 'ko' ? '비전' : 'Vision', done: status?.vision },
              { key: 'mission', icon: Target, label: language === 'ko' ? '사명' : 'Mission', done: status?.mission },
            ].map((item) => (
              <div
                key={item.key}
                className={`p-3 rounded-lg border-2 text-center ${
                  item.done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.done ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-xs font-medium">{item.label}</span>
                {item.done ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-4">
            {language === 'ko'
              ? '💡 이전 모듈 데이터가 많을수록 더 정확한 경력 추천을 받을 수 있습니다.'
              : '💡 The more previous module data you have, the more accurate career recommendations will be.'}
          </p>
        </ModuleCard>

        {/* Steps Overview */}
        <ModuleCard className="mb-6" padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'ko' ? '4단계 과정' : '4-Step Process'}
          </h2>

          <div className="space-y-3">
            {[
              {
                step: 1,
                title: language === 'ko' ? 'Holland 적성 검사' : 'Holland Assessment',
                desc: language === 'ko' ? 'RIASEC 직업 흥미 검사 (30문항)' : 'RIASEC Career Interest Inventory (30 questions)',
              },
              {
                step: 2,
                title: language === 'ko' ? 'AI 경력 추천' : 'AI Career Suggestions',
                desc: language === 'ko' ? '프로필 기반 맞춤 경력 추천' : 'Personalized career recommendations',
              },
              {
                step: 3,
                title: language === 'ko' ? '경력 조사' : 'Career Research',
                desc: language === 'ko' ? '관심 경력 3-5개 심층 탐색' : 'In-depth exploration of 3-5 careers',
              },
              {
                step: 4,
                title: language === 'ko' ? '경력 비교' : 'Career Comparison',
                desc: language === 'ko' ? '의사결정 매트릭스로 최종 선택' : 'Decision matrix for final selection',
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  status?.careerOptions.currentStep >= item.step
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  status?.careerOptions.currentStep > item.step
                    ? 'bg-indigo-500 text-white'
                    : status?.careerOptions.currentStep === item.step
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {status?.careerOptions.currentStep > item.step ? '✓' : item.step}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </ModuleCard>

        {/* Actions */}
        <div className="space-y-3">
          {hasStarted ? (
            <>
              <ModuleButton
                onClick={handleContinue}
                size="large"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {language === 'ko' ? `계속하기 (${status?.careerOptions.currentStep}단계)` : `Continue (Step ${status?.careerOptions.currentStep})`}
                <ArrowRight className="w-5 h-5 ml-2" />
              </ModuleButton>
              <ModuleButton
                onClick={handleRestart}
                variant="secondary"
                className="w-full"
              >
                {language === 'ko' ? '새로 시작' : 'Start Fresh'}
              </ModuleButton>
            </>
          ) : (
            <ModuleButton
              onClick={handleStart}
              size="large"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={!canStartModule}
            >
              {language === 'ko' ? '경력 탐색 시작' : 'Start Career Exploration'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </ModuleButton>
          )}

          <ModuleButton
            onClick={() => router.push('/')}
            variant="ghost"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            {language === 'ko' ? '홈으로' : 'Back to Home'}
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
