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
  Alert,
} from "react-native";

export default function BusScreen() {
  const router = useRouter();
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const ruralRoutes = [
    "गावची मुख्य शाळा बस (Main Village)",
    "पाटील वस्ती मार्ग (vasti route)",
    "हायवे चौक फाटा (Highway Phata)",
    "मळगंगा मंदिर मार्ग (Temple Route)"
  ];

  const load = async () => {
    try {
      const rows = await featureRepo.getBusStatus();
      // Ensure all rural routes exist in DB
      for (const route of ruralRoutes) {
          if (!rows.find(r => r.route_name === route)) {
              await featureRepo.updateBusStatus(route, "on_time", 0);
          }
      }
      const updated = await featureRepo.getBusStatus();
      setBuses(updated);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (routeName: string, status: "on_time" | "delayed", delay: number) => {
    try {
        await featureRepo.updateBusStatus(routeName, status, delay);
        Alert.alert("यशस्वी", "बसची स्थिती अपडेट केली.");
        load();
    } catch (e) {
        Alert.alert("त्रुटी", "अपडेट करताना अडचण आली.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#1f2937">
          बस सेवा व्यवस्थापन (Bus)
        </MarathiText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#eab308" />
        ) : (
          buses.map((bus) => (
            <View key={bus.id} style={styles.busCard}>
              <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="bus" size={32} color="#eab308" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <MarathiText bold size={18} color="#1e293b">{bus.route_name}</MarathiText>
                    <View style={styles.statusRow}>
                        <View style={[styles.dot, { backgroundColor: bus.status === 'on_time' ? '#22c55e' : '#ef4444' }]} />
                        <MarathiText size={14} color={bus.status === 'on_time' ? '#16a34a' : '#dc2626'}>
                            {bus.status === 'on_time' ? "वेळेवर (On Time)" : `${bus.delay_minutes} मि. उशीर (Delayed)`}
                        </MarathiText>
                    </View>
                  </View>
              </View>

              <View style={styles.actionGrid}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { borderColor: '#22c55e' }]} 
                    onPress={() => updateStatus(bus.route_name, "on_time", 0)}
                  >
                    <MaterialCommunityIcons name="bus-side" size={20} color="#16a34a" />
                    <MarathiText bold size={12} color="#16a34a" style={{ marginTop: 4 }}>निघाली / वेळेवर</MarathiText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionBtn, { borderColor: '#3b82f6' }]} 
                    onPress={() => {
                        Alert.alert("Reached", "Confirm status: Reached School?", [
                            { text: "Cancel" },
                            { text: "Confirm", onPress: () => updateStatus(bus.route_name, "on_time", 0) }
                        ]);
                    }}
                  >
                    <MaterialCommunityIcons name="map-marker-check" size={20} color="#2563eb" />
                    <MarathiText bold size={12} color="#2563eb" style={{ marginTop: 4 }}>पोहोचली</MarathiText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, { borderColor: '#ef4444' }]} 
                    onPress={() => updateStatus(bus.route_name, "delayed", 15)}
                  >
                    <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#dc2626" />
                    <MarathiText bold size={12} color="#dc2626" style={{ marginTop: 4 }}>उशीर (Delayed)</MarathiText>
                  </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffbeb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
  },
  backBtn: { padding: 8, marginRight: 12, backgroundColor: "#fef3c7", borderRadius: 12 },
  content: { padding: 16 },
  busCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#fef3c7'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1, backgroundColor: '#fafafa' },
});
