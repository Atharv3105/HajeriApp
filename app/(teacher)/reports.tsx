import { MarathiText } from "@/components/MarathiText";
import { reportService } from "@/services/api/reportService";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<any[]>([]);
  const [className, setClassName] = useState("Class");
  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<any>({});

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const info = await attendanceRepo.getSchoolInfo();
        setSchoolInfo(info || {});

        const classes = await attendanceRepo.getClassesForTeacher(user.id);
        const activeClass = classes[0];
        if (!activeClass) {
          setStudents([]);
          return;
        }
        setClassName(activeClass.class_name);
        const rows = await attendanceRepo.getClassAttendanceReport(activeClass.id);
        setStudents(rows);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleExport = async () => {
    await reportService.generateMonthlyReport(
      schoolInfo,
      className,
      new Date().toLocaleString("mr-IN", { month: "long", year: "numeric" }),
      students,
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MarathiText bold size={22} color="#0d9488">
          Attendance Reports
        </MarathiText>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <MaterialCommunityIcons name="file-pdf-box" size={24} color="#fff" />
          <MarathiText bold size={14} color="#fff" style={{ marginLeft: 8 }}>
            Export
          </MarathiText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0d9488" />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isEligible = item.attendance_percent >= 75;
            return (
              <View style={styles.recordItem}>
                <View style={styles.studentInfo}>
                  <MarathiText bold size={18} color="#1f2937">
                    {item.name}
                  </MarathiText>
                  <MarathiText size={14} color="#6b7280">
                    Roll: {item.roll_number}
                  </MarathiText>
                </View>
                <View style={styles.metricBlock}>
                  <MarathiText
                    bold
                    size={20}
                    color={isEligible ? "#10b981" : "#dc2626"}
                  >
                    {item.attendance_percent}%
                  </MarathiText>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <MarathiText color="#64748b">No attendance data yet.</MarathiText>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 24,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  exportBtn: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16 },
  empty: { alignItems: "center", paddingTop: 48 },
  recordItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  studentInfo: { flex: 1 },
  metricBlock: { alignItems: "flex-end" },
});
