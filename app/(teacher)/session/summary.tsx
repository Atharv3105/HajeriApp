import { MarathiText } from "@/components/MarathiText";
import { AttendanceRecord, attendanceRepo } from "@/services/db/attendanceRepo";
import { sendSms } from "@/services/smsService";
import { speak } from "@/services/voiceService";
import { useAttendanceStore } from "@/store/attendanceStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SessionSummaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { sessionId, students, records, clearSession } = useAttendanceStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncAnim = useRef(new Animated.Value(1)).current;
  const celebrateAnim = useRef(new Animated.Value(0)).current;

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;

    students.forEach((student) => {
      const record = records.get(student.id);
      if (record?.status === "present") present++;
      else if (record?.status === "absent") absent++;
      else if (record?.status === "leave") leave++;
      else absent++;
    });

    return { present, absent, leave, isFull: present === students.length };
  }, [students, records]);

  const participationPct = students.length
    ? Math.round((stats.present / students.length) * 100)
    : 0;

  useEffect(() => {
    let syncLoop: Animated.CompositeAnimation | null = null;
    if (stats.isFull) {
      Animated.spring(celebrateAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }

    if (isSyncing) {
      syncLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(syncAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(syncAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      syncLoop.start();
    }
    return () => {
      if (syncLoop) syncLoop.stop();
    };
  }, [stats.isFull, isSyncing, celebrateAnim, syncAnim]);

  const handleSave = async () => {
    if (!sessionId) return;
    setIsSyncing(true);

    const finalRecords: AttendanceRecord[] = students.map((student) => {
      const record = records.get(student.id);
      return (
        record || { studentId: student.id, status: "absent", method: "manual" }
      );
    });

    try {
      await attendanceRepo.saveBatchRecords(sessionId, finalRecords);
      await attendanceRepo.queueAbsentNotifications(sessionId, finalRecords);

      const absentRecords = finalRecords.filter(
        (record) => record.status === "absent",
      );
      if (absentRecords.length > 0) {
        const contacts = await attendanceRepo.getParentContactsForStudentIds(
          absentRecords.map((record) => record.studentId),
        );

        const successfulSmsIds: string[] = [];
        await Promise.all(
          contacts.map(async (contact) => {
            if (!contact.parent_phone) return;
            const message = `${contact.student_name} आज अनुपस्थित आहे. कृपया शाळेशी संपर्क करा.`;
            const sent = await sendSms(contact.parent_phone, message);
            if (sent) successfulSmsIds.push(contact.student_id);
          }),
        );

        if (successfulSmsIds.length > 0) {
          await attendanceRepo.markSmsSentForStudentIds(
            sessionId,
            successfulSmsIds,
          );
        }
      }

      const speechText = stats.absent
        ? `हजेरी जतन झाली आहे. ${stats.absent} विद्यार्थी अनुपस्थित आहेत.`
        : `हजेरी जतन झाली आहे. सर्व विद्यार्थी उपस्थित आहेत.`;
      speak(speechText, "mr");

      setTimeout(() => {
        setIsSyncing(false);
        Alert.alert("यशस्वी!", "हजेरी जतन झाली आहे.", [
          {
            text: "ठीक आहे",
            onPress: () => {
              clearSession();
              router.replace("/(app)/dashboard" as any);
            },
          },
        ]);
      }, 1500);
    } catch {
      setIsSyncing(false);
      Alert.alert(t("common.error_generic"), "Could not save records");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MarathiText bold size={22} color="#0d9488">
          {t("teacher.session_summary")}
        </MarathiText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {stats.isFull && (
          <Animated.View
            style={[
              styles.celebrationBox,
              { transform: [{ scale: celebrateAnim }] },
            ]}
          >
            <MaterialCommunityIcons
              name="party-popper"
              size={48}
              color="#10b981"
            />
            <MarathiText
              bold
              size={24}
              color="#065f46"
              style={{ marginTop: 10 }}
            >
              {t("success_all")}
            </MarathiText>
            <MarathiText size={14} color="#059669">
              सर्व {students.length} विद्यार्थी आज हजर आहेत!
            </MarathiText>
          </Animated.View>
        )}

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: "#10b981" }]} />
            <MarathiText size={20} color="#1f2937" style={{ flex: 1 }}>
              {t("teacher.total_present")}
            </MarathiText>
            <MarathiText bold size={24} color="#10b981">
              {stats.present}
            </MarathiText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: "#ef4444" }]} />
            <MarathiText size={20} color="#1f2937" style={{ flex: 1 }}>
              {t("teacher.total_absent")}
            </MarathiText>
            <MarathiText bold size={24} color="#ef4444">
              {stats.absent}
            </MarathiText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: "#f59e0b" }]} />
            <MarathiText size={20} color="#1f2937" style={{ flex: 1 }}>
              रजेवर
            </MarathiText>
            <MarathiText bold size={24} color="#f59e0b">
              {stats.leave}
            </MarathiText>
          </View>
        </View>

        <View style={styles.participationCard}>
          <MarathiText
            bold
            size={18}
            color="#1f2937"
            style={{ marginBottom: 12 }}
          >
            सहभाग टक्केवारी
          </MarathiText>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                { width: `${participationPct}%` },
              ]}
            />
          </View>
          <MarathiText size={14} color="#6b7280" style={{ marginTop: 8 }}>
            {participationPct}% विद्यार्थी आज उपस्थित आहेत.
          </MarathiText>
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color="#0369a1"
          />
          <MarathiText
            size={14}
            color="#0c4a6e"
            style={{ marginLeft: 12, flex: 1 }}
          >
            जतन केल्यानंतर गैरहजर विद्यार्थ्यांच्या पालकांना स्वयंचलित SMS
            पाठवला जाईल.
          </MarathiText>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!isSyncing ? (
          <>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
            >
              <MarathiText bold color="#6b7280">
                {t("common.cancel")}
              </MarathiText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSave}>
              <MarathiText bold size={20} color="#fff">
                {t("teacher.confirm_session")}
              </MarathiText>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.syncBox}>
            <Animated.View style={{ transform: [{ scale: syncAnim }] }}>
              <MaterialCommunityIcons
                name="cloud-sync"
                size={32}
                color="#0d9488"
              />
            </Animated.View>
            <View style={{ marginLeft: 12 }}>
              <MarathiText bold size={18} color="#0d9488">
                {t("syncing")}
              </MarathiText>
              <MarathiText size={12} color="#6b7280">
                माहिती सुरक्षितपणे जतन होत आहे...
              </MarathiText>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    padding: 24,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  participationCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  barBg: {
    height: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#10b981",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  footer: {
    flexDirection: "row",
    padding: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: "#0d9488",
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  celebrationBox: {
    backgroundColor: "#ecfdf5",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#10b981",
    borderStyle: "dashed",
  },
  syncBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdfa",
    borderRadius: 16,
    height: 64,
    borderWidth: 1,
    borderColor: "#0d9488",
  },
});
