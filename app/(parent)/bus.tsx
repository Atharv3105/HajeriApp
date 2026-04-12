import { MarathiText } from "@/components/MarathiText";
import { featureRepo } from "@/services/db/featureRepo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function ParentBusScreen() {
  const router = useRouter();
  const [buses, setBuses] = useState<
    {
      id: number;
      route_name: string;
      status: "on_time" | "delayed";
      delay_minutes: number;
      updated_at: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    featureRepo
      .getBusStatus()
      .then(setBuses)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <MarathiText bold size={20} color="#1f2937">
          Bus Tracking
        </MarathiText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <MarathiText bold size={18} color="#1f2937" style={{ marginBottom: 16 }}>
          Today&apos;s Bus Status
        </MarathiText>

        {loading ? (
          <ActivityIndicator size="large" color="#db2777" />
        ) : buses.length > 0 ? (
          buses.map((bus) => (
            <View
              key={bus.id}
              style={[styles.busCard, bus.status === "delayed" && styles.delayedCard]}
            >
              <View style={styles.busIcon}>
                <MaterialCommunityIcons
                  name="bus"
                  size={32}
                  color={bus.status === "delayed" ? "#dc2626" : "#059669"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <MarathiText bold size={18} color="#1f2937">
                  {bus.route_name}
                </MarathiText>
                <MarathiText
                  size={16}
                  color={bus.status === "delayed" ? "#dc2626" : "#059669"}
                  style={{ marginTop: 4 }}
                >
                  {bus.status === "delayed"
                    ? `${bus.delay_minutes} minutes delayed`
                    : "Running on time"}
                </MarathiText>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bus-alert" size={48} color="#9ca3af" />
            <MarathiText size={16} color="#6b7280" style={{ marginTop: 12 }}>
              No bus data available.
            </MarathiText>
          </View>
        )}
      </ScrollView>
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
  backBtn: { padding: 8, marginRight: 12, backgroundColor: "#f3f4f6", borderRadius: 12 },
  content: { padding: 20 },
  busCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  delayedCard: { borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
  busIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 40 },
});