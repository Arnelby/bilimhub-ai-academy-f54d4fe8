import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { translations, type Language } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** @deprecated Use `useTranslation()` from `react-i18next` instead. */
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function readStored(): Language {
  const stored =
    typeof window !== 'undefined' ? window.localStorage.getItem('bilimhub-language') : null;
  return stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)
    ? (stored as Language)
    : 'ru';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStored);

  // Keep i18next in sync with our context.
  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bilimhub-language', language);
    }
  }, [language]);

  // Hydrate from profile preference once user is signed in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('language_preference')
        .eq('id', userId)
        .maybeSingle();
      const pref = profile?.language_preference as Language | null | undefined;
      if (!cancelled && pref && (SUPPORTED_LANGUAGES as readonly string[]).includes(pref)) {
        setLanguageState(pref);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    void i18n.changeLanguage(lang);
    // Best-effort persist to profile (ignore failures for unauthed users).
    void supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;
      void supabase.from('profiles').update({ language_preference: lang }).eq('id', userId);
    });
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
