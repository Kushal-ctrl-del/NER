"use client";

import { useState, useEffect } from 'react';
import { Language } from './i18n';

export function useLanguage() {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Language;
    if (saved === 'hi' || saved === 'en') {
      setLangState(saved);
    }

    const handleStorage = () => {
      const current = localStorage.getItem('lang') as Language;
      if (current === 'hi' || current === 'en') {
        setLangState(current);
      }
    };

    window.addEventListener('languageChange', handleStorage);
    return () => window.removeEventListener('languageChange', handleStorage);
  }, []);

  const setLang = (newLang: Language) => {
    localStorage.setItem('lang', newLang);
    setLangState(newLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  return { lang, setLang };
}
