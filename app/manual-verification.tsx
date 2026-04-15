import { MarathiText } from "@/components/MarathiText";
import { StudentCard } from "@/components/StudentCard";
import { t } from "@/localization";
import {
    getStudentsByClass,
    bulkSaveAttendance,
    AttendanceRecord
} from "@/services/databaseService";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { leaveRepo } from "@/services/db/leaveRepo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Alert,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from "react-native";

type AttendanceStatus = "Present" | "Absent" | "Verified" | "Leave";

export default function ManualVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const className = params.className as string;
  const timeSlot = params.timeSlot as string;
  const subject = params.subject as string;
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
        try {
            const today = new Date().toISOString().split('T')[0];
            const [rows, leaveIds] = await Promise.all([
                getStudentsByClass(className),
                leaveRepo.getApprovedLeaveStudentIds(className, today).catch(() => [] as string[])
            ]);
            
            setStudents(rows);
            
            // Initialize attendance state
            const initial: Record<string, AttendanceStatus> = {};
            rows.forEach(s => {
                const isDetected = detectedIds.includes(s.id);
                const isOnLeave = !isDetected && leaveIds.includes(s.id);
                initial[s.id] = isDetected ? "Present" : (isOnLeave ? "Leave" : "Absent");
            });
            setAttendance(initial);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, [className, detectedIds]);

  const toggleStatus = (studentId: string) => {
      setAttendance(prev => {
          const current = prev[studentId];
          let next: AttendanceStatus = "Present";
          if (current === "Present") next = "Absent";
          else if (current === "Absent") next = "Leave";
          else next = "Present";
          
          return { ...prev, [studentId]: next };
      });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString();
        
        const records: AttendanceRecord[] = students.map(s => ({
            id: `MAN-${s.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            studentId: s.id,
            date,
            time,
            status: (attendance[s.id] as any) || "Absent",
            confidence: 1.0,
            className: className || s.className,
            timeSlot: timeSlot || "Manual",
            subject: subject || "General"
        }));

        await bulkSaveAttendance(records);

        // Trigger parent notifications
        try {
            await attendanceRepo.sendAttendanceNotifications(records as any);
        } catch (notifierError) {
            console.warn("Notification engine failed:", notifierError);
        }

        Alert.alert("यशस्वी", "हजेरी जतन केली गेली आहे.");
        router.replace("/(app)/dashboard");
    } catch (e: any) {
        console.error("Manual Save Error:", e);
        Alert.alert("साठवण्यात चूक (Save Error)", `हजेरी साठवता आली नाही. \n\nतांत्रिक त्रुटी (Technical Error): ${e?.message || JSON.stringify(e)}`);
    } finally {
        setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNumber.toString().includes(searchQuery)
  );

  if (loading) {
      return (
          <View style={styles.center}>
              <ActivityIndicator size="large" color="#0d9488" />
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0d9488" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <MarathiText bold size={20} color="#0f172a">मॅन्युअली हजेरी (Manual Override)</MarathiText>
            <MarathiText size={14} color="#64748b">{className} • {subject} • {timeSlot}</MarathiText>
          </View>
      </View>

      <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            placeholder="विद्यार्थी शोधा (Search Student...)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
            const status = attendance[item.id];
            let bgColor = "#f1f5f9";
            let textColor = "#475569";
            
            if (status === "Present") { bgColor = "#ecfdf5"; textColor = "#059669"; }
            if (status === "Absent") { bgColor = "#fef2f2"; textColor = "#dc2626"; }
            if (status === "Leave") { bgColor = "#fff7ed"; textColor = "#d97706"; }

            return (
              <TouchableOpacity 
                style={[styles.studentRow, { backgroundColor: bgColor }]}
                onPress={() => toggleStatus(item.id)}
              >
                <View style={{ flex: 1 }}>
                    <View style={styles.rowTop}>
                        <MarathiText bold size={18} color="#1e293b">{item.name}</MarathiText>
                        <View style={styles.rollBadge}>
                            <MarathiText size={12} color="#64748b">Roll {item.rollNumber}</MarathiText>
                        </View>
                    </View>
                </View>
                <View style={styles.statusAction}>
                    <MarathiText bold size={14} color={textColor}>{status}</MarathiText>
                    <MaterialCommunityIcons 
                        name={status === "Present" ? "check-circle" : status === "Absent" ? "close-circle" : "clock-alert"} 
                        size={24} 
                        color={textColor} 
                        style={{ marginLeft: 8 }}
                    />
                </View>
              </TouchableOpacity>
            );
        }}
      />

      <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
            onPress={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#fff" /> : (
                <>
                    <MaterialCommunityIcons name="content-save-check" size={24} color="#fff" />
                    <MarathiText bold size={18} color="#fff" style={{ marginLeft: 12 }}>
                        हजेरी जतन करा (Save All)
                    </MarathiText>
                </>
            )}
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { marginRight: 16, padding: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', margin: 16, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, padding: 12, fontSize: 16, color: '#1e293b' },
  list: { padding: 16, paddingBottom: 100 },
  studentRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  rollBadge: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  statusAction: { flexDirection: 'row', alignItems: 'center', minWidth: 100, justifyContent: 'flex-end' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  saveBtn: { backgroundColor: "#0d9488", height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
