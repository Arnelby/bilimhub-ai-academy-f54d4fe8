import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import ru from '../locales/ru.json';
import kg from '../locales/kg.json';

export const SUPPORTED_LANGUAGES = ['en', 'ru', 'kg'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const stored =
  typeof window !== 'undefined' ? window.localStorage.getItem('bilimhub-language') : null;
const initialLang: SupportedLanguage =
  stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)
    ? (stored as SupportedLanguage)
    : 'ru';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      kg: { translation: kg },
    },
    lng: initialLang,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'bilimhub-language',
      caches: ['localStorage'],
    },
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[i18n missing]', { lngs, ns, key });
      }
    },
    returnNull: false,
  });

export default i18n;
