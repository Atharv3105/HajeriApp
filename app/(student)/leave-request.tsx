import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { MarathiText } from "@/components/MarathiText";
import { leaveRepo } from "@/services/db/leaveRepo";
import { useAuthStore } from "@/store/authStore";

export default function LeaveRequestScreen() {
  const router = useRouter();
  const { user, role } = useAuthStore();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Date Logic
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSelectingFrom, setIsSelectingFrom] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  // Simplified Custom Calendar Modal
  const renderCalendar = () => {
    const today = new Date();
    const dates = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    return (
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MarathiText bold size={20} color="#1e293b" style={{ marginBottom: 20 }}>
              तारीख निवडा (Select Date)
            </MarathiText>
            <View style={styles.datesGrid}>
              {dates.map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateChip,
                    (isSelectingFrom ? fromDate : toDate) === date && styles.activeChip,
                  ]}
                  onPress={() => {
                    if (isSelectingFrom) setFromDate(date);
                    else setToDate(date);
                    setShowCalendar(false);
                  }}
                >
                  <MarathiText size={12} color={(isSelectingFrom ? fromDate : toDate) === date ? "#fff" : "#64748b"}>
                    {date.split("-")[2]}/{date.split("-")[1]}
                  </MarathiText>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.closeBtn}>
              <MarathiText bold color="#2563eb">रद्द करा (Close)</MarathiText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const handleSubmit = async () => {
    if (!reason || reason.length < 5) {
      Alert.alert("माहिती भरा", "कृपया रजेचे सविस्तर कारण लिहा (किमान ५ अक्षरे).");
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      Alert.alert("चूक तारीख", "शेवटची तारीख सुरुवातीच्या तारखेच्या आधी असू शकत नाही.");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const targetStudentId = role === "parent" && (user as any).studentId ? (user as any).studentId : user.id;
      let className = (user as any).className || "Unknown Class";

      await leaveRepo.submitRequest(targetStudentId, className, fromDate, toDate, "personal", reason);

      const successMsg = role === "parent"
        ? "रजा अर्ज यशस्वीरित्या शिक्षकांकडे पाठवण्यात आला आहे."
        : "तुमची विनंती पालकांकडे पाठवण्यात आली आहे.";

      Alert.alert("यशस्वी (Success)", successMsg, [
        { text: "ठीक आहे", onPress: () => router.replace("/(student)/attendance") },
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert("त्रुटी (Error)", "विनंती पाठवता आली नाही. कृपया पुन्हा प्रयत्न करा. \n\n" + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(student)/attendance")} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2563eb" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#2563eb">रजा अर्ज (Leave Request)</MarathiText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={24} color="#2563eb" />
          <MarathiText size={14} color="#1e40af" style={{ marginLeft: 12, flex: 1 }}>
            तुमचा रजा अर्ज मंजूर होण्यासाठी पालक आणि शिक्षकांची मान्यता आवश्यक आहे.
          </MarathiText>
        </View>

        <View style={styles.dateSection}>
          <TouchableOpacity 
            style={styles.datePicker} 
            onPress={() => { setIsSelectingFrom(true); setShowCalendar(true); }}
          >
            <MarathiText size={12} color="#64748b">पासून (From Date)</MarathiText>
            <MarathiText bold size={16} color="#1e293b">{fromDate}</MarathiText>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.datePicker} 
            onPress={() => { setIsSelectingFrom(false); setShowCalendar(true); }}
          >
            <MarathiText size={12} color="#64748b">पर्यंत (To Date)</MarathiText>
            <MarathiText bold size={16} color="#1e293b">{toDate}</MarathiText>
          </TouchableOpacity>
        </View>

        <MarathiText bold size={18} color="#374151" style={{ marginBottom: 12 }}>रजेचे कारण (Reason)</MarathiText>
        <TextInput
          style={styles.input}
          placeholder="येथे रजेचे कारण लिहा..."
          multiline
          numberOfLines={6}
          value={reason}
          onChangeText={setReason}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <MaterialCommunityIcons name="send-check" size={24} color="#fff" />
          <MarathiText bold size={20} color="#fff" style={{ marginLeft: 12 }}>
            अर्ज पाठवा (Apply)
          </MarathiText>
        </TouchableOpacity>
      </ScrollView>
      {renderCalendar()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  backBtn: { padding: 8 },
  content: { padding: 24 },
  infoCard: { flexDirection: "row", backgroundColor: "#ebf5ff", padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: "#bfdbfe" },
  dateSection: { flexDirection: 'row', backgroundColor: '#f9fafb', borderRadius: 20, padding: 20, marginBottom: 32, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  datePicker: { flex: 1 },
  divider: { width: 1, height: 40, backgroundColor: '#e5e7eb', marginHorizontal: 20 },
  input: { backgroundColor: "#f9fafb", borderRadius: 16, padding: 16, height: 120, fontSize: 16, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 32, textAlign: "left" },
  submitBtn: { backgroundColor: "#2563eb", height: 60, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 24, padding: 24 },
  datesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  dateChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9' },
  activeChip: { backgroundColor: '#2563eb' },
  closeBtn: { marginTop: 24, alignSelf: 'flex-end', padding: 8 }
});
