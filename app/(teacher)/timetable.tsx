import { MarathiText } from "@/components/MarathiText";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { featureRepo } from "@/services/db/featureRepo";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function TeacherTimetableScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<
    {
      id: number;
      day_of_week: string;
      period_number: number;
      subject: string;
      room: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const classes = await attendanceRepo.getClassesForTeacher(user.id);
        const classId = classes[0]?.id;
        if (!classId) {
          setEntries([]);
          return;
        }
        const rows = await featureRepo.getTimetableForClass(classId);
        setEntries(rows);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const grouped = useMemo(() => {
    return entries.reduce<Record<string, typeof entries>>((acc, item) => {
      if (!acc[item.day_of_week]) acc[item.day_of_week] = [];
      acc[item.day_of_week].push(item);
      return acc;
    }, {});
  }, [entries]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <MarathiText bold size={20} color="#1f2937">
          Timetable
        </MarathiText>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {Object.keys(grouped).length === 0 ? (
            <View style={styles.empty}>
              <MarathiText color="#64748b">No timetable found.</MarathiText>
            </View>
          ) : (
            Object.entries(grouped).map(([day, rows]) => (
              <View key={day} style={styles.dayCard}>
                <MarathiText bold size={18} color="#1f2937">
                  {day}
                </MarathiText>
                {rows.map((row) => (
                  <View key={row.id} style={styles.row}>
                    <MarathiText size={14} color="#334155">
                      P{row.period_number}
                    </MarathiText>
                    <MarathiText bold size={15} color="#0f172a" style={{ flex: 1 }}>
                      {row.subject}
                    </MarathiText>
                    <MarathiText size={12} color="#64748b">
                      {row.room || "-"}
                    </MarathiText>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf2f8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
  },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16 },
  empty: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  row: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
