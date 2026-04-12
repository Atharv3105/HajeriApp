import { MarathiText } from "@/components/MarathiText";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StudentAttendanceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<
    {
      date: string;
      class_name: string;
      status: string;
      method: string;
      marked_at: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "student") {
      setLoading(false);
      return;
    }

    attendanceRepo
      .getStudentAttendance(user.id)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [user]);

  const statusLabel = (status: string) => {
    if (status === "present") return "उपस्थित";
    if (status === "absent") return "अनुपस्थित";
    if (status === "leave") return "रजेवर";
    return status;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#064e3b" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#064e3b">
          {t("student.my_attendance")}
        </MarathiText>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyState}>
          <MarathiText size={16} color="#6b7280">
            {t("common.noStudents")}
          </MarathiText>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) =>
            `${item.date}-${item.marked_at}-${item.method}`
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <MarathiText bold size={16}>
                  {item.date}
                </MarathiText>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === "present"
                      ? styles.present
                      : item.status === "absent"
                        ? styles.absent
                        : styles.leave,
                  ]}
                >
                  <MarathiText size={12} color="#fff">
                    {statusLabel(item.status)}
                  </MarathiText>
                </View>
              </View>
              <MarathiText size={14} color="#475569">
                {item.class_name}
              </MarathiText>
              <MarathiText size={12} color="#64748b" style={{ marginTop: 8 }}>
                {item.method === "face"
                  ? "चेहर्‍यावरून नोंद"
                  : item.method === "voice"
                    ? "आवाजाने नोंद"
                    : item.method === "manual"
                      ? "मॅन्युअल नोंद"
                      : "नोंद"}{" "}
                • {item.marked_at}
              </MarathiText>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdf4" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#d1fae5",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: { padding: 8 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 20 },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  present: { backgroundColor: "#10b981" },
  absent: { backgroundColor: "#ef4444" },
  leave: { backgroundColor: "#f59e0b" },
});
