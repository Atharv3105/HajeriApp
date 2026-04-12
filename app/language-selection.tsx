import { MarathiText } from "@/components/MarathiText";
import { setAppLanguage, t } from "@/localization";
import { useSettingsStore } from "@/store/settingsStore";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const onSelect = async (lang: "en" | "mr") => {
    setAppLanguage(lang);
    await setLanguage(lang);
    router.replace("/dashboard" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MarathiText bold size={30} color="#0f172a" textAlign="center">
          {t("language.title")}
        </MarathiText>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: "#0d9488" }]}
          onPress={() => onSelect("en")}
        >
          <MarathiText bold size={24} color="#fff">
            {t("language.english")}
          </MarathiText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: "#f97316" }]}
          onPress={() => onSelect("mr")}
        >
          <MarathiText bold size={24} color="#fff">
            {t("language.marathi")}
          </MarathiText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  option: {
    width: "100%",
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
});
