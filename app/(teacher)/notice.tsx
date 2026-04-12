import { MarathiText } from "@/components/MarathiText";
import { featureRepo } from "@/services/db/featureRepo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { t } from "@/localization";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function NoticeScreen() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [notices, setNotices] = useState<
    { id: number; title: string; content: string; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const load = async () => {
    try {
      const rows = await featureRepo.getNotices();
      setNotices(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addNotice = async () => {
    if (!title.trim()) return;
    await featureRepo.addNotice(title.trim(), content.trim());
    setTitle("");
    setContent("");
    await load();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <MarathiText bold size={20} color="#1f2937">
          Notices
        </MarathiText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {role === "teacher" && (
          <View style={styles.inputCard}>
            <MarathiText bold size={16} color="#374151" style={{ marginBottom: 12 }}>
              Create notice
            </MarathiText>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            placeholder="Details"
            multiline
            value={content}
            onChangeText={setContent}
          />
            <TouchableOpacity style={styles.submitBtn} onPress={addNotice}>
              <MarathiText bold color="#fff">
                Send
              </MarathiText>
            </TouchableOpacity>
          </View>
        )}

        <MarathiText bold size={18} color="#1f2937" style={{ marginBottom: 12 }}>
          Previous notices
        </MarathiText>
        {loading ? (
          <ActivityIndicator size="large" color="#ea580c" />
        ) : (
          notices.map((notice) => (
            <View key={notice.id} style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <MaterialCommunityIcons name="bullhorn" size={24} color="#ea580c" />
              </View>
              <View style={{ flex: 1 }}>
                <MarathiText bold size={16} color="#1f2937">
                  {notice.title}
                </MarathiText>
                <MarathiText size={14} color="#4b5563" style={{ marginVertical: 4 }}>
                  {notice.content}
                </MarathiText>
                <MarathiText size={12} color="#9ca3af">
                  {new Date(notice.created_at).toLocaleDateString()}
                </MarathiText>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: { padding: 8, marginRight: 12, backgroundColor: "#f3f4f6", borderRadius: 12 },
  content: { padding: 20 },
  inputCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  submitBtn: { backgroundColor: "#ea580c", padding: 14, borderRadius: 12, alignItems: "center" },
  noticeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  noticeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff7ed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
});
