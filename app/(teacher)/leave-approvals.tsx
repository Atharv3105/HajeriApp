import { MarathiText } from "@/components/MarathiText";
import { leaveRepo } from "@/services/db/leaveRepo";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function LeaveApprovalsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<
    {
      id: string;
      student_name: string;
      reason_text: string | null;
      from_date: string;
      to_date: string;
      status: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<{ id: string; class_name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!selectedClassId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    try {
      const rows = await leaveRepo.getPendingForClass(selectedClassId);
      setRequests(rows);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    const loadClasses = async () => {
        if (!user) return;
        try {
            const available = await attendanceRepo.getClassesForTeacher(user.id);
            const uniqueClasses = [...available];
            
            // Check for orphaned/unknown leaves
            const ghostLeaves = await leaveRepo.getPendingForClass("Unknown Class");
            if (ghostLeaves.length > 0) {
                uniqueClasses.push({ id: "Unknown Class", class_name: "अज्ञात (Other)" });
            }

            setClasses(uniqueClasses);
            if (uniqueClasses.length > 0 && !selectedClassId) {
                setSelectedClassId(uniqueClasses[0].id);
            } else if (uniqueClasses.length === 0) {
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
        }
    };
    loadClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClassId) {
        load();
    }
  }, [load, selectedClassId]);

  const handleApprove = async (id: string) => {
    try {
      await leaveRepo.teacherApprove(id);
      Alert.alert("Success", "Leave approved.");
      await load();
    } catch {
      Alert.alert("Error", "Could not approve leave.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await leaveRepo.reject(id, "Rejected by teacher", "teacher");
      Alert.alert("Updated", "Leave rejected.");
      await load();
    } catch {
      Alert.alert("Error", "Could not reject leave.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#0d9488" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#0d9488">
          Leave Approvals
        </MarathiText>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.classSelector}>
        <FlatList
          data={classes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.classTab,
                selectedClassId === item.id && styles.activeClassTab,
              ]}
              onPress={() => setSelectedClassId(item.id)}
            >
              <MarathiText
                bold={selectedClassId === item.id}
                color={selectedClassId === item.id ? "#fff" : "#1f2937"}
              >
                {item.class_name}
              </MarathiText>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0d9488" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MarathiText bold size={18}>
                  {item.student_name}
                </MarathiText>
                <View style={styles.dateTag}>
                  <MarathiText size={12} color="#0d9488">
                    {item.from_date} - {item.to_date}
                  </MarathiText>
                </View>
              </View>
              <MarathiText size={14} color="#6b7280" style={{ marginTop: 8 }}>
                {item.reason_text || "No reason"}
              </MarathiText>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.rejectBtn]}
                  onPress={() => handleReject(item.id)}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#ef4444" />
                  <MarathiText bold color="#ef4444" style={{ marginLeft: 4 }}>
                    Reject
                  </MarathiText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.approveBtn]}
                  onPress={() => handleApprove(item.id)}
                >
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <MarathiText bold color="#fff" style={{ marginLeft: 4 }}>
                    Approve
                  </MarathiText>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="check-circle-outline" size={48} color="#9ca3af" />
              <MarathiText color="#6b7280" style={{ marginTop: 12 }}>
                No pending requests.
              </MarathiText>
            </View>
          )}
        />
      )}
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
  },
  backBtn: { padding: 8 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateTag: {
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, gap: 12 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectBtn: { borderWidth: 1, borderColor: "#ef4444" },
  approveBtn: { backgroundColor: "#0d9488" },
  classSelector: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  classTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  activeClassTab: {
    backgroundColor: "#0d9488",
  },
  empty: { marginTop: 100, alignItems: "center" },
});
