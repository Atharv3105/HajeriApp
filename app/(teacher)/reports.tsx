import { MarathiText } from "@/components/MarathiText";
import { reportService } from "@/services/api/reportService";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

const MONTHS = [
  { id: "01", name: "जानेवारी", nameEn: "January" },
  { id: "02", name: "फेब्रुवारी", nameEn: "February" },
  { id: "03", name: "मार्च", nameEn: "March" },
  { id: "04", name: "एप्रिल", nameEn: "April" },
  { id: "05", name: "मे", nameEn: "May" },
  { id: "06", name: "जून", nameEn: "June" },
  { id: "07", name: "जुलै", nameEn: "July" },
  { id: "08", name: "ऑगस्ट", nameEn: "August" },
  { id: "09", name: "सप्टेंबर", nameEn: "September" },
  { id: "10", name: "ऑक्टोबर", nameEn: "October" },
  { id: "11", name: "नोव्हेंबर", nameEn: "November" },
  { id: "12", name: "डिसेंबर", nameEn: "December" },
];

export default function ReportsScreen() {
  const { user } = useAuthStore();
  
  // Selection State
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("All Subjects");

  // Data State
  const [students, setStudents] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  // Performance Summary State
  const [stats, setStats] = useState({ top: 0, atRisk: 0, average: 0 });

  // Load Classes and School Info
  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        const info = await attendanceRepo.getSchoolInfo();
        setSchoolInfo(info || {});

        const classList = await attendanceRepo.getClassesForTeacher(user.id);
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClass(classList[0].class_name);
        }
      } catch (e) {
        console.error("Failed to initialize reports", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // Load Monthly Data
  useEffect(() => {
    const loadData = async () => {
      if (!selectedClass) return;
      setFetching(true);
      try {
        const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
        const yearMonth = `${selectedYear}-${monthStr}`;
        const data = await attendanceRepo.getMonthlyClassAttendanceReport(
            selectedClass, 
            yearMonth,
            selectedSubject === "All Subjects" ? undefined : selectedSubject
        );
        setStudents(data);

        // Calculate Stats
        if (data.length > 0) {
            const top = data.filter(s => s.attendance_percent >= 90).length;
            const risk = data.filter(s => s.attendance_percent < 75).length;
            const avg = Math.round(data.reduce((acc, s) => acc + s.attendance_percent, 0) / data.length);
            setStats({ top, atRisk: risk, average: avg });
        } else {
            setStats({ top: 0, atRisk: 0, average: 0 });
        }

        // Extract subjects present for this class/month
        const history = await attendanceRepo.getClassAttendanceHistory(selectedClass);
        const uniqueSubjects = Array.from(new Set(history.map(h => h.subject).filter(Boolean))) as string[];
        setSubjects(["All Subjects", ...uniqueSubjects]);

      } catch (e) {
        console.error("Failed to load monthly report", e);
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [selectedClass, selectedMonth, selectedYear, selectedSubject]);

  const handleExport = async () => {
    if (students.length === 0) return;
    
    const monthObj = MONTHS.find(m => parseInt(m.id) === selectedMonth);
    const monthLabel = `${monthObj?.name} ${selectedYear} ${selectedSubject !== "All Subjects" ? `(${selectedSubject})` : "(All Subjects)"}`;
    
    // Total sessions recorded in this month for this class
    const totalSessions = students.length > 0 ? students[0].total_count : 0;
    
    await reportService.generateMonthlyReport(
      schoolInfo,
      selectedClass,
      monthLabel,
      students,
      totalSessions
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  const selectedMonthObj = MONTHS.find(m => parseInt(m.id) === selectedMonth);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <MarathiText bold size={24} color="#0f172a">अहवाल (Reports)</MarathiText>
          <MarathiText size={13} color="#64748b">आपल्या वर्गाची प्रगती येथे पहा.</MarathiText>
        </View>
        <TouchableOpacity 
          style={[styles.exportBtn, students.length === 0 && { opacity: 0.5 }]} 
          onPress={handleExport}
          disabled={students.length === 0}
        >
          <MaterialCommunityIcons name="cloud-download" size={20} color="#fff" />
          <MarathiText bold size={12} color="#fff" style={{ marginLeft: 6 }}>Export PDF</MarathiText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* PERFORMANCE SUMMARY CARDS */}
            <View style={styles.summaryGrid}>
                <View style={[styles.summaryBox, { backgroundColor: '#f0fdf4' }]}>
                    <View style={styles.summaryIcon}>
                        <MaterialCommunityIcons name="trending-up" size={18} color="#16a34a" />
                    </View>
                    <MarathiText bold size={20} color="#16a34a">{stats.top}</MarathiText>
                    <MarathiText size={11} color="#16a34a">उत्कृष्ट (Top)</MarathiText>
                </View>

                <View style={[styles.summaryBox, { backgroundColor: '#fef2f2' }]}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#fee2e2' }]}>
                        <MaterialCommunityIcons name="alert-octagon" size={18} color="#dc2626" />
                    </View>
                    <MarathiText bold size={20} color="#dc2626">{stats.atRisk}</MarathiText>
                    <MarathiText size={11} color="#dc2626">जोखमीचे (At Risk)</MarathiText>
                </View>

                <View style={[styles.summaryBox, { backgroundColor: '#eff6ff' }]}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#dbeafe' }]}>
                        <MaterialCommunityIcons name="chart-line" size={18} color="#2563eb" />
                    </View>
                    <MarathiText bold size={20} color="#2563eb">{stats.average}%</MarathiText>
                    <MarathiText size={11} color="#2563eb">सरासरी (Avg)</MarathiText>
                </View>
            </View>

            {/* Selectors */}
            <View style={styles.selectors}>
                {/* Class Selector */}
                <View style={styles.selectorRow}>
                <MarathiText bold size={13} color="#475569" style={styles.selectorLabel}>वर्ग निवड (Class):</MarathiText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {classes.map((c) => (
                    <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, selectedClass === c.class_name && styles.chipActive]}
                        onPress={() => setSelectedClass(c.class_name)}
                    >
                        <MarathiText bold={selectedClass === c.class_name} size={13} color={selectedClass === c.class_name ? "#fff" : "#475569"}>
                        {c.class_name}
                        </MarathiText>
                    </TouchableOpacity>
                    ))}
                </ScrollView>
                </View>

                {/* Subject Selector */}
                <View style={styles.selectorRow}>
                <MarathiText bold size={13} color="#475569" style={styles.selectorLabel}>विषय निवड (Subject):</MarathiText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {subjects.map((sub) => (
                    <TouchableOpacity
                        key={sub}
                        style={[styles.chip, selectedSubject === sub && styles.chipActive]}
                        onPress={() => setSelectedSubject(sub)}
                    >
                        <MarathiText bold={selectedSubject === sub} size={13} color={selectedSubject === sub ? "#fff" : "#475569"}>
                        {sub === "All Subjects" ? "सर्व विषय" : sub}
                        </MarathiText>
                    </TouchableOpacity>
                    ))}
                </ScrollView>
                </View>

                {/* Month Selector */}
                <View style={styles.selectorRow}>
                <MarathiText bold size={13} color="#475569" style={styles.selectorLabel}>महिना निवड (Month):</MarathiText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {MONTHS.map((m) => {
                    const monthVal = parseInt(m.id);
                    return (
                        <TouchableOpacity
                        key={m.id}
                        style={[styles.chip, selectedMonth === monthVal && styles.chipActive]}
                        onPress={() => setSelectedMonth(monthVal)}
                        >
                        <MarathiText bold={selectedMonth === monthVal} size={13} color={selectedMonth === monthVal ? "#fff" : "#475569"}>
                            {m.name}
                        </MarathiText>
                        </TouchableOpacity>
                    );
                    })}
                </ScrollView>
                </View>
            </View>

            <View style={styles.listHeader}>
                <MarathiText bold size={18} color="#1e293b">
                    {selectedMonthObj?.name} {selectedYear} - {selectedClass}
                </MarathiText>
                {students.length > 0 && (
                    <MarathiText size={12} color="#64748b">कार्य दिवस: {students[0].total_count}</MarathiText>
                )}
            </View>

            {fetching && (
                <View style={styles.listLoader}>
                    <ActivityIndicator color="#0d9488" />
                    <MarathiText size={12} color="#94a3b8" style={{ marginTop: 8 }}>माहिती लोड होत आहे...</MarathiText>
                </View>
            )}
          </>
        }
        renderItem={({ item }) => {
            const isRegular = item.attendance_percent >= 75;
            const isTop = item.attendance_percent >= 90;
            let statusColor = "#ef4444";
            if (isTop) statusColor = "#16a34a";
            else if (isRegular) statusColor = "#10b981";

            return (
                <View style={styles.recordCard}>
                    <View style={styles.studentInfo}>
                        <MarathiText bold size={17} color="#0f172a">{item.name}</MarathiText>
                        <View style={styles.rollTag}>
                            <MarathiText size={12} color="#64748b">हजेरी क्र. {item.roll_number}</MarathiText>
                            <View style={styles.dotSeparator} />
                            <MarathiText size={12} color="#64748b">{item.present_count} दिवस हजर</MarathiText>
                        </View>
                    </View>
                    <View style={styles.percentContainer}>
                        <View style={styles.percentTextCol}>
                            <MarathiText bold size={20} color={statusColor}>
                                {item.attendance_percent}%
                            </MarathiText>
                            <MarathiText size={10} color={statusColor} style={{ marginTop: -2 }}>
                                {item.attendance_percent >= 75 ? 'चांगली प्रगती' : 'कमी हजेरी'}
                            </MarathiText>
                        </View>
                        <View style={[styles.statusBar, { backgroundColor: statusColor + '15' }]}>
                            <View style={[styles.statusBarFill, { backgroundColor: statusColor, width: `${item.attendance_percent}%` }]} />
                        </View>
                    </View>
                </View>
            );
        }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="calendar-blank" size={60} color="#e2e8f0" />
            <MarathiText bold size={16} color="#94a3b8" style={{ marginTop: 16 }}>नोंदी सापडल्या नाहीत</MarathiText>
            <MarathiText size={13} color="#cbd5e1">या महिन्यासाठी माहिती उपलब्ध नाही.</MarathiText>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  exportBtn: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectors: {
    backgroundColor: "transparent",
    paddingVertical: 4,
  },
  selectorRow: {
    marginBottom: 12,
  },
  selectorLabel: {
    paddingHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipScroll: {
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipActive: {
    backgroundColor: "#0d9488",
    borderColor: "#0d9488",
    elevation: 2,
  },
  listHeader: {
    padding: 20,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listLoader: {
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    paddingBottom: 40,
  },
  recordCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    flexDirection: "column",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  studentInfo: { marginBottom: 16 },
  rollTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginHorizontal: 8 },
  percentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    gap: 16,
  },
  percentTextCol: {
      alignItems: 'flex-start',
  },
  statusBar: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
  },
  statusBarFill: {
      height: '100%',
      borderRadius: 4,
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
    opacity: 0.5,
  },
});
