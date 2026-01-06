'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import enTranslations from './translations/en.json';
import koTranslations from './translations/ko.json';

export type Language = 'en' | 'ko';

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = { [key: string]: TranslationValue };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  toggleLanguage: () => void;
}

const translations: Record<Language, Translations> = {
  en: enTranslations as Translations,
  ko: koTranslations as Translations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'lifecraft-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isClient, setIsClient] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    setIsClient(true);
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ko')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'ko' : 'en';
    setLanguage(newLang);
  }, [language, setLanguage]);

  // Translation function with dot notation support and parameter interpolation
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: TranslationValue = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        let fallback: TranslationValue = translations.en;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return key; // Return key if not found in any language
          }
        }
        value = fallback;
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Handle parameter interpolation {param}
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, param) => {
        return params[param]?.toString() ?? `{${param}}`;
      });
    }

    return value;
  }, [language]);

  // Prevent hydration mismatch by using client-side rendering
  if (!isClient) {
    return (
      <LanguageContext.Provider value={{ language: 'en', setLanguage, t, toggleLanguage }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Convenience hook for just the translation function
export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
