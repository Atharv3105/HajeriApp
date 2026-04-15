import { MarathiText } from "@/components/MarathiText";
import { getGradesForStudent } from "@/services/databaseService";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResultsScreen() {
  const router = useRouter();
  const { user, role } = useAuthStore();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const targetId = role === 'parent' ? (user as any).studentId : user.id;
        if (!targetId) return;
        
        const data = await getGradesForStudent(targetId);
        setGrades(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, role]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0d9488" />
        <MarathiText style={{ marginTop: 12 }}>निकाल लोड होत आहे...</MarathiText>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerSection}>
        <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#0d9488" />
            </TouchableOpacity>
            <MarathiText bold size={24} color="#0f172a">परीक्षा निकाल (Exam Results)</MarathiText>
            <View style={{ width: 44 }} />
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={grades}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
            // NOTE: DB returns snake_case keys: exam_type, total_marks
            const examType = item.exam_type || "Unit Test";
            const totalMarks = item.total_marks || 100;
            const percentage = (item.marks / totalMarks) * 100;
            
            let statusColor = "#10b981"; // Green
            if (percentage < 75) statusColor = "#f59e0b"; // Orange
            if (percentage < 40) statusColor = "#ef4444"; // Red

            const examIcon = examType.toLowerCase().includes('unit') ? 'file-document-edit-outline' :
                           examType.toLowerCase().includes('semester') ? 'book-open-variant' : 'trophy-outline';

            return (
                <View style={[styles.card, { borderLeftColor: statusColor }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.subjectInfo}>
                            <View style={[styles.iconBox, { backgroundColor: statusColor + '15' }]}>
                                <MaterialCommunityIcons name={examIcon as any} size={24} color={statusColor} />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <MarathiText size={12} color={statusColor} bold>{examType.toUpperCase()}</MarathiText>
                                <MarathiText bold size={20} color="#1e293b" style={{ marginTop: 2 }}>{item.subject}</MarathiText>
                            </View>
                        </View>
                        <View style={styles.scoreInfo}>
                             <View style={styles.marksRow}>
                                <MarathiText bold size={24} color="#1e293b">{item.marks}</MarathiText>
                                <MarathiText size={14} color="#94a3b8" style={{ marginTop: 6 }}> / {totalMarks}</MarathiText>
                             </View>
                             <MarathiText bold size={13} color={statusColor}>{percentage.toFixed(0)}%</MarathiText>
                        </View>
                    </View>
                    
                    <View style={styles.cardFooter}>
                        <View style={styles.dateInfo}>
                             <MaterialCommunityIcons name="calendar-month" size={14} color="#94a3b8" />
                             <MarathiText size={12} color="#94a3b8" style={{ marginLeft: 4 }}>{item.date}</MarathiText>
                        </View>
                        <TouchableOpacity style={styles.detailsBtn}>
                            <MarathiText bold size={12} color="#0d9488">तपशील पहा</MarathiText>
                            <MaterialCommunityIcons name="chevron-right" size={16} color="#0d9488" />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }}
        ListEmptyComponent={() => (
           <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons name="medal-outline" size={60} color="#e2e8f0" />
              </View>
              <MarathiText bold size={20} color="#94a3b8" style={{ marginTop: 16 }}>अद्याप निकाल उपलब्ध नाहीत</MarathiText>
              <MarathiText size={14} color="#cbd5e1" style={{ textAlign: 'center', marginTop: 8 }}>
                जेव्हा शिक्षक तुमचे गुण अपलोड करतील, तेव्हा ते येथे दिसतील.
              </MarathiText>
           </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  headerSection: { padding: 20, backgroundColor: "#fff", borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, marginBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  list: { paddingBottom: 40 },
  card: { backgroundColor: "#fff", marginHorizontal: 20, marginBottom: 16, borderRadius: 24, padding: 18, borderLeftWidth: 8, elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  subjectInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  scoreInfo: { alignItems: 'flex-end' },
  marksRow: { flexDirection: 'row', alignItems: 'baseline' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 14 },
  dateInfo: { flexDirection: 'row', alignItems: 'center' },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdfa', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  emptyState: { padding: 40, alignItems: "center", marginTop: 80 },
  emptyIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0' }
});
