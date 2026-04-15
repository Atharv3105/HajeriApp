import { MarathiText } from "@/components/MarathiText";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ParentAlertsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<
    {
      id: number;
      title_mr: string;
      body_mr: string;
      created_at: string;
    }[]
  >([]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      
      let currentStudentId = user.studentId;

      // CRITICAL FALLBACK: If studentId is missing (stale session), 
      // attempt to recover it using the parent's phone number
      if (!currentStudentId && user.phone) {
        try {
          const students = await attendanceRepo.getStudentsByParentPhone(user.phone);
          if (students.length > 0) {
            currentStudentId = students[0].id;
            // Update the store so navigation/subsequent loads work correctly
            useAuthStore.getState().setUser({ ...user, studentId: currentStudentId }, useAuthStore.getState().token || "");
            console.log("[Alerts] Successfully recovered missing student context for parent.");
          }
        } catch (e) {
          console.error("[Alerts] Failed to recover studentId", e);
        }
      }

      if (!currentStudentId) return;

      try {
        const items = await attendanceRepo.getParentNotifications(currentStudentId);
        setNotifications(items);
      } catch (error) {
        console.error("[Alerts] Failed to load notifications", error);
      }
    };
    loadNotifications();
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(parent)/dashboard" as any)} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#0f172a">
          सूचना (Alerts)
        </MarathiText>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const timestamp = new Date(item.created_at).toLocaleString("mr-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          });
          return (
            <View style={styles.card}>
              <View style={styles.cardAccent} />
              <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="bell-badge-outline" size={20} color="#db2777" />
                    </View>
                    <MarathiText size={12} color="#9ca3af">{timestamp}</MarathiText>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <MarathiText bold size={17} color="#111827" style={{ marginBottom: 4 }}>
                      {item.title_mr}
                    </MarathiText>
                    <MarathiText size={14} color="#4b5563" style={{ lineHeight: 20 }}>
                      {item.body_mr}
                    </MarathiText>
                  </View>

                  <View style={styles.cardFooter}>
                    <MarathiText bold size={11} color="#db2777">नवीन सूचना (New Update)</MarathiText>
                  </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off-outline" size={60} color="#e5e7eb" />
            <MarathiText bold size={18} color="#9ca3af" style={{ marginTop: 16 }}>कोणतीही सूचना नाही</MarathiText>
            <MarathiText size={14} color="#d1d5db">येथे तुम्हाला तुमच्या पाल्याशी संबंधित सूचना मिळतील.</MarathiText>
          </View>
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
    borderBottomColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  backBtn: {
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
  },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardAccent: { width: 6, backgroundColor: '#db2777' },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fdf2f8', justifyContent: 'center', alignItems: 'center' },
  cardBody: { marginBottom: 16 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#f9fafb', paddingTop: 12 },
  emptyState: { padding: 60, alignItems: "center", marginTop: 40 },
});
