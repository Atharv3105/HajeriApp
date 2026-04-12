import { MarathiText } from "@/components/MarathiText";
import { attendanceRepo } from "@/services/db/attendanceRepo";
import { speak } from "@/services/voiceService";
import { useAttendanceStore } from "@/store/attendanceStore";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StartSessionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { setSession } = useAttendanceStore();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<{ id: string; class_name: string }[]>(
    [],
  );
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      if (!user) return;
      try {
        const availableClasses = await attendanceRepo.getClassesForTeacher(
          user.id,
        );
        setClasses(availableClasses);
        if (availableClasses.length > 0) {
          setSelectedClassId(availableClasses[0].id);
        }
      } catch (e) {
        console.error(e);
        Alert.alert(t("common.error_generic"), "Unable to load your classes.");
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, [user, t]);

  const handleStart = async () => {
    if (!user || !selectedClassId) return;
    try {
      const sessionId = await attendanceRepo.startSession(
        selectedClassId,
        user.id,
      );
      const students =
        await attendanceRepo.getStudentsForClass(selectedClassId);
      setSession(sessionId, selectedClassId, students);
      speak("वर्ग फोटो स्कॅन करा आणि अनुपस्थित विद्यार्थी ओळखा.", "mr");
      router.push("/(teacher)/session/camera-scan");
    } catch (e) {
      console.error(e);
      Alert.alert(
        t("common.error_generic"),
        "Could not start the attendance session.",
      );
    }
  };

  const canStart = !loading && !!selectedClassId;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#0d9488" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#0d9488">
          हजेरी सत्र
        </MarathiText>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="google-classroom"
              size={48}
              color="#0d9488"
            />
          </View>
          <MarathiText bold size={28} color="#1f2937" style={{ marginTop: 16 }}>
            वर्ग निवडा
          </MarathiText>
          <MarathiText
            size={16}
            color="#6b7280"
            style={{ marginTop: 12, textAlign: "center" }}
          >
            हजेरी घेण्यासाठी वर्ग निवडा.
          </MarathiText>
        </View>

        <View style={styles.classSelection}>
          <MarathiText
            bold
            size={20}
            color="#1f2937"
            style={{ marginBottom: 16 }}
          >
            उपलब्ध वर्ग
          </MarathiText>
          <TouchableOpacity
            style={styles.classBtn}
            onPress={() => router.push("/(teacher)/session/manual")}
          >
            <MaterialCommunityIcons
              name="google-classroom"
              size={24}
              color="#0d9488"
            />
            <MarathiText size={16} color="#1f2937" style={{ marginLeft: 12 }}>
              १० वी अ - हजेरी घ्या
            </MarathiText>
          </TouchableOpacity>
        </View>

        <View style={styles.classList}>
          <MarathiText
            bold
            size={18}
            color="#1f2937"
            style={{ marginBottom: 12 }}
          >
            वर्ग निवडा
          </MarathiText>
          {loading ? (
            <ActivityIndicator color="#0d9488" />
          ) : (
            <FlatList
              data={classes}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.classCard,
                    selectedClassId === item.id && styles.classCardActive,
                  ]}
                  onPress={() => setSelectedClassId(item.id)}
                >
                  <MarathiText
                    bold
                    size={16}
                    color={selectedClassId === item.id ? "#fff" : "#1f2937"}
                  >
                    {item.class_name}
                  </MarathiText>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.startBtn, !canStart && styles.disabledBtn]}
          onPress={handleStart}
          disabled={!canStart}
        >
          <MaterialCommunityIcons
            name="camera-outline"
            size={26}
            color="#fff"
          />
          <MarathiText bold size={20} color="#fff" style={{ marginLeft: 12 }}>
            वर्ग फोटो घ्या
          </MarathiText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    padding: 18,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginBottom: 22,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cameraPreview: {
    height: 260,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cameraView: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  verifyBtn: {
    backgroundColor: "#0d9488",
    height: 64,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  classList: {
    marginBottom: 20,
  },
  classCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  classCardActive: {
    backgroundColor: "#0d9488",
    borderColor: "#0d9488",
  },
  startBtn: {
    backgroundColor: "#0d9488",
    height: 72,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  classSelection: {
    marginTop: 20,
  },
  classBtn: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
});
