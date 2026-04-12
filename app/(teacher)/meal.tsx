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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MealScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState<
    { id: number; date: string; meal_details: string; is_eligible: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [mealDetails, setMealDetails] = useState("");

  const load = async () => {
    try {
      const rows = await featureRepo.getMeals();
      setMeals(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addMeal = async () => {
    if (!mealDetails.trim()) return;
    await featureRepo.addMeal(
      new Date().toISOString().split("T")[0],
      mealDetails.trim(),
      true,
    );
    setMealDetails("");
    await load();
  };

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
        <View style={styles.inputCard}>
          <MarathiText bold size={16} color="#374151" style={{ marginBottom: 12 }}>
            Add today&apos;s meal
          </MarathiText>
          <TextInput
            style={styles.input}
            placeholder="Meal details"
            value={mealDetails}
            onChangeText={setMealDetails}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={addMeal}>
            <MarathiText bold color="#fff">
              Save
            </MarathiText>
          </TouchableOpacity>
        </View>

        <MarathiText bold size={18} color="#1f2937" style={{ marginBottom: 12 }}>
          Recent meal plans
        </MarathiText>
        {loading ? (
          <ActivityIndicator size="large" color="#db2777" />
        ) : (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <MaterialCommunityIcons name="food-apple" size={32} color="#db2777" />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <MarathiText bold size={16} color="#1f2937">
                  {meal.meal_details}
                </MarathiText>
                <MarathiText size={14} color="#6b7280">
                  Date: {meal.date}
                </MarathiText>
              </View>
            </View>
          ))
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
  inputCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: "#db2777",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
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
});
