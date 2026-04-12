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

  // Form state
  const [day, setDay] = useState("Monday");
  const [period, setPeriod] = useState("1");
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const load = async () => {
    if (!user) return;
    try {
      const classes = await attendanceRepo.getClassesForTeacher(user.id);
      const activeClass = classes[0]?.class_name;
      if (!activeClass) {
        setEntries([]);
        return;
      }
      setClassName(activeClass);
      const rows = await featureRepo.getTimetableForClass(activeClass);
      setEntries(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

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
        room
    });
    setSubject("");
    setRoom("");
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Confirm", "Delete this entry?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: 'destructive', onPress: async () => {
            await featureRepo.deleteTimetableEntry(id);
            load();
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
        <MarathiText bold size={20} color="#1f2937">
          {className} वेळापत्रक (Timetable)
        </MarathiText>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {Object.keys(grouped).length === 0 ? (
            <View style={styles.empty}>
              <MarathiText color="#64748b">No entries found for {className}. Click + to add.</MarathiText>
            </View>
          ) : (
            days.filter(d => grouped[d]).map((day) => (
              <View key={day} style={styles.dayCard}>
                <MarathiText bold size={18} color="#059669" style={{ marginBottom: 8 }}>
                  {day}
                </MarathiText>
                {grouped[day].map((row) => (
                  <View key={row.id} style={styles.row}>
                    <View style={styles.periodBadge}>
                        <MarathiText bold size={12} color="#fff">P{row.period_number}</MarathiText>
                    </View>
                    <MarathiText bold size={16} color="#1e293b" style={{ flex: 1 }}>
                      {row.subject}
                    </MarathiText>
                    <MarathiText size={14} color="#64748b">{row.room || ""}</MarathiText>
                    <TouchableOpacity onPress={() => handleDelete(row.id)} style={{ marginLeft: 12 }}>
                        <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <MarathiText bold size={20} color="#1e293b" style={{ marginBottom: 20 }}>नवीन वेळापत्रक नोंद (New Entry)</MarathiText>
                  
                  <View style={styles.inputRow}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                          <MarathiText size={14} color="#64748b">Day</MarathiText>
                          <View style={styles.pickerWrapper}>
                              {days.map(d => (
                                  <TouchableOpacity key={d} onPress={() => setDay(d)} style={[styles.dayChip, day === d && styles.activeChip]}>
                                      <MarathiText size={12} color={day === d ? "#fff" : "#64748b"}>{d.slice(0,3)}</MarathiText>
                                  </TouchableOpacity>
                              ))}
                          </View>
                      </View>
                  </View>

                  <View style={styles.formGroup}>
                    <MarathiText size={14} color="#64748b">Period Number</MarathiText>
                    <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        value={period} 
                        onChangeText={setPeriod} 
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <MarathiText size={14} color="#64748b">Subject (विषय)</MarathiText>
                    <TextInput 
                        style={styles.input} 
                        placeholder="उदा. मराठी, गणित" 
                        value={subject} 
                        onChangeText={setSubject} 
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <MarathiText size={14} color="#64748b">Room (जागा/खोली)</MarathiText>
                    <TextInput 
                        style={styles.input} 
                        placeholder="उदा. Room 1" 
                        value={room} 
                        onChangeText={setRoom} 
                    />
                  </View>

                  <View style={styles.modalActions}>
                      <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                          <MarathiText bold color="#64748b">Cancel</MarathiText>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleAdd} style={styles.confirmBtn}>
                          <MarathiText bold color="#fff">Save</MarathiText>
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
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16 },
  empty: { backgroundColor: "#fff", borderRadius: 16, padding: 40, alignItems: "center" },
  dayCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  row: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 },
  periodBadge: { backgroundColor: "#059669", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 24, padding: 24 },
  formGroup: { marginBottom: 16 },
  inputRow: { flexDirection: "row", marginBottom: 16 },
  input: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 8, fontSize: 16, color: "#1e293b" },
  pickerWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  dayChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
  activeChip: { backgroundColor: '#10b981' },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 24, gap: 16 },
  cancelBtn: { padding: 12 },
  confirmBtn: { backgroundColor: "#10b981", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});
