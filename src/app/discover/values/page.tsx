'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, Home, Heart, Star, Briefcase, CheckCircle, Circle } from 'lucide-react';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, SessionResetButton } from '@/components/modules';

interface ValueStatus {
  terminal: { started: boolean; completed: boolean; count: number };
  instrumental: { started: boolean; completed: boolean; count: number };
  work: { started: boolean; completed: boolean; count: number };
}

const VALUE_TYPES = [
  {
    id: 'terminal',
    icon: Star,
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
    name: { ko: '최종 가치관', en: 'Terminal Values' },
    desc: { ko: '삶의 궁극적 목표를 발견하세요', en: 'Discover life\'s ultimate goals' },
    route: '/discover/values/terminal',
  },
  {
    id: 'instrumental',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    bgLight: 'bg-rose-50',
    border: 'border-rose-200',
    name: { ko: '도구적 가치관', en: 'Instrumental Values' },
    desc: { ko: '목표를 달성하는 방식을 탐색하세요', en: 'Explore how you achieve your goals' },
    route: '/discover/values/instrumental',
  },
  {
    id: 'work',
    icon: Briefcase,
    color: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    border: 'border-amber-200',
    name: { ko: '직업 가치관', en: 'Work Values' },
    desc: { ko: '일에서 중요시하는 것을 확인하세요', en: 'Identify what matters in your work' },
    route: '/discover/values/work',
  },
];

export default function ValuesModuleLanding() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ValueStatus | null>(null);
  const { startModule, canStartModule } = useModuleProgress('values');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch('/api/discover/values/session');
      const data = await res.json();

      setStatus({
        terminal: {
          started: data.terminal_values?.length > 0,
          completed: data.terminal_completed || false,
          count: data.terminal_values?.length || 0,
        },
        instrumental: {
          started: data.instrumental_values?.length > 0,
          completed: data.instrumental_completed || false,
          count: data.instrumental_values?.length || 0,
        },
        work: {
          started: data.work_values?.length > 0,
          completed: data.work_completed || false,
          count: data.work_values?.length || 0,
        },
      });
      setLoading(false);
    } catch (error) {
      console.error('[Values Landing] Error:', error);
      setLoading(false);
    }
  }

  async function handleStartModule(valueType: string) {
    await startModule();
    const type = VALUE_TYPES.find(v => v.id === valueType);
    if (type) {
      router.push(type.route);
    }
  }

  function isAllCompleted(): boolean {
    return status?.terminal.completed && status?.instrumental.completed && status?.work.completed || false;
  }

  function getCompletionCount(): number {
    let count = 0;
    if (status?.terminal.completed) count++;
    if (status?.instrumental.completed) count++;
    if (status?.work.completed) count++;
    return count;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'ko' ? '로딩 중...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ModuleShell moduleId="values" showProgress={false}>
      <div className="max-w-3xl mx-auto">
        {/* Module Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {language === 'ko' ? '가치관 발견' : 'Values Discovery'}
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            {language === 'ko'
              ? '3가지 유형의 가치관을 탐색하여 당신의 핵심 가치를 발견하세요.'
              : 'Explore three types of values to discover what truly matters to you.'}
          </p>
        </div>

        {/* Progress Summary */}
        <ModuleCard className="mb-6" padding="normal">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {language === 'ko' ? '진행 상황' : 'Progress'}
              </h2>
              <p className="text-sm text-gray-500">
                {getCompletionCount()} / 3 {language === 'ko' ? '유형 완료' : 'types completed'}
              </p>
            </div>
            <div className="flex gap-2">
              {VALUE_TYPES.map((type) => {
                const isComplete = status?.[type.id as keyof ValueStatus]?.completed;
                return (
                  <div
                    key={type.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isComplete ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ModuleCard>

        {/* Value Type Cards */}
        <div className="space-y-4 mb-6">
          {VALUE_TYPES.map((type) => {
            const Icon = type.icon;
            const typeStatus = status?.[type.id as keyof ValueStatus];
            const isCompleted = typeStatus?.completed;
            const isStarted = typeStatus?.started && !isCompleted;

            return (
              <ModuleCard key={type.id} className="overflow-hidden" padding="none">
                <div className="flex">
                  {/* Icon section */}
                  <div className={`w-20 bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content section */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {language === 'ko' ? type.name.ko : type.name.en}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {language === 'ko' ? type.desc.ko : type.desc.en}
                        </p>
                        {typeStatus?.count ? (
                          <p className="text-xs text-gray-400 mt-2">
                            {typeStatus.count} {language === 'ko' ? '개 선택됨' : 'selected'}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                            {language === 'ko' ? '완료' : 'Done'}
                          </span>
                        )}
                        <button
                          onClick={() => handleStartModule(type.id)}
                          disabled={!canStartModule}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isCompleted
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : isStarted
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {isCompleted
                            ? (language === 'ko' ? '다시하기' : 'Redo')
                            : isStarted
                            ? (language === 'ko' ? '계속하기' : 'Continue')
                            : (language === 'ko' ? '시작' : 'Start')}
                          <ArrowRight className="w-4 h-4 inline ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </ModuleCard>
            );
          })}
        </div>

        {/* Info Card */}
        <ModuleCard className="mb-6 bg-blue-50 border-blue-200" padding="normal">
          <h3 className="font-semibold text-blue-900 mb-2">
            {language === 'ko' ? '가치관이란?' : 'What are Values?'}
          </h3>
          <p className="text-sm text-blue-800">
            {language === 'ko'
              ? '가치관은 삶에서 무엇이 중요한지에 대한 근본적인 신념입니다. 세 가지 유형을 모두 완료하면 당신만의 핵심 가치를 발견하고 분석할 수 있습니다.'
              : 'Values are fundamental beliefs about what is important in life. Complete all three types to discover and analyze your core values.'}
          </p>
        </ModuleCard>

        {/* Actions */}
        <div className="space-y-3">
          {isAllCompleted() && (
            <ModuleButton
              onClick={() => router.push('/discover/values/results')}
              size="large"
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              {language === 'ko' ? '결과 보기' : 'View Results'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </ModuleButton>
          )}

          <div className="flex items-center justify-between pt-2">
            <ModuleButton
              onClick={() => router.push('/')}
              variant="ghost"
            >
              <Home className="w-4 h-4 mr-2" />
              {language === 'ko' ? '홈으로' : 'Back to Home'}
            </ModuleButton>

            <SessionResetButton
              moduleId="values"
              moduleName={{ ko: '가치관 발견', en: 'Values Discovery' }}
            />
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
