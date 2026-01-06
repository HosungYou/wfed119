'use client';

import { useLanguage } from '@/lib/i18n';

interface LanguageToggleProps {
  className?: string;
  variant?: 'default' | 'compact' | 'pill';
}

export default function LanguageToggle({ className = '', variant = 'default' }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
        className={`px-2 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        aria-label="Toggle language"
      >
        {language === 'en' ? 'KO' : 'EN'}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center bg-gray-100 rounded-full p-0.5 ${className}`}>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${
            language === 'en'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('ko')}
          className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${
            language === 'ko'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          KO
        </button>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
          language === 'en'
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => setLanguage('ko')}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
          language === 'ko'
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        KO
      </button>
    </div>
  );
}
