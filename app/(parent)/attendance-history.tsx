import { MarathiText } from "@/components/MarathiText";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AttendanceHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [history, setHistory] = useState<
    { id: string; date: string; status: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.classId) {
      setLoading(false);
      return;
    }

    attendanceRepo
      .getClassAttendanceHistory(user.classId)
      .then((records) => {
        setHistory(
          records.map((record) => ({
            id: record.session_id,
            date: record.date,
            status: record.present >= record.total / 2 ? "present" : "absent",
            label: `${record.present}/${record.total} उपस्थित`,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, [user]);

  const getStatusColor = (status: string) => {
    if (status === "present") return "#059669";
    if (status === "absent") return "#dc2626";
    return "#2563eb";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#db2777" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#db2777">
          हजेरी अहवाल
        </MarathiText>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={history}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <MarathiText color="#64748b">
                कोणतीही हजेरी नोंदी सध्या उपलब्ध नाहीत.
              </MarathiText>
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View>
                <MarathiText bold size={18}>
                  {item.date}
                </MarathiText>
                <MarathiText size={14} color="#6b7280">
                  {item.label}
                </MarathiText>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + "22" },
                ]}
              >
                <MarathiText bold color={getStatusColor(item.status)}>
                  {item.status === "present"
                    ? "उपस्थित"
                    : item.status === "absent"
                      ? "अनुपस्थित"
                      : "रजेवर"}
                </MarathiText>
              </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backBtn: { padding: 8 },
  list: { padding: 20 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 48,
  },
});