import { MarathiText } from "@/components/MarathiText";
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
import { getStudentById } from "@/services/databaseService";

export default function ParentTimetableScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const load = async () => {
    if (!user) return;
    try {
      let targetClass = "";
      
      // For parent, we fetch the child's class using the linked studentId
      if ((user as any).studentId) {
          const s = await getStudentById((user as any).studentId);
          if (s) targetClass = s.className;
      }

      if (!targetClass) {
        setEntries([]);
        return;
      }
      
      setClassName(targetClass);
      const rows = await featureRepo.getTimetableForClass(targetClass);
      setEntries(rows);
    } catch (e) {
      console.error("Timetable load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        <TouchableOpacity 
          onPress={() => router.replace("/(app)/dashboard")} 
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#db2777" />
        </TouchableOpacity>
        <MarathiText bold size={20} color="#1e293b">
          वेळापत्रक ({className})
        </MarathiText>
        <MaterialCommunityIcons name="calendar-clock" size={24} color="#db2777" />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#db2777" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information" size={20} color="#db2777" />
              <MarathiText size={14} color="#831843" style={{ marginLeft: 8, flex: 1 }}>
                  तुमच्या मुलाचे चालू आठवड्याचे वेळापत्रक खाली पहा.
              </MarathiText>
          </View>

          {Object.keys(grouped).length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={64} color="#cbd5e1" />
              <MarathiText color="#64748b" style={{ marginTop: 16 }}>या वर्गासाठी अजून वेळापत्रक तयार केलेले नाही.</MarathiText>
            </View>
          ) : (
            days.filter(d => grouped[d]).map((day) => (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                    <MarathiText bold size={18} color="#be185d">{day}</MarathiText>
                </View>
                {grouped[day].map((row) => (
                  <View key={row.id} style={styles.row}>
                    <View style={styles.periodBadge}>
                        <MarathiText bold size={14} color="#fff">P{row.period_number}</MarathiText>
                    </View>
                    <View style={styles.subjectInfo}>
                        <MarathiText bold size={16} color="#1e293b">{row.subject}</MarathiText>
                        <View style={styles.detailsRow}>
                            <MaterialCommunityIcons name="account-tie" size={14} color="#64748b" />
                            <MarathiText size={12} color="#64748b" style={{ marginLeft: 4, marginRight: 12 }}>
                                {row.teacher_name || "N/A"}
                            </MarathiText>
                            <MaterialCommunityIcons name="door-open" size={14} color="#64748b" />
                            <MarathiText size={12} color="#64748b" style={{ marginLeft: 4 }}>
                                {row.room || "N/A"}
                            </MarathiText>
                        </View>
                    </View>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#fce7f3" },
  backBtn: { padding: 8 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16 },
  infoCard: { flexDirection: 'row', backgroundColor: '#fff1f2', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fecdd3', alignItems: 'center' },
  empty: { backgroundColor: "#fff", borderRadius: 24, padding: 60, alignItems: "center", marginTop: 40, elevation: 1 },
  dayCard: { backgroundColor: "#fff", borderRadius: 20, marginBottom: 16, elevation: 2, overflow: 'hidden' },
  dayHeader: { backgroundColor: '#fff1f2', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#fce7f3' },
  row: { padding: 16, flexDirection: "row", alignItems: "center", gap: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  periodBadge: { backgroundColor: "#db2777", width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  subjectInfo: { flex: 1 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});
