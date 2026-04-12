import { MarathiText } from "@/components/MarathiText";
import { t } from "@/localization";
import { useSettingsStore } from "@/store/settingsStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    View,
} from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const loaded = useSettingsStore((state) => state.loaded);
  const loadLanguage = useSettingsStore((state) => state.loadLanguage);

  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  useEffect(() => {
    if (!loaded) return;
    const target = language ? "/(auth)/role-select" : "/language-selection";
    const timeout = setTimeout(() => router.replace(target as any), 2000);
    return () => clearTimeout(timeout);
  }, [loaded, language, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <MarathiText bold size={32} color="#0d9488">
          {t("splash.title")}
        </MarathiText>
        <MarathiText size={16} color="#475569" style={styles.subtitle}>
          {t("splash.subtitle")}
        </MarathiText>
        <Image
          source={require("../assets/images/landing.png")}
          style={styles.image}
          resizeMode="contain"
        />
        {!loaded && (
          <ActivityIndicator
            size="large"
            color="#0d9488"
            style={{ marginTop: 16 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  card: {
    width: "100%",
    padding: 24,
    alignItems: "center",
  },
  subtitle: {
    marginTop: 12,
    marginBottom: 28,
    textAlign: "center",
  },
  image: {
    width: "90%",
    height: 240,
  },
});
