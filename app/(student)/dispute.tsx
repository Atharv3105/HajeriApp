import { MarathiText } from "@/components/MarathiText";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DisputeScreen() {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submitDispute = () => {
    if (!reason.trim()) {
      Alert.alert("माहिती भरा", "कृपया तक्रारीचे तपशील भरा.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("सबमिट", "तुमची तक्रार शाळेकडे पाठवण्यात आली आहे.");
      router.replace("/(student)/attendance");
    }, 900);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(student)/attendance")} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#374151">
          तक्रार नोंदवा
        </MarathiText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <MarathiText size={16} color="#4b5563" style={{ marginBottom: 16 }}>
          जर तुमच्या हजेरीमध्ये कोणतीही चूक असेल तर ही तक्रार द्या.
        </MarathiText>
        <TextInput
          style={styles.input}
          placeholder="तक्रार लिहा..."
          multiline
          numberOfLines={8}
          value={reason}
          onChangeText={setReason}
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={submitDispute}
          disabled={loading}
        >
          <MaterialCommunityIcons name="send" size={22} color="#fff" />
          <MarathiText bold size={16} color="#fff" style={{ marginLeft: 10 }}>
            तक्रार पाठवा
          </MarathiText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
  },
  content: { padding: 20 },
  input: {
    minHeight: 180,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 24,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 18,
    borderRadius: 20,
  },
});
