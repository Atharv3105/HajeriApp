import { MarathiText } from "@/components/MarathiText";
import { t } from "@/localization";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

export default function AttendanceHistoryScreen() {
  const [history, setHistory] = useState<
    {
      date: string;
      class_name: string;
      present: number;
      absent: number;
      total: number;
    }[]
  >([]);

  useEffect(() => {
    attendanceRepo.getAttendanceHistory().then(setHistory);
  }, []);

  const exportCsv = async () => {
    const rows = await attendanceRepo.getAttendanceHistory();
    const csv = [
      "Date,Class,Present,Absent,Total",
      ...rows.map(
        (row) =>
          `${row.date},${row.class_name},${row.present},${row.absent},${row.total}`,
      ),
    ].join("\n");
    const uri = `${FileSystem.documentDirectory}attendance-history.csv`;
    await FileSystem.writeAsStringAsync(uri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(uri, {
      mimeType: "text/csv",
      dialogTitle: "Export Attendance CSV",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <MarathiText bold size={24} color="#0f172a">
            {t("history.title")}
          </MarathiText>
          <TouchableOpacity style={styles.exportButton} onPress={exportCsv}>
            <MarathiText size={14} color="#fff">
              {t("dashboard.exportCsv")}
            </MarathiText>
          </TouchableOpacity>
        </View>
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <MarathiText color="#64748b">{t("common.noStudents")}</MarathiText>
          </View>
        ) : (
          history.map((item) => (
            <View key={item.date} style={styles.historyCard}>
              <MarathiText bold size={16}>
                {item.date}
              </MarathiText>
              <MarathiText size={14} color="#475569">
                {t("history.present")}: {item.present} • {t("history.absent")}:{" "}
                {item.absent}
              </MarathiText>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },
  content: {
    padding: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  exportButton: {
    backgroundColor: "#9333ea",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyState: {
    padding: 28,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
});
