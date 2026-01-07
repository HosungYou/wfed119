'use client';

import { useState } from 'react';
import { RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface SessionResetButtonProps {
  moduleId: string;
  moduleName: { ko: string; en: string };
  onReset?: () => void;
  apiEndpoint?: string;
  className?: string;
}

export function SessionResetButton({
  moduleId,
  moduleName,
  onReset,
  apiEndpoint,
  className = '',
}: SessionResetButtonProps) {
  const { language } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = apiEndpoint || `/api/discover/${moduleId}/session`;

  async function handleReset() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to reset session');
      }

      setShowConfirm(false);

      if (onReset) {
        onReset();
      } else {
        // Default: reload the page
        window.location.reload();
      }
    } catch (err) {
      console.error('[SessionResetButton] Error:', err);
      setError(language === 'ko' ? '세션 초기화에 실패했습니다.' : 'Failed to reset session.');
      setLoading(false);
    }
  }

  if (showConfirm) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-amber-900 mb-1">
              {language === 'ko' ? '세션 초기화 확인' : 'Confirm Session Reset'}
            </h4>
            <p className="text-sm text-amber-700 mb-3">
              {language === 'ko'
                ? `${moduleName.ko} 모듈의 모든 진행 상황이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`
                : `All progress in ${moduleName.en} module will be deleted. This action cannot be undone.`}
            </p>
            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'ko' ? '초기화 중...' : 'Resetting...'}
                  </>
                ) : (
                  <>
                    {language === 'ko' ? '초기화' : 'Reset'}
                  </>
                )}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
    >
      <RotateCcw className="w-4 h-4" />
      {language === 'ko' ? '새로 시작하기' : 'Start Fresh'}
    </button>
  );
}
