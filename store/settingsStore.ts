import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type Language = "en" | "mr";

interface SettingsState {
  language: Language | null;
  loaded: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

const STORAGE_KEY = "smart-attendance-language";

export const useSettingsStore = create<SettingsState>((set) => ({
  language: null,
  loaded: false,
  setLanguage: async (lang) => {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    set({ language: lang, loaded: true });
  },
  loadLanguage: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      set({ language: saved === "mr" ? "mr" : "en", loaded: true });
    } catch (error) {
      set({ language: "en", loaded: true });
    }
  },
}));
