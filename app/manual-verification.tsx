import { MarathiText } from "@/components/MarathiText";
import { StudentCard } from "@/components/StudentCard";
import { t } from "@/localization";
import {
    getStudentById,
    saveAttendanceRecord,
} from "@/services/databaseService";
import { useSettingsStore } from "@/store/settingsStore";
import { useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

export default function ManualVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const language = useSettingsStore((state) => state.language) || "en";
  const [permission, requestPermission] = useCameraPermissions();
  const [missingStudents, setMissingStudents] = useState<
    { id: string; name: string; rollNumber: number }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [captured, setCaptured] = useState<string[]>([]);

  const className = params.className as string;
  const timeSlot = params.timeSlot as string;

  const missingIds: string[] = useMemo(() => {
    if (!params.missing) return [];
    try {
      return JSON.parse(String(params.missing));
    } catch {
      return [];
    }
  }, [params.missing]);

  useEffect(() => {
    Promise.all(missingIds.map((id) => getStudentById(id))).then((rows) => {
      setMissingStudents(rows.filter(Boolean) as any);
    });
  }, [missingIds]);

  const onRequestPermission = async () => {
    const result = await requestPermission();
    if (result.status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera access is needed for manual verification.",
      );
    }
  };

  const markVerified = async () => {
    const nextId = missingStudents[currentIndex]?.id;
    if (!nextId) return;

    await saveAttendanceRecord({
      id: `MAN-${nextId}-${Date.now()}`,
      studentId: nextId,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString(),
      status: "Verified",
      confidence: 1.0,
      className: className || "General",
      timeSlot: timeSlot || "Manual"
    });

    setCaptured((prev) => [...prev, nextId]);
    setCurrentIndex((prev) => prev + 1);
  };

  const finishVerification = () => {
    Alert.alert("Success", "Manual verification saved locally.", [
      {
        text: "OK",
        onPress: () => router.replace("/(teacher)/history" as any),
      },
    ]);
  };

  const currentStudent = missingStudents[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <MarathiText bold size={24} color="#0f172a">
          {t("manual.title")}
        </MarathiText>
        <MarathiText size={14} color="#475569" style={{ marginBottom: 20 }}>
          {t("manual.instruction")}
        </MarathiText>

        {permission?.status === "granted" ? (
          <View style={styles.cameraPlaceholder}>
            <MarathiText size={14} color="#94a3b8">
              {language === "mr" ? "कॅमेरा तयार आहे" : "Camera ready"}
            </MarathiText>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={onRequestPermission}
          >
            <MarathiText bold size={16} color="#fff">
              {t("common.ok")}
            </MarathiText>
          </TouchableOpacity>
        )}

        <View style={styles.statusBox}>
          <MarathiText size={16} color="#0f172a">
            {currentStudent ? currentStudent.name : t("manual.allDone")}
          </MarathiText>
          <MarathiText size={12} color="#475569">
            {currentStudent
              ? `${t("common.back")} ${currentIndex + 1}/${missingStudents.length}`
              : ""}
          </MarathiText>
        </View>

        {currentStudent ? (
          <TouchableOpacity style={styles.captureButton} onPress={markVerified}>
            <MarathiText bold size={18} color="#fff">
              {t("manual.capture")}
            </MarathiText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={finishVerification}
          >
            <MarathiText bold size={18} color="#fff">
              {t("common.ok")}
            </MarathiText>
          </TouchableOpacity>
        )}

        <MarathiText
          bold
          size={18}
          color="#0f172a"
          style={{ marginTop: 24, marginBottom: 12 }}
        >
          {t("scan.missing")}
        </MarathiText>
        {missingStudents.map((student) => (
          <StudentCard
            key={student.id}
            name={student.name}
            rollNumber={student.rollNumber}
            status={captured.includes(student.id) ? "Verified" : "Pending"}
            badgeColor={captured.includes(student.id) ? "#16a34a" : "#f59e0b"}
          />
        ))}
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
  cameraPlaceholder: {
    height: 220,
    borderRadius: 24,
    backgroundColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#0d9488",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  statusBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  captureButton: {
    backgroundColor: "#0d9488",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
  },
});
