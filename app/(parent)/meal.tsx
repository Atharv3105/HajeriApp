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

export default function ParentMealScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState<
    { id: number; date: string; meal_details: string; is_eligible: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    featureRepo
      .getMeals()
      .then(setMeals)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <MarathiText bold size={20} color="#1f2937">
          Mid-day Meal
        </MarathiText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information" size={24} color="#0284c7" />
          <MarathiText size={14} color="#0369a1" style={{ marginLeft: 12, flex: 1 }}>
            Meal plan is synced from school records.
          </MarathiText>
        </View>

        <MarathiText bold size={18} color="#1f2937" style={{ marginBottom: 16 }}>
          Menu
        </MarathiText>

        {loading ? (
          <ActivityIndicator size="large" color="#0369a1" />
        ) : meals.length > 0 ? (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealDate}>
                <MarathiText bold size={16} color="#0369a1">
                  {new Date(meal.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                  })}
                </MarathiText>
              </View>
              <View style={{ flex: 1 }}>
                <MarathiText bold size={18} color="#1f2937">
                  {meal.meal_details}
                </MarathiText>
                {meal.is_eligible ? (
                  <View style={styles.eligibleBadge}>
                    <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
                    <MarathiText size={12} color="#059669" style={{ marginLeft: 4 }}>
                      Eligible
                    </MarathiText>
                  </View>
                ) : null}
              </View>
              <MaterialCommunityIcons name="food" size={32} color="#bae6fd" />
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="pot-mix" size={48} color="#9ca3af" />
            <MarathiText size={16} color="#6b7280" style={{ marginTop: 12 }}>
              No meal plan available.
            </MarathiText>
          </View>
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
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#e0f2fe",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mealDate: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },
  eligibleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 40 },
});
