'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { Shield, FileText, FlaskConical, Check, X } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  canClose?: boolean;
}

export default function ConsentModal({
  isOpen,
  onClose,
  onSuccess,
  canClose = false,
}: ConsentModalProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consent states
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [researchAgreed, setResearchAgreed] = useState(false);
  const [dataCollection, setDataCollection] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [researchUse, setResearchUse] = useState(false);
  const [anonymizedSharing, setAnonymizedSharing] = useState(false);

  // Expanded sections
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [showResearchDetails, setShowResearchDetails] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!privacyAgreed) {
      setError(
        language === 'ko'
          ? '개인정보 처리방침에 동의해야 서비스를 이용할 수 있습니다.'
          : 'You must agree to the Privacy Policy to use this service.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privacyPolicyAgreed: privacyAgreed,
          researchConsentAgreed: researchAgreed,
          consentDataCollection: dataCollection,
          consentAiAnalysis: aiAnalysis,
          consentResearchUse: researchUse,
          consentAnonymizedSharing: anonymizedSharing,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save consent');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : language === 'ko'
            ? '동의 저장 중 오류가 발생했습니다.'
            : 'Error saving consent.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {language === 'ko' ? '서비스 이용 동의' : 'Terms of Service Agreement'}
                </h2>
                <p className="text-sm text-gray-500">
                  {language === 'ko'
                    ? 'LifeCraft 서비스 이용을 위해 아래 항목에 동의해 주세요.'
                    : 'Please agree to the following terms to use LifeCraft.'}
                </p>
              </div>
            </div>
            {canClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Privacy Policy Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">
                      {language === 'ko'
                        ? '[필수] 개인정보 처리방침 동의'
                        : '[Required] Privacy Policy Agreement'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ko'
                      ? '서비스 이용에 필요한 개인정보 수집 및 이용에 동의합니다.'
                      : 'I agree to the collection and use of personal data necessary for the service.'}
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
              className="w-full px-4 py-2 text-left text-sm text-teal-600 hover:bg-teal-50 transition-colors"
            >
              {showPrivacyDetails
                ? (language === 'ko' ? '간략히 보기' : 'Show less')
                : (language === 'ko' ? '자세히 보기' : 'Show more')}
            </button>

            {showPrivacyDetails && (
              <div className="px-4 py-3 text-sm text-gray-600 space-y-3 border-t border-gray-200 bg-white">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {language === 'ko' ? '1. 수집하는 개인정보' : '1. Information We Collect'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>{language === 'ko' ? '이메일 주소 (Google 계정)' : 'Email address (Google account)'}</li>
                    <li>{language === 'ko' ? '이름' : 'Name'}</li>
                    <li>{language === 'ko' ? '평가 응답 및 결과' : 'Assessment responses and results'}</li>
                    <li>{language === 'ko' ? '서비스 이용 기록' : 'Service usage records'}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {language === 'ko' ? '2. 개인정보의 이용 목적' : '2. Purpose of Use'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>{language === 'ko' ? '맞춤형 커리어 코칭 서비스 제공' : 'Providing personalized career coaching'}</li>
                    <li>{language === 'ko' ? 'AI 기반 강점 및 가치관 분석' : 'AI-based strengths and values analysis'}</li>
                    <li>{language === 'ko' ? '서비스 개선을 위한 통계 분석' : 'Statistical analysis for service improvement'}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {language === 'ko' ? '3. 보유 및 이용 기간' : '3. Retention Period'}
                  </h4>
                  <p>
                    {language === 'ko'
                      ? '회원 탈퇴 시까지 보관하며, 탈퇴 시 즉시 파기됩니다.'
                      : 'Data is retained until account deletion and will be immediately destroyed upon deletion.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Research Consent Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 bg-purple-50 border-b border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={researchAgreed}
                  onChange={(e) => {
                    setResearchAgreed(e.target.checked);
                    if (e.target.checked) {
                      setResearchUse(true);
                    } else {
                      setResearchUse(false);
                      setAnonymizedSharing(false);
                    }
                  }}
                  className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-gray-900">
                      {language === 'ko'
                        ? '[선택] 연구 참여 동의'
                        : '[Optional] Research Participation Agreement'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ko'
                      ? '학술 연구 목적으로 익명화된 데이터 활용에 동의합니다.'
                      : 'I agree to the use of anonymized data for academic research purposes.'}
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={() => setShowResearchDetails(!showResearchDetails)}
              className="w-full px-4 py-2 text-left text-sm text-purple-600 hover:bg-purple-50 transition-colors"
            >
              {showResearchDetails
                ? (language === 'ko' ? '간략히 보기' : 'Show less')
                : (language === 'ko' ? '자세히 보기' : 'Show more')}
            </button>

            {showResearchDetails && (
              <div className="px-4 py-3 text-sm text-gray-600 space-y-3 border-t border-gray-200 bg-white">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {language === 'ko' ? '연구 목적' : 'Research Purpose'}
                  </h4>
                  <p>
                    {language === 'ko'
                      ? '본 연구는 AI 기반 커리어 코칭의 효과성을 분석하고, 강점 기반 커리어 개발 방법론을 발전시키기 위한 학술 연구입니다.'
                      : 'This research analyzes the effectiveness of AI-based career coaching and aims to advance strengths-based career development methodologies.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {language === 'ko' ? '연구 기관' : 'Research Institution'}
                  </h4>
                  <p>Penn State University - Workforce Education and Development</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {language === 'ko' ? '데이터 처리 방법' : 'Data Processing'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{language === 'ko' ? '모든 데이터는 익명화 처리됩니다.' : 'All data will be anonymized.'}</li>
                    <li>{language === 'ko' ? '개인 식별이 불가능한 형태로 분석됩니다.' : 'Data will be analyzed in a non-identifiable form.'}</li>
                    <li>{language === 'ko' ? '연구 결과는 학술 논문으로 발표될 수 있습니다.' : 'Research results may be published in academic papers.'}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {language === 'ko' ? '참여자 권리' : 'Participant Rights'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{language === 'ko' ? '연구 참여는 언제든지 철회할 수 있습니다.' : 'You may withdraw from the study at any time.'}</li>
                    <li>{language === 'ko' ? '동의 철회 시 해당 데이터는 연구에서 제외됩니다.' : 'Upon withdrawal, your data will be excluded from the research.'}</li>
                    <li>{language === 'ko' ? '연구 참여 여부는 서비스 이용에 영향을 미치지 않습니다.' : 'Research participation does not affect your service access.'}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-gray-900">
              {language === 'ko' ? '추가 동의 항목' : 'Additional Consent Options'}
            </h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={dataCollection}
                onChange={(e) => setDataCollection(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                disabled // Required for service
              />
              <span className="text-sm text-gray-600">
                {language === 'ko'
                  ? '서비스 이용에 필요한 데이터 수집 (필수)'
                  : 'Data collection necessary for service (Required)'}
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aiAnalysis}
                onChange={(e) => setAiAnalysis(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span className="text-sm text-gray-600">
                {language === 'ko'
                  ? 'AI 분석을 통한 맞춤형 인사이트 제공'
                  : 'Personalized insights through AI analysis'}
              </span>
            </label>

            {researchAgreed && (
              <label className="flex items-center gap-3 cursor-pointer pl-4 border-l-2 border-purple-200">
                <input
                  type="checkbox"
                  checked={anonymizedSharing}
                  onChange={(e) => setAnonymizedSharing(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">
                  {language === 'ko'
                    ? '익명화된 데이터의 학술적 공유 허용'
                    : 'Allow sharing of anonymized data for academic purposes'}
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <button
            onClick={handleSubmit}
            disabled={!privacyAgreed || loading}
            className={`
              w-full py-3 px-4 rounded-xl font-medium text-white
              flex items-center justify-center gap-2
              transition-all duration-200
              ${privacyAgreed
                ? 'bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200'
                : 'bg-gray-300 cursor-not-allowed'}
              disabled:opacity-50
            `}
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                {language === 'ko' ? '동의하고 시작하기' : 'Agree and Continue'}
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            {language === 'ko'
              ? '동의를 완료하면 LifeCraft 서비스를 이용할 수 있습니다.'
              : 'Once you agree, you can start using LifeCraft services.'}
          </p>
        </div>
      </div>
    </div>
  );
}
