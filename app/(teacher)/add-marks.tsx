import { MarathiText } from "@/components/MarathiText";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { addGrade } from "@/services/databaseService";
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
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Marks state
  const [marks, setMarks] = useState("");
  const [subject, setSubject] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [examType, setExamType] = useState("Unit Test");
  const [className, setClassName] = useState("");

  const exams = ["Unit Test", "Semester 1", "Semester 2", "Internal"];

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const classes = await attendanceRepo.getClassesForTeacher(user.id);
        const activeClass = classes[0];
        if (activeClass) {
          setClassName(activeClass.class_name);
          const studentList = await attendanceRepo.getStudentsForClass(activeClass.id);
          setStudents(studentList);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!subject || !totalMarks || !marks) {
      Alert.alert("त्रुटी", "कृपया सर्व माहिती भरा.");
      return;
    }

    try {
      const date = new Date().toISOString().split("T")[0];
      await addGrade({
        id: Crypto.randomUUID(),
        studentId: selectedStudent.id,
        subject,
        marks: parseInt(marks),
        totalMarks: parseInt(totalMarks),
        examType,
        date,
      });
      
      Alert.alert("यशस्वी", `${selectedStudent.name} चे गुण जतन केले गेले आहेत.`);
      setSelectedStudent(null);
      setMarks("");
    } catch (e) {
      Alert.alert("त्रुटी", "गुण जतन करताना अडचण आली.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (selectedStudent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.backBtn}>
            <MaterialCommunityIcons name="close" size={28} color="#059669" />
          </TouchableOpacity>
          <MarathiText bold size={20} color="#059669">
            {selectedStudent.name} - गुण भरा
          </MarathiText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.formContent}>
          <View style={styles.formGroup}>
            <MarathiText size={14} color="#6b7280" style={{ marginBottom: 8 }}>विषय (Subject)</MarathiText>
            <TextInput
              style={styles.fieldInput}
              placeholder="उदा. मराठी, गणित, इंग्रजी"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.formGroup}>
            <MarathiText size={14} color="#6b7280" style={{ marginBottom: 8 }}>परीक्षेचा प्रकार (Exam Type)</MarathiText>
            <View style={styles.chips}>
              {exams.map(e => (
                <TouchableOpacity 
                  key={e} 
                  style={[styles.chip, examType === e && styles.activeChip]}
                  onPress={() => setExamType(e)}
                >
                  <MarathiText color={examType === e ? "#fff" : "#059669"}>{e}</MarathiText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.marksRow}>
            <View style={{ flex: 1 }}>
              <MarathiText size={14} color="#6b7280" style={{ marginBottom: 8 }}>मिळालेले गुण</MarathiText>
              <TextInput
                style={[styles.fieldInput, { fontSize: 24, fontWeight: 'bold' }]}
                keyboardType="numeric"
                placeholder="0"
                value={marks}
                onChangeText={setMarks}
              />
            </View>
            <View style={{ width: 100, marginLeft: 20 }}>
              <MarathiText size={14} color="#6b7280" style={{ marginBottom: 8 }}>एकूण गुण</MarathiText>
              <TextInput
                style={[styles.fieldInput, { color: '#6b7280' }]}
                keyboardType="numeric"
                value={totalMarks}
                onChangeText={setTotalMarks}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <MarathiText bold size={18} color="#fff">गुण जतन करा (Save Marks)</MarathiText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#059669" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#059669">
          विद्यार्थी निवडा ({className})
        </MarathiText>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.studentCard} 
            onPress={() => setSelectedStudent(item)}
          >
            <View style={{ flex: 1 }}>
              <MarathiText bold size={18}>{item.name}</MarathiText>
              <MarathiText size={14} color="#6b7280">हजेरी क्रमांक: {item.roll_number}</MarathiText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#d1d5db" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backBtn: { padding: 8 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16 },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 2,
  },
  formContent: { padding: 24 },
  formGroup: { marginBottom: 24 },
  fieldInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#059669",
    backgroundColor: "#fff",
  },
  activeChip: {
    backgroundColor: "#059669",
  },
  marksRow: { flexDirection: "row", marginBottom: 32 },
  saveBtn: {
    height: 56,
    backgroundColor: "#059669",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});
