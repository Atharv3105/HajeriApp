import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MarathiText } from "./MarathiText";

interface BigButtonProps {
  icon: string;
  label: string;
  subLabel?: string;
  color: string;
  onPress: () => void;
}

export function BigButton({
  icon,
  label,
  subLabel,
  color,
  onPress,
}: BigButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.inner}>
        <MaterialCommunityIcons name={icon as any} size={36} color="#fff" />
        <View style={styles.textBlock}>
          <MarathiText bold size={18} color="#fff">
            {label}
          </MarathiText>
          {subLabel ? (
            <MarathiText size={12} color="#f8fafc">
              {subLabel}
            </MarathiText>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 90,
    borderRadius: 22,
    paddingHorizontal: 18,
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
  },
  textBlock: {
    marginLeft: 16,
    flexShrink: 1,
  },
});
