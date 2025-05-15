import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationRU from './locales/ru/translation.json';
import translationUZ from './locales/uz/translation.json';
import translationKK from './locales/kk/translation.json';


const resources = {
  ru: { translation: translationRU },
  uz: { translation: translationUZ },
  kk: { translation: translationKK },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
