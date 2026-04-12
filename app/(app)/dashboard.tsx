import { MarathiText } from "@/components/MarathiText";
import { Role, useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const numColumns = 2;
const CARD_MARGIN = 12;
const CARD_WIDTH = (width - 48 - CARD_MARGIN * 2) / numColumns;

type DashboardCard = {
  id: string;
  labelEn: string;
  labelMr: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  route: string;
  roles: Role[];
};

const DASHBOARD_CARDS: DashboardCard[] = [
  {
    id: "attendance_start",
    labelEn: "Take Attendance",
    labelMr: "हजेरी घ्या",
    icon: "camera-outline",
    color: "#0ea5e9", 
    route: "/(teacher)/take-attendance",
    roles: ["teacher"],
  },
  {
    id: "manage_students",
    labelEn: "Manage Students",
    labelMr: "विद्यार्थी व्यवस्थापन",
    icon: "account-edit-outline",
    color: "#14b8a6", 
    route: "/(teacher)/students",
    roles: ["teacher"],
  },
  {
    id: "attendance_manual",
    labelEn: "Review Missing",
    labelMr: "हजेरी तपासा",
    icon: "clipboard-check-outline",
    color: "#6366f1", 
    route: "/(teacher)/session/manual",
    roles: ["teacher"],
  },
  {
    id: "leave_approvals",
    labelEn: "Leaves",
    labelMr: "सुट्ट्या",
    icon: "calendar-check-outline",
    color: "#f59e0b", 
    route: "/(teacher)/leave-approvals",
    roles: ["teacher", "parent"],
  },
  {
    id: "notices",
    labelEn: "Notices",
    labelMr: "सूचना",
    icon: "bullhorn-outline",
    color: "#ec4899", 
    route: "/(teacher)/notice",
    roles: ["teacher", "student", "parent"],
  },
  {
    id: "reports",
    labelEn: "Reports",
    labelMr: "अहवाल",
    icon: "chart-bar",
    color: "#8b5cf6", 
    route: "/(teacher)/reports",
    roles: ["teacher"],
  },
  {
    id: "history",
    labelEn: "History",
    labelMr: "इतिहास",
    icon: "history",
    color: "#0ea5e9", 
    route: "/(teacher)/history",
    roles: ["teacher", "student", "parent"],
  },
  {
    id: "timetable",
    labelEn: "Timetable",
    labelMr: "वेळापत्रक",
    icon: "calendar-outline",
    color: "#10b981", 
    route: "/(teacher)/timetable",
    roles: ["teacher", "student", "parent"],
  },
  {
    id: "meal",
    labelEn: "Mid-Day Meal",
    labelMr: "पोषण आहार",
    icon: "food-apple-outline",
    color: "#f43f5e", 
    route: "/(teacher)/meal",
    roles: ["teacher", "parent"],
  },
  {
    id: "bus",
    labelEn: "Bus Tracking",
    labelMr: "बस ट्रॅकिंग",
    icon: "bus",
    color: "#eab308", 
    route: "/(teacher)/bus",
    roles: ["teacher", "parent"],
  },
  {
    id: "apply_leave",
    labelEn: "Apply Leave",
    labelMr: "रजा अर्ज",
    icon: "leaf",
    color: "#2563eb", 
    route: "/(student)/leave-request",
    roles: ["student"],
  },
  {
    id: "add_marks",
    labelEn: "Add marks",
    labelMr: "निकाल नोंदवा",
    icon: "file-certificate-outline",
    color: "#059669", 
    route: "/(teacher)/add-marks",
    roles: ["teacher"],
  },
  {
    id: "view_results",
    labelEn: "Results",
    labelMr: "निकाल",
    icon: "medal-outline",
    color: "#8b5cf6", 
    route: "/(student)/results",
    roles: ["student", "parent"],
  },
  {
    id: "settings",
    labelEn: "Settings",
    labelMr: "सेटिंग्ज",
    icon: "cog-outline",
    color: "#64748b",
    route: "/(teacher)/settings",
    roles: ["teacher", "student", "parent"],
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user, role, logout } = useAuthStore();

  // Filter cards to only those that include the user's role
  const visibleCards = DASHBOARD_CARDS.filter((card) =>
    role ? card.roles.includes(role) : false
  ).map(card => {
    // For parents, we point the 'Leaves' card to the parent-specific approval screen
    if (card.id === 'leave_approvals' && role === 'parent') {
      return { ...card, route: '/(parent)/leave-approval' };
    }
    return card;
  });

  const getThemeColor = () => {
    if (role === "teacher") return "#0d9488"; // Teal
    if (role === "student") return "#10b981"; // Emerald
    if (role === "parent") return "#f97316"; // Orange
    return "#3b82f6"; // Blue Default
  };

  const getRoleName = () => {
    if (role === "teacher") return "शिक्षक";
    if (role === "student") return "विद्यार्थी";
    if (role === "parent") return "पालक";
    return "";
  };

  const themeColor = getThemeColor();

  const renderCard = ({ item }: { item: DashboardCard }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.color }]}
      activeOpacity={0.8}
      onPress={() => router.push(item.route as any)}
    >
      <View style={styles.cardIconWrapper}>
        <MaterialCommunityIcons name={item.icon} size={38} color="#fff" />
      </View>
      <View style={styles.cardTextContainer}>
        <MarathiText bold size={18} color="#fff" style={styles.cardLabelEn}>
          {item.labelEn}
        </MarathiText>
        <MarathiText size={14} color="#e0e7ff" style={styles.cardLabelMr}>
          {item.labelMr}
        </MarathiText>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: themeColor }]}>
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(teacher)/settings")}
          >
            <MarathiText bold size={24} color={themeColor}>
              {user?.name?.charAt(0) || "U"}
            </MarathiText>
          </TouchableOpacity>
          <View>
            <MarathiText bold size={20} color="#fff">
              {user?.name || "User"}
            </MarathiText>
            <MarathiText size={14} color="rgba(255,255,255,0.85)">
              {getRoleName()} • Smart School
            </MarathiText>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout();
            router.replace("/");
          }}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={visibleCards}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.greetingSection}>
             <MarathiText bold size={28} color="#0f172a">
                Dashboard
             </MarathiText>
          </View>
        }
        renderItem={renderCard}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 10,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    backgroundColor: "#fff",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
  },
  greetingSection: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  listContent: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: CARD_MARGIN * 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.1,
    borderRadius: 32,
    padding: 20,
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTextContainer: {
    marginTop: 12,
  },
  cardLabelEn: {
    marginBottom: 4,
  },
  cardLabelMr: {
    opacity: 0.9,
  },
});
