import React from "react";
import { StyleSheet, View } from "react-native";
import { MarathiText } from "./MarathiText";

interface StudentCardProps {
  name: string;
  rollNumber: number;
  status?: string;
  badgeColor?: string;
}

export function StudentCard({
  name,
  rollNumber,
  status,
  badgeColor = "#0d9488",
}: StudentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <MarathiText bold size={16}>
          {name}
        </MarathiText>
        {status ? (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <MarathiText size={12} color="#fff">
              {status}
            </MarathiText>
          </View>
        ) : null}
      </View>
      <MarathiText size={14} color="#4b5563">
        Roll {rollNumber}
      </MarathiText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
});
