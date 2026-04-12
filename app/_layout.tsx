import { initDB as initLegacyDB } from "@/services/databaseService";
import { initDB as initSchemaDB } from "@/services/db/schema";
import {
    Inter_400Regular,
    Inter_700Bold,
    useFonts,
} from "@expo-google-fonts/inter";
import {
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_700Bold,
} from "@expo-google-fonts/noto-sans-devanagari";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "../localization";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_700Bold,
  });
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    Promise.all([initLegacyDB(), initSchemaDB()]).then(() => setDbReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
});
