import { MarathiText } from "@/components/MarathiText";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { addGrade, batchAddGrades, getGradesByClassAndSubject } from "@/services/databaseService";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import * as Crypto from "expo-crypto";

export default function AddMarksScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Selection state
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  
  // Metadata state
  const [subject, setSubject] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [examType, setExamType] = useState("Unit Test");
  
  // Marks state: Map of studentId -> { marks, id }
  const [marksMap, setMarksMap] = useState<Record<string, { marks: string; id?: string }>>({});
  const [fetchingGrades, setFetchingGrades] = useState(false);
  const [saving, setSaving] = useState(false);

  const exams = ["Unit Test", "Semester 1", "Semester 2", "Internal"];

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      if (!user) return;
      try {
        const classList = await attendanceRepo.getClassesForTeacher(user.id);
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClassId(classList[0].id);
        }
      } catch (e) {
        console.error("Failed to load classes", e);
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, [user]);

  // Load students when class changes
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClassId) return;
      setLoading(true);
      try {
        const studentList = await attendanceRepo.getStudentsForClass(selectedClassId);
        setStudents(studentList);
        setMarksMap({});
      } catch (e) {
        console.error("Failed to load students", e);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [selectedClassId]);

  // Load existing grades when metadata changes
  useEffect(() => {
    const loadExistingGrades = async () => {
      if (!selectedClassId || !subject || !examType) return;
      setFetchingGrades(true);
      try {
        const existingGrades = await getGradesByClassAndSubject(selectedClassId, subject, examType);
        const newMap: Record<string, { marks: string; id: string }> = {};
        existingGrades.forEach((g: any) => {
          newMap[g.student_id] = { marks: g.marks.toString(), id: g.id };
        });
        setMarksMap(newMap);
      } catch (e) {
        console.error("Failed to load existing grades", e);
      } finally {
        setFetchingGrades(false);
      }
    };
    const timer = setTimeout(loadExistingGrades, 500); // Debounce
    return () => clearTimeout(timer);
  }, [selectedClassId, subject, examType]);

  const handleSaveAll = async () => {
    if (!subject || !totalMarks) {
      Alert.alert("त्रुटी", "कृपया विषय आणि एकूण गुण भरा.");
      return;
    }

    const marksToSave = Object.entries(marksMap)
      .filter(([_, data]) => data.marks !== "")
      .map(([studentId, data]) => ({
        id: data.id || Crypto.randomUUID(),
        studentId,
        subject,
        marks: parseInt(data.marks),
        totalMarks: parseInt(totalMarks),
        examType,
        date: new Date().toISOString().split("T")[0],
      }));

    if (marksToSave.length === 0) {
      Alert.alert("सूचना", "कृपया किमान एका विद्यार्थ्याचे गुण भरा.");
      return;
    }

    // Validation: marks <= totalMarks
    const invalid = marksToSave.find(m => m.marks > m.totalMarks);
    if (invalid) {
      const student = students.find(s => s.id === invalid.studentId);
      Alert.alert("त्रुटी", `${student?.name} चे गुण एकूण गुणांपेक्षा जास्त असू शकत नाहीत.`);
      return;
    }

    setSaving(true);
    try {
      await batchAddGrades(marksToSave);
      Alert.alert("यशस्वी", "सर्व गुण यशस्वीरित्या जतन केले गेले आहेत.");
      // Refresh to get new IDs
      const existingGrades = await getGradesByClassAndSubject(selectedClassId, subject, examType);
      const newMap: Record<string, { marks: string; id: string }> = {};
      existingGrades.forEach((g: any) => {
        newMap[g.student_id] = { marks: g.marks.toString(), id: g.id };
      });
      setMarksMap(newMap);
    } catch (e) {
      Alert.alert("त्रुटी", "गुण जतन करताना अडचण आली.");
    } finally {
      setSaving(false);
    }
  };

  const updateMark = (studentId: string, val: string) => {
    setMarksMap(prev => ({ 
      ...prev, 
      [studentId]: { ...prev[studentId], marks: val } 
    }));
  };

  if (loading && classes.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#059669" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#059669">
          गुण भरा (Add Marks)
        </MarathiText>
        <TouchableOpacity onPress={handleSaveAll} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#059669" /> : <MaterialCommunityIcons name="check-all" size={28} color="#059669" />}
        </TouchableOpacity>
      </View>

      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        {/* Metadata Configuration Section */}
        <View style={styles.configSection}>
          <View style={styles.configCard}>
             <View style={styles.formGroup}>
              <MarathiText size={14} color="#6b7280" style={{ marginBottom: 8 }}>वर्ग निवडा (Select Class)</MarathiText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classChips}>
                {classes.map(c => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={[styles.classChip, selectedClassId === c.id && styles.activeClassChip]}
                    onPress={() => setSelectedClassId(c.id)}
                  >
                    <MarathiText color={selectedClassId === c.id ? "#fff" : "#059669"}>{c.class_name}</MarathiText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <MarathiText size={14} color="#6b7280" style={{ marginBottom: 8 }}>विषय (Subject)</MarathiText>
              <TextInput
                style={styles.fieldInput}
                placeholder="उदा. मराठी, गणित, इंग्रजी"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                 <MarathiText size={14} color="#6b7280" style={{ marginBottom: 8 }}>प्रकार (Exam)</MarathiText>
                 <View style={styles.smallChips}>
                   {exams.map(e => (
                     <TouchableOpacity 
                       key={e} 
                       style={[styles.smallChip, examType === e && styles.activeSmallChip]}
                       onPress={() => setExamType(e)}
                     >
                       <MarathiText size={12} color={examType === e ? "#fff" : "#059669"}>{e}</MarathiText>
                     </TouchableOpacity>
                   ))}
                 </View>
              </View>
              <View style={{ width: 100, marginLeft: 16 }}>
                 <MarathiText size={14} color="#6b7280" style={{ marginBottom: 8 }}>एकूण गुण</MarathiText>
                 <TextInput
                  style={styles.fieldInput}
                  keyboardType="numeric"
                  value={totalMarks}
                  onChangeText={setTotalMarks}
                />
              </View>
            </View>
          </View>
          <View style={styles.listHeader}>
             <MarathiText bold size={18} color="#1f2937">विद्यार्थी यादी ({students.length})</MarathiText>
             <MarathiText size={12} color="#6b7280">रोल नं. आणि मिळालेले गुण</MarathiText>
          </View>
        </View>

        {/* Students List */}
        <View style={styles.listContainer}>
          {loading || fetchingGrades ? (
             <ActivityIndicator style={{ marginTop: 40 }} color="#059669" />
          ) : students.length === 0 ? (
             <MarathiText style={styles.emptyText}>या वर्गात विद्यार्थी नाहीत.</MarathiText>
          ) : (
            students.map((student) => (
              <View key={student.id} style={styles.studentGradeRow}>
                <View style={{ flex: 1 }}>
                  <MarathiText bold size={16} color="#1f2937">{student.name}</MarathiText>
                  <MarathiText size={12} color="#6b7280">हजेरी क्रमांक: {student.roll_number}</MarathiText>
                </View>
                <View style={styles.markInputContainer}>
                  <TextInput
                    style={styles.markInput}
                    keyboardType="numeric"
                    placeholder="--"
                    value={marksMap[student.id]?.marks || ""}
                    onChangeText={(val) => updateMark(student.id, val)}
                  />
                  <MarathiText size={14} color="#9ca3af"> / {totalMarks}</MarathiText>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity 
          style={[styles.saveAllBtn, (saving || students.length === 0) && styles.disabledBtn]} 
          onPress={handleSaveAll}
          disabled={saving || students.length === 0}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MarathiText bold size={18} color="#fff">सर्व जतन करा (Save All Marks)</MarathiText>
          )}
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  backBtn: { padding: 4 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  configSection: { backgroundColor: "#f3f4f6" },
  configCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 2,
    marginBottom: 8,
  },
  formGroup: { marginBottom: 16 },
  row: { flexDirection: "row" },
  fieldInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  classChips: { gap: 8, paddingVertical: 4 },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#059669",
    backgroundColor: "#fff",
  },
  activeClassChip: { backgroundColor: "#059669" },
  smallChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#059669",
  },
  activeSmallChip: { backgroundColor: "#059669" },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listContainer: { paddingHorizontal: 16 },
  studentGradeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 1,
  },
  markInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  markInput: {
    width: 45,
    height: 40,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
  },
  saveAllBtn: {
    margin: 20,
    height: 56,
    backgroundColor: "#059669",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  disabledBtn: { backgroundColor: "#9ca3af" },
  emptyText: { textAlign: "center", marginTop: 40, color: "#6b7280" },
});
