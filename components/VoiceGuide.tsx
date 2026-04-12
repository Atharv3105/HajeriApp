import { speak, stopSpeaking } from "@/services/voiceService";
import { useSettingsStore } from "@/store/settingsStore";
import { useEffect } from "react";

interface VoiceGuideProps {
  text: string;
}

export function VoiceGuide({ text }: VoiceGuideProps) {
  const language = useSettingsStore((state) => state.language) || "en";

  useEffect(() => {
    if (!text) return;
    speak(text, language);
    return () => {
      stopSpeaking();
    };
  }, [text, language]);

  return null;
}
