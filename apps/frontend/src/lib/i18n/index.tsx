'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import arMessages from '@/messages/ar.json';
import enMessages from '@/messages/en.json';

type Messages = Record<string, any>;

const messages: Record<string, Messages> = { ar: arMessages, en: enMessages };

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let val = obj;
  for (const key of keys) {
    if (val == null || typeof val !== 'object') return path;
    val = val[key];
  }
  return typeof val === 'string' ? val : path;
}

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextType>({
  locale: 'ar',
  setLocale: () => {},
  t: (key: string) => key,
  dir: 'rtl',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState('ar');

  useEffect(() => {
    const saved = localStorage.getItem('locale') || 'ar';
    setLocaleState(saved);
    document.documentElement.lang = saved;
    document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    window.location.reload();
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const msg = messages[locale] || messages['ar'];
    let value = getNestedValue(msg, key);
    if (params && value !== key) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }
    return value;
  }, [locale]);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
