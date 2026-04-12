import { MarathiText } from "@/components/MarathiText";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ParentSettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <MarathiText bold size={20} color="#1f2937">
          सेटिंग्ज (Settings)
        </MarathiText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <MaterialCommunityIcons name="account" size={48} color="#a21caf" />
          </View>
          <MarathiText bold size={20} color="#1f2937" style={{ marginTop: 12 }}>
            {user?.name || "पालक"}
          </MarathiText>
          <MarathiText size={14} color="#6b7280">
            पाल्य: अक्षरा पाटील (इयत्ता 8वी)
          </MarathiText>
        </View>

        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialCommunityIcons
              name="translate"
              size={24}
              color="#4b5563"
            />
            <MarathiText size={16} color="#374151" style={styles.settingText}>
              भाषा (Language)
            </MarathiText>
            <MarathiText size={14} color="#9ca3af">
              मराठी
            </MarathiText>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#9ca3af"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color="#4b5563"
            />
            <MarathiText size={16} color="#374151" style={styles.settingText}>
              सूचना (Notifications)
            </MarathiText>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#9ca3af"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={24}
              color="#4b5563"
            />
            <MarathiText size={16} color="#374151" style={styles.settingText}>
              गोपनीयता (Privacy)
            </MarathiText>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color="#dc2626" />
          <MarathiText bold size={16} color="#dc2626" style={{ marginLeft: 8 }}>
            लॉगआउट (Logout)
          </MarathiText>
        </TouchableOpacity>
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
  backBtn: {
    padding: 8,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
  },
  content: { padding: 20 },
  profileCard: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fdf4ff",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  settingText: { flex: 1, marginLeft: 16 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    padding: 16,
    borderRadius: 16,
  },
});
