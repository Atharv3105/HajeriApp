import { MarathiText } from "@/components/MarathiText";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TIME_SLOTS = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 01:00",
    "01:00 - 02:00",
    "02:00 - 03:00",
    "03:00 - 04:00",
    "04:00 - 05:00",
];

export default function AttendanceSetupScreen() {
    const router = useRouter();
    const [className, setClassName] = useState("");
    const [subject, setSubject] = useState("");
    const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);

    const handleStartScan = () => {
        if (!className.trim()) {
            return alert("पहिले वर्गाचे नाव भरा (Please enter class name)");
        }
        if (!subject.trim()) {
            return alert("पहिले विषयाचे नाव भरा (Please enter subject name)");
        }
        router.push({
            pathname: "/face-scan",
            params: { 
                className: className.trim(), 
                timeSlot: selectedSlot,
                subject: subject.trim() 
            }
        } as any);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#0d9488" />
                </TouchableOpacity>
                <MarathiText bold size={22} color="#0d9488">उपस्थिती सेटअप (Attendance Setup)</MarathiText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <MarathiText bold size={18} color="#374151" style={{ marginBottom: 12 }}>
                        वर्गाचे नाव निवडा (Select Class)
                    </MarathiText>
                    <View style={styles.inputGroup}>
                        <MaterialCommunityIcons name="google-classroom" size={24} color="#0d9488" style={{ marginRight: 12 }} />
                        <TextInput 
                            placeholder="उदा. 10th A" 
                            style={styles.input} 
                            value={className}
                            onChangeText={setClassName}
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <MarathiText bold size={18} color="#374151" style={{ marginBottom: 12 }}>
                        विषयाचे नाव लिहा (Enter Subject)
                    </MarathiText>
                    <View style={styles.inputGroup}>
                        <MaterialCommunityIcons name="book-open-variant" size={24} color="#0d9488" style={{ marginRight: 12 }} />
                        <TextInput 
                            placeholder="उदा. मराठी, गणित" 
                            style={styles.input} 
                            value={subject}
                            onChangeText={setSubject}
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <MarathiText bold size={18} color="#374151" style={{ marginBottom: 12 }}>
                        वेळ निवडा (Select Time Slot)
                    </MarathiText>
                    <View style={styles.slotGrid}>
                        {TIME_SLOTS.map((slot) => (
                            <TouchableOpacity 
                                key={slot} 
                                style={[styles.slotItem, selectedSlot === slot && styles.slotActive]}
                                onPress={() => setSelectedSlot(slot)}
                            >
                                <MarathiText color={selectedSlot === slot ? "#fff" : "#374151"} size={14}>
                                    {slot}
                                </MarathiText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.startBtn} onPress={handleStartScan}>
                    <MaterialCommunityIcons name="camera-iris" size={28} color="#fff" style={{ marginRight: 12 }} />
                    <MarathiText bold size={20} color="#fff">स्कॅनर सुरू करा (Start Scanner)</MarathiText>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
    backBtn: { marginRight: 16 },
    content: { padding: 20 },
    card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2 },
    inputGroup: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 8 },
    input: { flex: 1, fontSize: 18, color: "#1f2937" },
    slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    slotItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },
    slotActive: { backgroundColor: "#0d9488", borderColor: "#0d9488" },
    startBtn: { backgroundColor: "#0d9488", borderRadius: 28, height: 64, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20, elevation: 4 }
});
