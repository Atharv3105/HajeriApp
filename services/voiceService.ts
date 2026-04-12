import * as Speech from "expo-speech";

export const speak = (text: string, locale: "en" | "mr") => {
  const options: Speech.SpeechOptions = {
    language: locale === "mr" ? "mr-IN" : "en-IN",
    pitch: 1,
    rate: 0.9,
  };
  Speech.stop();
  Speech.speak(text, options);
};

export const stopSpeaking = () => {
  Speech.stop();
};
