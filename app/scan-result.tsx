import { MarathiText } from "@/components/MarathiText";
import { StudentCard } from "@/components/StudentCard";
import { t } from "@/localization";
import { getStudents, getStudentsByClass, bulkSaveAttendance, AttendanceRecord } from "@/services/databaseService";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { leaveRepo } from "@/services/db/leaveRepo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ScanResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const className = params.className as string;
  const timeSlot = params.timeSlot as string;
  const subject = params.subject as string;
  const [students, setStudents] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [approvedLeaveIds, setApprovedLeaveIds] = useState<string[]>([]);

  const detectedIds = useMemo(() => {
    if (!params.detected) return [];
    try {
      return JSON.parse(String(params.detected));
    } catch {
      return [];
    }
  }, [params.detected]);

  useEffect(() => {
    const load = async () => {
        const today = new Date().toISOString().split('T')[0];
        if (className) {
            const rows = await getStudentsByClass(className);
            setStudents(rows);
            
            try {
                const leaveIds = await leaveRepo.getApprovedLeaveStudentIds(className, today);
                setApprovedLeaveIds(leaveIds);
            } catch (err) {
                console.error("Failed to fetch approved leaves:", err);
            }
        } else {
            getStudents().then(setStudents);
        }
    };
    load();
  }, [className]);

  const missingStudents = students.filter(
    (student) => !detectedIds.includes(student.id),
  );

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString();
        
        const records: AttendanceRecord[] = students.map(s => {
            const isDetected = detectedIds.includes(s.id);
            const isOnLeave = !isDetected && approvedLeaveIds.includes(s.id);
            
            return {
                id: `ATT-${s.id}-${Date.now()}`,
                studentId: s.id,
                date,
                time,
                status: isDetected ? "Present" : (isOnLeave ? "Leave" : "Absent"),
                confidence: 1.0,
                className: className || s.className,
                timeSlot: timeSlot || "General",
                subject: subject || "General",
                method: isDetected ? "Face" : (isOnLeave ? "Approved Leave" : "Manual")
            };
        });

        await bulkSaveAttendance(records);

        // Trigger parent notifications
        try {
            await attendanceRepo.sendAttendanceNotifications(records as any);
        } catch (notifierError) {
            console.warn("Notification engine failed:", notifierError);
        }

        Alert.alert("यशस्वी (Success)", "हजेरी जतन केली गेली आहे.");
        router.replace("/(app)/dashboard");
    } catch (e: any) {
        console.error("Auto Save Error:", e);
        Alert.alert("साठवण्यात चूक (Save Error)", `हजेरी साठवता आली नाही. \n\nतांत्रिक त्रुटी (Technical Error): ${e?.message || JSON.stringify(e)}`);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <MarathiText bold size={24} color="#0f172a">हजेरी निकाल ({className})</MarathiText>
          <MarathiText size={14} color="#64748b">{subject} • {timeSlot}</MarathiText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsCard}>
            <View style={styles.stat}>
                <MarathiText bold size={20} color="#0d9488">{detectedIds.length}</MarathiText>
                <MarathiText size={12} color="#64748b">Present</MarathiText>
            </View>
            <View style={[styles.stat, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0' }]}>
                <MarathiText bold size={20} color="#dc2626">{missingStudents.length}</MarathiText>
                <MarathiText size={12} color="#64748b">Absent</MarathiText>
            </View>
            <View style={styles.stat}>
                <MarathiText bold size={20} color="#0f172a">{students.length}</MarathiText>
                <MarathiText size={12} color="#64748b">Total</MarathiText>
            </View>
        </View>

        <View style={{ marginBottom: 20 }}>
            <MarathiText bold size={18} color="#0f172a" style={{ marginBottom: 12 }}>पडताळणी करा (Missing Students)</MarathiText>
            {missingStudents.length === 0 ? (
                <View style={styles.emptyBox}>
                    <MaterialCommunityIcons name="check-decagram" size={32} color="#10b981" />
                    <MarathiText color="#10b981" style={{ marginTop: 8 }}>All students are present!</MarathiText>
                </View>
            ) : (
                missingStudents.slice(0, 10).map((student) => {
                    const isOnLeave = approvedLeaveIds.includes(student.id);
                    return (
                        <StudentCard
                          key={student.id}
                          name={student.name}
                          rollNumber={student.rollNumber}
                          status={isOnLeave ? (t("history.leave") || "Leave") : t("scan.missing")}
                          badgeColor={isOnLeave ? "#d97706" : "#dc2626"}
                        />
                    );
                })
            )}
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveAttendance}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : (
            <>
                <MaterialCommunityIcons name="content-save-check" size={24} color="#fff" style={{ marginRight: 8 }} />
                <MarathiText bold size={18} color="#fff">
                    हजेरी जतन करा (Save Attendance)
                </MarathiText>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualBtn}
          onPress={() =>
            router.push({
              pathname: "/manual-verification",
              params: {
                missing: JSON.stringify(missingStudents.map(s => s.id)),
                detected: JSON.stringify(detectedIds),
                className,
                timeSlot,
                subject
              },
            } as any)
          }
        >
          <MarathiText bold size={16} color="#0d9488">
             मॅन्युअली बदला (Manual Override)
          </MarathiText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  content: { padding: 20 },
  statsCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 24, elevation: 4 },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { backgroundColor: "#0d9488", borderRadius: 20, paddingVertical: 18, alignItems: "center", flexDirection: 'row', justifyContent: 'center', elevation: 4 },
  manualBtn: { marginTop: 16, padding: 12, alignItems: "center" },
  emptyBox: { backgroundColor: '#ecfdf5', padding: 30, borderRadius: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#10b981' }
});
