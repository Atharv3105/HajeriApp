import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import mr from "./mr.json";

const resources = {
  en: { translation: en },
  mr: { translation: mr },
};

i18n.use(initReactI18next).init({
  resources,
  lng:
    Localization.getLocales()[0]?.languageCode?.toLowerCase() === "mr"
      ? "mr"
      : "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export const setAppLanguage = (lang: "en" | "mr") => {
  i18n.changeLanguage(lang);
};

export const t = (key: string, config?: Record<string, any>) =>
  i18n.t(key, config) as string;

export const getAppLanguage = () => i18n.language as "en" | "mr";

export default i18n;
