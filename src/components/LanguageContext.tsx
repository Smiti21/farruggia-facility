import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { translations } from '../translations';
import type { Language, Translation } from '../translations';

const STORAGE_KEY = 'farruggia-lang';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  /** Resolve a dot-path to a string, e.g. t('nav.home'). */
  t: (key: string) => string;
  /** Resolve a dot-path to an array, e.g. tList<ServiceItem>('services.items'). */
  tList: <T>(key: string) => T[];
  /** The whole dictionary, for components that prefer direct field access. */
  dict: Translation;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Walks `obj` along a dot-separated path. Returns undefined if any hop is missing. */
function resolve(obj: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'de') return stored;
  // Swiss/German visitors get German automatically; everyone else gets English.
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), []);
  const toggleLanguage = useCallback(
    () => setLanguageState((prev) => (prev === 'en' ? 'de' : 'en')),
    [],
  );

  const value = useMemo<LanguageContextValue>(() => {
    const dict = translations[language];
    return {
      language,
      setLanguage,
      toggleLanguage,
      dict,
      t: (key: string) => {
        const found = resolve(dict, key);
        // Missing keys surface as the key itself rather than crashing the render.
        return typeof found === 'string' ? found : key;
      },
      tList: <T,>(key: string) => {
        const found = resolve(dict, key);
        return Array.isArray(found) ? (found as T[]) : [];
      },
    };
  }, [language, setLanguage, toggleLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
