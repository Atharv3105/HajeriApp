import { MarathiText } from "@/components/MarathiText";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TeacherNotificationsScreen() {
  const router = useRouter();
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
      try {
        const items = await attendanceRepo.getParentNotifications();
        setNotifications(items);
      } catch (error) {
        console.error(error);
      }
    };
    loadNotifications();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#374151">
          पाठवलेल्या सूचना
        </MarathiText>
        <View style={{ width: 24 }} />
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
              <View style={styles.badge}>
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={styles.cardText}>
                <MarathiText bold size={16} color="#111827">
                  {item.title_mr}
                </MarathiText>
                <MarathiText size={14} color="#6b7280" style={{ marginTop: 6 }}>
                  {item.body_mr}
                </MarathiText>
              </View>
              <MarathiText size={12} color="#9ca3af">
                {timestamp}
              </MarathiText>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <MarathiText size={16} color="#6b7280">
              कोणतीही सूचना पाठवलेली नाही.
            </MarathiText>
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
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
  },
  list: { padding: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardText: { flex: 1 },
  emptyState: { padding: 40, alignItems: "center" },
});
