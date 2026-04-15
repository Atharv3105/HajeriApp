import { MarathiText } from "@/components/MarathiText";
import { featureRepo } from "@/services/db/featureRepo";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TimetableScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const className = user?.className || "न/अ";

  useEffect(() => {
    const load = async () => {
      if (!user?.className) {
        setLoading(false);
        return;
      }
      try {
        const data = await featureRepo.getTimetableForClass(user.className);
        setEntries(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const groupedEntries = useMemo(() => {
    return entries.reduce((acc, item) => {
      if (!acc[item.day_of_week]) acc[item.day_of_week] = [];
      acc[item.day_of_week].push(item);
      return acc;
    }, {});
  }, [entries]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(app)/dashboard")} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#10b981" />
        </TouchableOpacity>
        <MarathiText bold size={20} color="#1e293b">
          वेळापत्रक ({className})
        </MarathiText>
        <MaterialCommunityIcons name="calendar-clock" size={24} color="#10b981" />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <MarathiText size={16} color="#64748b">
            अद्याप या वर्गासाठी वेळापत्रक उपलब्ध नाही.
          </MarathiText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
            (day) => {
              const dayEntries = (groupedEntries as any)[day];
              if (!dayEntries) return null;

              return (
                <View key={day} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <MarathiText bold size={18} color="#065f46">
                      {day === "Monday" ? "सोमवार" :
                       day === "Tuesday" ? "मंगळवार" :
                       day === "Wednesday" ? "बुधवार" :
                       day === "Thursday" ? "गुरुवार" :
                       day === "Friday" ? "शुक्रवार" : "शनिवार"}
                    </MarathiText>
                  </View>
                  {dayEntries
                    .sort((a: any, b: any) => a.period_number - b.period_number)
                    .map((item: any) => (
                      <View key={item.id} style={styles.entryCard}>
                        <View style={styles.periodBadge}>
                          <MarathiText bold color="#fff">
                            {item.period_number}
                          </MarathiText>
                        </View>
                        <View style={styles.entryInfo}>
                          <MarathiText bold size={16} color="#1e293b">
                            {item.subject}
                          </MarathiText>
                          <MarathiText size={14} color="#64748b">
                            {item.teacher_name}
                          </MarathiText>
                        </View>
                        {item.room && (
                          <View style={styles.roomBadge}>
                            <MarathiText size={12} color="#059669">
                              खोली: {item.room}
                            </MarathiText>
                          </View>
                        )}
                      </View>
                    ))}
                </View>
              );
            }
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdf4" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: { padding: 8 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  content: { padding: 16 },
  daySection: { marginBottom: 24 },
  dayHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#d1fae5",
    borderRadius: 8,
    marginBottom: 12,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  periodBadge: {
    width: 32,
    height: 32,
    backgroundColor: "#10b981",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  entryInfo: { flex: 1 },
  roomBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
  },
});
