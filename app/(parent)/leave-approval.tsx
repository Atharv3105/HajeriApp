import { MarathiText } from "@/components/MarathiText";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { leaveRepo } from "@/services/db/leaveRepo";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LeaveApprovalScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<
    {
      id: string;
      student_name: string;
      reason_text: string | null;
      from_date: string;
      to_date: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // Parents are logged in with role='parent' and a linked 'studentId' in the user object
    const studentId = (user as any)?.studentId;
    if (!studentId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    try {
      const rows = await leaveRepo.getPendingForStudent(studentId);
      setRequests(rows);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const [editedReasons, setEditedReasons] = useState<Record<string, string>>({});

  const handleApprove = async (id: string) => {
    const customReason = editedReasons[id];
    await leaveRepo.parentApprove(id, customReason);
    Alert.alert("Success", "Leave approved and sent to teacher.");
    await load();
  };

  const handleReject = async (id: string) => {
    await leaveRepo.reject(id, "Rejected by parent", "parent");
    Alert.alert("Updated", "Leave request rejected.");
    await load();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(parent)/attendance-history")} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#db2777" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#db2777">
          Leave Management
        </MarathiText>
        <TouchableOpacity onPress={() => router.push("/(student)/leave-request")}>
          <MaterialCommunityIcons name="plus-circle-outline" size={28} color="#db2777" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#db2777" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <MarathiText bold size={18}>
                {item.student_name}
              </MarathiText>
              <MarathiText size={14} color="#6b7280" style={{ marginTop: 8 }}>
                {item.from_date} ते {item.to_date}
              </MarathiText>

              <TextInput
                style={styles.reasonInput}
                defaultValue={item.reason_text || ""}
                onChangeText={(text) => setEditedReasons(prev => ({ ...prev, [item.id]: text }))}
                placeholder="रजेचे कारण बदला (हवे असल्यास)"
                multiline
              />

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(item.id)}
                >
                  <MarathiText bold color="#dc2626">
                    Reject
                  </MarathiText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item.id)}
                >
                  <MarathiText bold color="#fff">
                    Approve
                  </MarathiText>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <MarathiText color="#64748b">No pending requests.</MarathiText>
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
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backBtn: { padding: 8 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, gap: 12 },
  rejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  approveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#059669",
  },
  empty: { alignItems: "center", paddingTop: 48 },
  reasonInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    fontSize: 14,
    color: "#374151",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});
