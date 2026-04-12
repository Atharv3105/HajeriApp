import { MarathiText } from "@/components/MarathiText";
import { getGradesForStudent } from "@/services/databaseService";
import { useAuthStore } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResultsScreen() {
  const { user } = useAuthStore();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const data = await getGradesForStudent(user.id);
        setGrades(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MarathiText bold size={24} color="#064e3b">
          निकाल (निकाली गुण)
        </MarathiText>
        <MarathiText size={14} color="#475569">
          तुमची प्रगती खालीलप्रमाणे आहे
        </MarathiText>
      </View>

      <FlatList
        data={grades}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <MarathiText bold size={18} color="#111827">
                {item.subject}
              </MarathiText>
              <MarathiText size={14} color="#6b7280">
                {item.examType} • {item.date}
              </MarathiText>
            </View>
            <View style={styles.scoreBadge}>
              <MarathiText bold size={18} color="#fff">
                {item.marks} / {item.totalMarks}
              </MarathiText>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
           <View style={{ alignItems: 'center', marginTop: 40 }}>
              <MarathiText color="#64748b">अद्याप निकाल उपलब्ध नाहीत.</MarathiText>
           </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ecfeff" },
  header: {
    padding: 20,
    backgroundColor: "#d1fae5",
    borderBottomWidth: 1,
    borderBottomColor: "#bbf7d0",
  },
  list: { padding: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  scoreBadge: {
    backgroundColor: "#0d9488",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
});
