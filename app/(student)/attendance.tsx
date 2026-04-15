import { MarathiText } from "@/components/MarathiText";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StudentAttendanceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats calculation
  const total = records.length;
  const presentCount = records.filter(r => ['present', 'verified'].includes(r.status?.toLowerCase())).length;
  const absentCount = records.filter(r => r.status?.toLowerCase() === 'absent').length;
  const leaveCount = records.filter(r => r.status?.toLowerCase() === 'leave').length;
  const attendancePercentage = total > 0 ? Math.round(((presentCount + leaveCount) / total) * 100) : 0;

  useEffect(() => {
    if (!user || user.role !== "student") {
      setLoading(false);
      return;
    }
    attendanceRepo
      .getStudentAttendance(user.id)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [user]);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "present" || s === "verified") return "#10b981";
    if (s === "absent") return "#ef4444";
    if (s === "leave") return "#f59e0b";
    return "#64748b";
  };

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === "present" || s === "verified") return "उपस्थित (Present)";
    if (s === "absent") return "अनुपस्थित (Absent)";
    if (s === "leave") return "रजेवर (Leave)";
    return status;
  };

  const getMethodIcon = (method: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    if (method === "face") return "face-recognition";
    if (method === "voice") return "microphone";
    return "account-check";
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(student)/dashboard" as any)} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#db2777" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#0f172a">हजेरी कार्ड (Attendance)</MarathiText>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={records}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* VIBRANT DASHBOARD SECTION */}
            <View style={styles.premiumDashboard}>
                <View style={styles.dashboardTop}>
                    <View style={styles.percentRing}>
                        <MarathiText bold size={32} color="#fff">{attendancePercentage}%</MarathiText>
                        <MarathiText size={10} color="rgba(255,255,255,0.7)" style={{ marginTop: -4 }}>प्रगती</MarathiText>
                    </View>
                    <View style={styles.greetingCol}>
                        <MarathiText bold size={24} color="#fff">नमस्ते, {user?.name.split(' ')[0]}!</MarathiText>
                        <MarathiText size={14} color="rgba(255,255,255,0.8)">आपल्या हजेरीचा ग्राफ खूप चांगला आहे!</MarathiText>
                    </View>
                </View>
                
                <View style={styles.statsRow}>
                    <View style={styles.miniStat}>
                        <MarathiText bold size={18} color="#fff">{presentCount}</MarathiText>
                        <MarathiText size={10} color="rgba(255,255,255,0.6)">हजर</MarathiText>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.miniStat}>
                        <MarathiText bold size={18} color="#fff">{absentCount}</MarathiText>
                        <MarathiText size={10} color="rgba(255,255,255,0.6)">गैरहजर</MarathiText>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.miniStat}>
                        <MarathiText bold size={18} color="#fff">{leaveCount}</MarathiText>
                        <MarathiText size={10} color="rgba(255,255,255,0.6)">रजा</MarathiText>
                    </View>
                </View>
            </View>

            <View style={styles.sectionHeader}>
              <MarathiText bold size={18} color="#1e293b">हजेरीचा इतिहास (History)</MarathiText>
              <MaterialCommunityIcons name="filter-variant" size={20} color="#64748b" />
            </View>
          </>
        }
        renderItem={({ item }) => {
            const status = item.status?.toLowerCase();
            const isPresent = ['present', 'verified'].includes(status);
            const isAbsent = status === 'absent';
            const isLeave = status === 'leave';

            let themeColor = "#94a3b8";
            let statusIcon = "calendar-check";
            if (isPresent) { themeColor = "#10b981"; statusIcon = "check-circle"; }
            if (isAbsent) { themeColor = "#ef4444"; statusIcon = "close-circle"; }
            if (isLeave) { themeColor = "#f59e0b"; statusIcon = "clock-fast"; }

            return (
                <View style={styles.glassCard}>
                    <View style={[styles.statusColumn, { backgroundColor: themeColor }]} />
                    <View style={styles.cardInfo}>
                        <View style={styles.cardMain}>
                            <View style={styles.subjectCol}>
                                <MarathiText bold size={18} color="#0f172a">{item.subject || 'All Subjects'}</MarathiText>
                                <MarathiText size={12} color="#64748b" style={{ marginTop: 2 }}>{item.class_name || 'My Class'}</MarathiText>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: themeColor + '15' }]}>
                                <MaterialCommunityIcons name={statusIcon as any} size={14} color={themeColor} />
                                <MarathiText bold size={11} color={themeColor} style={{ marginLeft: 6 }}>
                                    {getStatusLabel(item.status)}
                                </MarathiText>
                            </View>
                        </View>
                        
                        <View style={styles.cardMeta}>
                            <View style={styles.metaItem}>
                                <MaterialCommunityIcons name="calendar" size={14} color="#94a3b8" />
                                <MarathiText size={12} color="#94a3b8" style={{ marginLeft: 6 }}>{item.date}</MarathiText>
                            </View>
                            <View style={styles.metaItem}>
                                <MaterialCommunityIcons name="clock-outline" size={14} color="#94a3b8" />
                                <MarathiText size={12} color="#94a3b8" style={{ marginLeft: 6 }}>{item.time || item.marked_at || 'N/A'}</MarathiText>
                            </View>
                        </View>
                    </View>
                </View>
            );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={80} color="#e2e8f0" />
            <MarathiText bold size={18} color="#94a3b8" style={{ marginTop: 16 }}>नोंदी सापडल्या नाहीत</MarathiText>
            <MarathiText size={14} color="#cbd5e1">तुमची सध्या कोणतीही नोंद उपलब्ध नाही.</MarathiText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: { padding: 8, backgroundColor: '#fdf2f8', borderRadius: 12 },
  listContent: { paddingBottom: 40 },
  premiumDashboard: {
    margin: 16,
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#db2777', // Deep pink base
    elevation: 8,
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  dashboardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  percentRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  greetingCol: { flex: 1, marginLeft: 20 },
  statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.1)',
      padding: 16,
      borderRadius: 20,
  },
  miniStat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      marginBottom: 16 
  },
  glassCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 24,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusColumn: { width: 6 },
  cardInfo: { flex: 1, padding: 16, paddingLeft: 12 },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  subjectCol: { flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 12,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
