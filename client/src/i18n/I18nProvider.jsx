import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en';
import de from './locales/de';
import ptBR from './locales/pt-BR';

const STORAGE_KEY = 'analyser-locale';
const LEGACY_STORAGE_KEY = 'spotify-analyzer-locale';

export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt-BR', label: 'Português (BR)' },
];

const MESSAGES = { en, de, 'pt-BR': ptBR };

const I18nContext = createContext(null);

function interpolate(str, params) {
  if (!params) return str;
  return String(str).replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined && params[key] !== null ? String(params[key]) : `{${key}}`
  );
}

function resolve(obj, path) {
  return path.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), obj);
}

function getInitialLocale() {
  const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (stored && MESSAGES[stored]) return stored;
  return 'en';
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale);

  const setLocale = (code) => {
    if (!MESSAGES[code]) return;
    setLocaleState(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  useEffect(() => {
    document.documentElement.lang = locale === 'pt-BR' ? 'pt-BR' : locale;
  }, [locale]);

  const value = useMemo(() => {
    const messages = MESSAGES[locale] || en;

    function t(key, params) {
      const val = resolve(messages, key);
      if (typeof val === 'string') return interpolate(val, params);
      const fallback = resolve(en, key);
      if (typeof fallback === 'string') return interpolate(fallback, params);
      return key;
    }

    return { locale, setLocale, t, messages };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
