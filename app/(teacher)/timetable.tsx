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
  Modal,
  TextInput,
  Alert,
} from "react-native";

export default function TeacherTimetableScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [className, setClassName] = useState("");
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);

  // Form state
  const [day, setDay] = useState("Monday");
  const [period, setPeriod] = useState("1");
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  const [teacherName, setTeacherName] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const loadClasses = async () => {
    if (!user) return;
    const classes = await attendanceRepo.getClassesForTeacher(user.id);
    setTeacherClasses(classes);
    if (classes.length > 0 && !className) {
      setClassName(classes[0].class_name);
    }
  };

  const loadEntries = async () => {
    if (!className) return;
    setLoading(true);
    try {
      const rows = await featureRepo.getTimetableForClass(className);
      setEntries(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [user]);

  useEffect(() => {
    if (className) loadEntries();
  }, [className]);

  const handleAdd = async () => {
    if (!subject) {
        Alert.alert("त्रुटी", "कृपया विषय प्रविष्ट करा.");
        return;
    }
    await featureRepo.addTimetableEntry({
        className,
        dayOfWeek: day,
        periodNumber: parseInt(period),
        subject,
        room,
        teacherName
    });
    setSubject("");
    setRoom("");
    setTeacherName("");
    setShowModal(false);
    loadEntries();
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Confirm", "Delete this entry?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: 'destructive', onPress: async () => {
            await featureRepo.deleteTimetableEntry(id);
            loadEntries();
        }}
    ]);
  };

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
        <MarathiText bold size={20} color="#1f2937">वेळापत्रक (Timetable)</MarathiText>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.classSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {teacherClasses.map(c => (
                <TouchableOpacity 
                    key={c.id} 
                    style={[styles.classChip, className === c.class_name && styles.activeClassChip]}
                    onPress={() => setClassName(c.class_name)}
                >
                    <MarathiText bold size={14} color={className === c.class_name ? "#fff" : "#64748b"}>
                        {c.class_name}
                    </MarathiText>
                </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {Object.keys(grouped).length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#cbd5e1" />
              <MarathiText color="#64748b" style={{ marginTop: 12 }}>{className} साठी कोणतीही नोंद नाही.</MarathiText>
            </View>
          ) : (
            days.filter(d => grouped[d]).map((day) => (
              <View key={day} style={styles.dayCard}>
                <MarathiText bold size={18} color="#059669" style={{ marginBottom: 12 }}>
                  {day}
                </MarathiText>
                {grouped[day].map((row) => (
                  <View key={row.id} style={styles.row}>
                    <View style={styles.periodBadge}>
                        <MarathiText bold size={14} color="#fff">P{row.period_number}</MarathiText>
                    </View>
                    <View style={{ flex: 1 }}>
                        <MarathiText bold size={16} color="#1e293b">{row.subject}</MarathiText>
                        <MarathiText size={12} color="#64748b">शिक्षक: {row.teacher_name || "N/A"} • खोली: {row.room || "N/A"}</MarathiText>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(row.id)}>
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <MarathiText bold size={20} color="#1e293b" style={{ marginBottom: 20 }}>वेळापत्रक नोंद ({className})</MarathiText>
                  
                  <View style={styles.formGroup}>
                    <MarathiText size={12} color="#64748b">Day (वार)</MarathiText>
                    <View style={styles.pickerWrapper}>
                        {days.map(d => (
                            <TouchableOpacity key={d} onPress={() => setDay(d)} style={[styles.dayChip, day === d && styles.activeChip]}>
                                <MarathiText size={10} color={day === d ? "#fff" : "#64748b"}>{d.slice(0,3)}</MarathiText>
                            </TouchableOpacity>
                        ))}
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <MarathiText size={12} color="#64748b">Period (तास)</MarathiText>
                        <TextInput style={styles.input} keyboardType="numeric" value={period} onChangeText={setPeriod} />
                      </View>
                      <View style={{ flex: 2 }}>
                        <MarathiText size={12} color="#64748b">Subject (विषय)</MarathiText>
                        <TextInput style={styles.input} placeholder="उदा. मराठी" value={subject} onChangeText={setSubject} />
                      </View>
                  </View>

                  <View style={styles.formGroup}>
                    <MarathiText size={12} color="#64748b">Teacher Responsible (विषय शिक्षक)</MarathiText>
                    <TextInput style={styles.input} placeholder="शिक्षकाचे नाव" value={teacherName} onChangeText={setTeacherName} />
                  </View>

                  <View style={styles.formGroup}>
                    <MarathiText size={12} color="#64748b">Room (खोली नंबर)</MarathiText>
                    <TextInput style={styles.input} placeholder="उदा. Room 101" value={room} onChangeText={setRoom} />
                  </View>

                  <View style={styles.modalActions}>
                      <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                          <MarathiText bold color="#64748b">रद्द करा</MarathiText>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleAdd} style={styles.confirmBtn}>
                          <MarathiText bold color="#fff">साठवा</MarathiText>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { padding: 8 },
  addBtn: { backgroundColor: "#10b981", padding: 8, borderRadius: 12 },
  classSelector: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  classChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 10 },
  activeClassChip: { backgroundColor: '#10b981' },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16 },
  empty: { backgroundColor: "#fff", borderRadius: 20, padding: 40, alignItems: "center", marginTop: 40 },
  dayCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2 },
  row: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
  periodBadge: { backgroundColor: "#059669", width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 24, padding: 24 },
  formGroup: { marginBottom: 16 },
  inputRow: { flexDirection: "row", marginBottom: 16 },
  input: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 8, fontSize: 16, color: "#1e293b" },
  pickerWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  dayChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
  activeChip: { backgroundColor: '#10b981' },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 24, gap: 16 },
  cancelBtn: { padding: 12 },
  confirmBtn: { backgroundColor: "#10b981", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});
