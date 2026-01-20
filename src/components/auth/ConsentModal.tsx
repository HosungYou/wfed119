'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { Shield, FileText, FlaskConical, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

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
          : 'Please accept the Privacy Policy to continue using LifeCraft.'
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
            : 'An error occurred while saving your preferences. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm p-4">
      <div className="relative bg-surface-paper rounded-2xl shadow-dramatic max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-up">
        {/* Header */}
        <div className="sticky top-0 bg-surface-paper/95 backdrop-blur-md border-b border-neutral-100 px-6 py-5 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shadow-soft">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-neutral-900 tracking-tight">
                  {language === 'ko' ? '서비스 이용 동의' : 'Terms of Service'}
                </h2>
                <p className="text-body-sm text-neutral-500 mt-0.5">
                  {language === 'ko'
                    ? 'LifeCraft 서비스 이용을 위해 아래 항목에 동의해 주세요.'
                    : 'Please review and accept our terms to start your journey with LifeCraft.'}
                </p>
              </div>
            </div>
            {canClose && (
              <button
                onClick={onClose}
                className="p-2.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-body-sm flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <X className="w-3 h-3 text-red-600" />
              </div>
              <span>{error}</span>
            </div>
          )}

          {/* Privacy Policy Section */}
          <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-soft">
            <div className="p-5 bg-primary-50/50 border-b border-neutral-200">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-6 h-6 border-2 border-neutral-300 rounded-lg peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-all duration-200 flex items-center justify-center group-hover:border-primary-400">
                    {privacyAgreed && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" />
                    <span className="font-display font-semibold text-neutral-900">
                      {language === 'ko'
                        ? '[필수] 개인정보 처리방침'
                        : '[Required] Privacy Policy'}
                    </span>
                  </div>
                  <p className="text-body-sm text-neutral-600 mt-1.5 leading-relaxed">
                    {language === 'ko'
                      ? '서비스 이용에 필요한 개인정보 수집 및 이용에 동의합니다.'
                      : 'I consent to the collection and processing of my personal data as described in the Privacy Policy to enable the core features of LifeCraft.'}
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
              className="w-full px-5 py-3 text-left text-body-sm text-primary-600 hover:bg-primary-50/50 transition-all duration-200 flex items-center justify-between"
            >
              <span className="font-medium">
                {showPrivacyDetails
                  ? (language === 'ko' ? '간략히 보기' : 'Hide details')
                  : (language === 'ko' ? '자세히 보기' : 'View full policy')}
              </span>
              {showPrivacyDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showPrivacyDetails && (
              <div className="px-5 py-4 text-body-sm text-neutral-600 space-y-4 border-t border-neutral-100 bg-surface-cream">
                <div>
                  <h4 className="font-display font-semibold text-neutral-900 mb-2">
                    {language === 'ko' ? '1. Information We Collect' : '1. Information We Collect'}
                  </h4>
                  <p className="text-neutral-600 mb-2">
                    {language === 'ko'
                      ? '서비스 제공을 위해 다음 정보를 수집합니다:'
                      : 'To provide our career coaching services, we collect the following information:'}
                  </p>
                  <ul className="space-y-1.5 text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '이메일 주소 (Google 계정을 통해)' : 'Email address (via your Google account)'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '이름 및 프로필 정보' : 'Name and profile information'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '평가 응답 및 결과 데이터' : 'Your assessment responses and generated results'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '서비스 이용 패턴 및 기록' : 'Service usage patterns and activity logs'}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-neutral-900 mb-2">
                    {language === 'ko' ? '2. How We Use Your Data' : '2. How We Use Your Data'}
                  </h4>
                  <p className="text-neutral-600 mb-2">
                    {language === 'ko'
                      ? '수집된 정보는 다음 목적으로 사용됩니다:'
                      : 'Your information enables us to:'}
                  </p>
                  <ul className="space-y-1.5 text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '맞춤형 커리어 코칭 및 인사이트 제공' : 'Deliver personalized career coaching and insights tailored to your unique profile'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? 'AI 기반 강점, 가치관, 성격 분석' : 'Power AI-driven analysis of your strengths, values, and personality'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '서비스 품질 개선을 위한 익명화된 통계 분석' : 'Improve our services through anonymized aggregate analytics'}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-neutral-900 mb-2">
                    {language === 'ko' ? '3. Data Retention' : '3. Data Retention'}
                  </h4>
                  <p className="text-neutral-600">
                    {language === 'ko'
                      ? '귀하의 데이터는 계정이 활성화된 동안 보관됩니다. 계정 삭제를 요청하시면, 모든 개인 데이터는 30일 이내에 영구 삭제됩니다.'
                      : 'Your data is retained while your account remains active. Upon account deletion request, all personal data will be permanently removed within 30 days. You may request data export at any time.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Research Consent Section */}
          <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-soft">
            <div className="p-5 bg-secondary-50/50 border-b border-neutral-200">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative mt-0.5">
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
                    className="sr-only peer"
                  />
                  <div className="w-6 h-6 border-2 border-neutral-300 rounded-lg peer-checked:border-secondary-500 peer-checked:bg-secondary-500 transition-all duration-200 flex items-center justify-center group-hover:border-secondary-400">
                    {researchAgreed && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-secondary-600" />
                    <span className="font-display font-semibold text-neutral-900">
                      {language === 'ko'
                        ? '[선택] 연구 참여 동의'
                        : '[Optional] Research Participation'}
                    </span>
                  </div>
                  <p className="text-body-sm text-neutral-600 mt-1.5 leading-relaxed">
                    {language === 'ko'
                      ? '학술 연구 목적으로 익명화된 데이터 활용에 동의합니다.'
                      : 'I voluntarily agree to contribute my anonymized data to academic research on AI-assisted career development.'}
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={() => setShowResearchDetails(!showResearchDetails)}
              className="w-full px-5 py-3 text-left text-body-sm text-secondary-600 hover:bg-secondary-50/50 transition-all duration-200 flex items-center justify-between"
            >
              <span className="font-medium">
                {showResearchDetails
                  ? (language === 'ko' ? '간략히 보기' : 'Hide details')
                  : (language === 'ko' ? '자세히 보기' : 'Learn about our research')}
              </span>
              {showResearchDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showResearchDetails && (
              <div className="px-5 py-4 text-body-sm text-neutral-600 space-y-4 border-t border-neutral-100 bg-surface-cream">
                <div>
                  <h4 className="font-display font-semibold text-neutral-900 mb-2">
                    {language === 'ko' ? 'Research Purpose' : 'Research Purpose'}
                  </h4>
                  <p className="text-neutral-600">
                    {language === 'ko'
                      ? '본 연구는 AI 기반 커리어 코칭의 효과성을 분석하고, 강점 기반 커리어 개발 방법론을 발전시키기 위한 학술 연구입니다.'
                      : 'This academic study investigates the effectiveness of AI-powered career coaching tools and seeks to advance strengths-based career development methodologies. Your participation helps shape the future of career education.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-neutral-900 mb-2">
                    {language === 'ko' ? 'Research Institution' : 'Research Institution'}
                  </h4>
                  <p className="text-neutral-600">
                    <span className="font-medium text-neutral-800">Penn State University</span>
                    <br />
                    Department of Workforce Education and Development
                  </p>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-neutral-900 mb-2">
                    {language === 'ko' ? 'How Your Data Is Protected' : 'How Your Data Is Protected'}
                  </h4>
                  <ul className="space-y-1.5 text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '모든 데이터는 엄격하게 익명화 처리됩니다.' : 'All data undergoes rigorous anonymization before analysis'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '개인을 식별할 수 없는 형태로만 분석됩니다.' : 'No individual can be identified from the research data'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '연구 결과는 학술 논문 및 컨퍼런스에서 발표될 수 있습니다.' : 'Findings may be published in academic journals and conferences'}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-neutral-900 mb-2">
                    {language === 'ko' ? 'Your Rights as a Participant' : 'Your Rights as a Participant'}
                  </h4>
                  <ul className="space-y-1.5 text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '언제든지 연구 참여를 철회할 수 있습니다.' : 'Withdraw from the study at any time without explanation'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '철회 시 귀하의 데이터는 연구에서 제외됩니다.' : 'Request removal of your data from the study'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-2 flex-shrink-0" />
                      <span>{language === 'ko' ? '연구 참여 여부는 서비스 이용에 전혀 영향을 미치지 않습니다.' : 'Your service access remains unchanged regardless of participation'}</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="border border-neutral-200 rounded-2xl p-5 space-y-4 bg-surface-cream/50">
            <h3 className="font-display font-semibold text-neutral-900">
              {language === 'ko' ? '추가 설정' : 'Additional Preferences'}
            </h3>

            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={dataCollection}
                  onChange={(e) => setDataCollection(e.target.checked)}
                  className="sr-only peer"
                  disabled
                />
                <div className="w-5 h-5 border-2 border-neutral-300 rounded-md bg-neutral-100 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-neutral-400" />
                </div>
              </div>
              <span className="text-body-sm text-neutral-500">
                {language === 'ko'
                  ? '서비스 이용에 필요한 필수 데이터 수집'
                  : 'Essential data collection for service functionality (required)'}
              </span>
            </label>

            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={aiAnalysis}
                  onChange={(e) => setAiAnalysis(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-neutral-300 rounded-md peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-all duration-200 flex items-center justify-center group-hover:border-primary-400">
                  {aiAnalysis && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <span className="text-body-sm text-neutral-700">
                {language === 'ko'
                  ? 'AI 분석을 통한 맞춤형 인사이트 제공'
                  : 'Enable AI-powered personalized insights and recommendations'}
              </span>
            </label>

            {researchAgreed && (
              <label className="flex items-center gap-4 cursor-pointer group pl-4 border-l-2 border-secondary-200 ml-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={anonymizedSharing}
                    onChange={(e) => setAnonymizedSharing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-neutral-300 rounded-md peer-checked:border-secondary-500 peer-checked:bg-secondary-500 transition-all duration-200 flex items-center justify-center group-hover:border-secondary-400">
                    {anonymizedSharing && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <span className="text-body-sm text-neutral-700">
                  {language === 'ko'
                    ? '익명화된 데이터의 학술적 공유 허용'
                    : 'Allow anonymized data to be shared with other researchers'}
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-paper/95 backdrop-blur-md border-t border-neutral-100 px-6 py-5 rounded-b-2xl">
          <button
            onClick={handleSubmit}
            disabled={!privacyAgreed || loading}
            className={`
              w-full py-4 px-6 rounded-xl font-display font-semibold text-white
              flex items-center justify-center gap-2.5
              transition-all duration-300
              ${privacyAgreed
                ? 'bg-primary-600 hover:bg-primary-700 shadow-medium hover:shadow-elevated active:scale-[0.98]'
                : 'bg-neutral-300 cursor-not-allowed'}
              disabled:opacity-50
            `}
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>{language === 'ko' ? '동의하고 시작하기' : 'Accept & Get Started'}</span>
              </>
            )}
          </button>

          <p className="text-body-xs text-neutral-500 text-center mt-4 leading-relaxed">
            {language === 'ko'
              ? '동의를 완료하면 LifeCraft의 모든 기능을 이용하실 수 있습니다.'
              : 'By clicking "Accept & Get Started", you agree to our terms and can begin your personalized career journey.'}
          </p>
        </div>
      </div>
    </div>
  );
}
