import { MarathiText } from "@/components/MarathiText";
import { Role } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RoleCard: React.FC<{
  role: Role;
  icon: string;
  labelEn: string;
  labelMr: string;
  color: string;
  onPress: (role: Role) => void;
}> = ({ role, icon, labelEn, labelMr, color, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: color }]}
      onPress={() => onPress(role)}
      activeOpacity={0.9}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={icon as any} size={84} color="#fff" />
        </View>
        <MarathiText bold size={42} color="#fff" style={styles.labelEnText}>
          {labelEn}
        </MarathiText>
        <MarathiText bold size={32} color="#fff" style={styles.labelMrText}>
          {labelMr}
        </MarathiText>
      </View>
    </TouchableOpacity>
  );
};

export default function RoleSelectScreen() {
  const router = useRouter();

  const handleRoleSelect = (role: Role) => {
    router.push({
      pathname: "/(auth)/[role]/login",
      params: { role },
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.homeIcon}
            onPress={() => router.replace("/")}
          >
            <MaterialCommunityIcons
              name="home-outline"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
          <MarathiText bold size={20} color="#fff">
            Smart School
          </MarathiText>
        </View>
        <TouchableOpacity style={styles.langToggle}>
          <MaterialCommunityIcons name="web" size={20} color="#fff" />
          <MarathiText color="#fff" style={{ marginLeft: 6 }}>
            मराठी
          </MarathiText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <MarathiText bold size={32} color="#1f1f1f" textAlign="center">
            Who are you?
          </MarathiText>
          <MarathiText bold size={34} color="#4338ca" textAlign="center">
            तुम्ही कोण आहात?
          </MarathiText>
          <MarathiText
            size={16}
            color="#4b5563"
            textAlign="center"
            style={{ marginTop: 8 }}
          >
            Tap on your role below / खालीलपैकी एक निवडा
          </MarathiText>
        </View>

        <View style={styles.cardsContainer}>
          <RoleCard
            role="teacher"
            icon="book-open-variant"
            labelEn="TEACHER"
            labelMr="शिक्षक"
            color="#2563eb"
            onPress={handleRoleSelect}
          />
          <RoleCard
            role="student"
            icon="school"
            labelEn="STUDENT"
            labelMr="विद्यार्थी"
            color="#10b981"
            onPress={handleRoleSelect}
          />
          <RoleCard
            role="parent"
            icon="account-group"
            labelEn="PARENT"
            labelMr="पालक"
            color="#f97316"
            onPress={handleRoleSelect}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  topHeader: {
    backgroundColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeIcon: {
    backgroundColor: "rgba(255,255,255,0.1)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  welcomeSection: {
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  card: {
    width: "100%",
    height: 240,
    borderRadius: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  labelEnText: {
    letterSpacing: 2,
    marginBottom: 4,
  },
  labelMrText: {
    // मराठी labels usually need a bit of adjustment for size
  },
});
