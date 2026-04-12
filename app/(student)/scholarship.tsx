import { MarathiText } from "@/components/MarathiText";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScholarshipScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <MaterialCommunityIcons name="school" size={40} color="#fff" />
          <MarathiText bold size={24} color="#fff" style={{ marginTop: 12 }}>
            शिष्यवृत्ती पात्रता
          </MarathiText>
          <MarathiText
            size={14}
            color="#e2e8f0"
            style={{ marginTop: 8, textAlign: "center" }}
          >
            तुमची हजेरी ८२% आहे. पुढील शिष्यवृत्ती सत्रासाठी तुम्ही पात्र आहात.
          </MarathiText>
        </View>

        <View style={styles.card}>
          <MarathiText bold size={18} color="#111827">
            तुमची सध्याची स्थिती
          </MarathiText>
          <View style={styles.statRow}>
            <MarathiText size={16} color="#6b7280">
              हजेरी टक्केवारी
            </MarathiText>
            <MarathiText bold size={18} color="#0d9488">
              82%
            </MarathiText>
          </View>
          <View style={styles.statRow}>
            <MarathiText size={16} color="#6b7280">
              शिष्यवृत्ती स्थिती
            </MarathiText>
            <MarathiText bold size={18} color="#0d9488">
              पात्र
            </MarathiText>
          </View>
        </View>

        <View style={styles.card}>
          <MarathiText bold size={18} color="#111827">
            पुढील पावले
          </MarathiText>
          <MarathiText size={14} color="#475569" style={{ marginTop: 12 }}>
            शाळेच्या शिष्यवृत्ती फॉर्मची तारीख लक्षात ठेवा आणि आवश्यक कागदपत्रे
            तयार ठेवा.
          </MarathiText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef2ff" },
  content: { padding: 20 },
  banner: {
    backgroundColor: "#2563eb",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
});
