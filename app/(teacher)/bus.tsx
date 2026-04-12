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

export default function BusScreen() {
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

  const load = async () => {
    try {
      const rows = await featureRepo.getBusStatus();
      setBuses(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateBusStatus = async (
    routeName: string,
    status: "on_time" | "delayed",
    delayMinutes: number,
  ) => {
    await featureRepo.updateBusStatus(routeName, status, delayMinutes);
    await load();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <MarathiText bold size={20} color="#1f2937">
          Bus Management
        </MarathiText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#0d9488" />
        ) : (
          <>
            <View style={styles.inputCard}>
              <MarathiText bold size={16} color="#374151" style={{ marginBottom: 12 }}>
                Update Route 1
              </MarathiText>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.updateBtn}
                  onPress={() => updateBusStatus("Route 1", "delayed", 15)}
                >
                  <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#fff" />
                  <MarathiText size={14} color="#fff" style={{ marginLeft: 8 }}>
                    Mark Delayed
                  </MarathiText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.updateBtn, { backgroundColor: "#059669" }]}
                  onPress={() => updateBusStatus("Route 1", "on_time", 0)}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                  <MarathiText size={14} color="#fff" style={{ marginLeft: 8 }}>
                    Mark On Time
                  </MarathiText>
                </TouchableOpacity>
              </View>
            </View>

            <MarathiText bold size={18} color="#1f2937" style={{ marginBottom: 12 }}>
              Current Status
            </MarathiText>
            {buses.map((bus) => (
              <View key={bus.id} style={styles.busCard}>
                <MaterialCommunityIcons name="bus" size={32} color="#7c3aed" />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <MarathiText bold size={18} color="#1f2937">
                    {bus.route_name}
                  </MarathiText>
                  <MarathiText
                    size={14}
                    color={bus.status === "delayed" ? "#dc2626" : "#059669"}
                  >
                    {bus.status === "delayed"
                      ? `${bus.delay_minutes} mins delayed`
                      : "On time"}
                  </MarathiText>
                </View>
              </View>
            ))}
          </>
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
  inputCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  updateBtn: {
    flex: 1,
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  busCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});
