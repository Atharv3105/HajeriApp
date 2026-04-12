import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './en.json';
import mr from './mr.json';

const resources = {
  en: { translation: en },
  mr: { translation: mr },
};

// Set Marathi as default if device locale is mr-IN, else English fallback
// However, the user requested Marathi-FIRST by default.
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'mr', // Force Marathi as primary default
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
