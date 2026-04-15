import { MarathiText } from "@/components/MarathiText";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAttendanceHistory } from "@/services/databaseService";

export default function HistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAttendanceHistory()
            .then(setHistory)
            .finally(() => setLoading(false));
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.historyCard}>
            <View style={styles.cardHeader}>
                <View>
                    <MarathiText bold size={18} color="#1f2937">{item.className} • {item.subject}</MarathiText>
                    <MarathiText size={14} color="#64748b">{item.date}</MarathiText>
                </View>
                <View style={styles.badge}>
                    <MarathiText bold size={12} color="#0d9488">{item.timeSlot}</MarathiText>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <MarathiText bold size={20} color="#059669">{item.present}</MarathiText>
                    <MarathiText size={12} color="#64748b">उपस्थित (Present)</MarathiText>
                </View>
                <View style={[styles.statBox, styles.statDivider]}>
                    <MarathiText bold size={20} color="#dc2626">{item.absent}</MarathiText>
                    <MarathiText size={12} color="#64748b">अनुपस्थित (Absent)</MarathiText>
                </View>
                <View style={[styles.statBox, styles.statDivider]}>
                    <MarathiText bold size={20} color="#1f2937">{item.total}</MarathiText>
                    <MarathiText size={12} color="#64748b">एकूण (Total)</MarathiText>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#0d9488" />
                </TouchableOpacity>
                <MarathiText bold size={22} color="#0d9488">हजेरी इतिहास (History)</MarathiText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0d9488" />
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item, index) => `${item.date}-${item.className}-${item.subject}-${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="history" size={80} color="#cbd5e1" />
                            <MarathiText color="#64748b" size={16} style={{ marginTop: 16 }}>अद्याप एकही हजेरी नोंद सापडली नाही.</MarathiText>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
    backBtn: { marginRight: 16 },
    list: { padding: 20 },
    historyCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    badge: { backgroundColor: "#ccfbf1", paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
    statsRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12 },
    statBox: { flex: 1, alignItems: "center" },
    statDivider: { borderLeftWidth: 1, borderLeftColor: "#f1f5f9" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 }
});
