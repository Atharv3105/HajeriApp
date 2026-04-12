import React from "react";
import { StyleSheet, View } from "react-native";
import { MarathiText } from "./MarathiText";

interface FaceOverlayBoxProps {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export function FaceOverlayBox({
  name,
  left,
  top,
  width,
  height,
}: FaceOverlayBoxProps) {
  return (
    <View style={[styles.box, { left, top, width, height }]}>
      <View style={styles.label}>
        <MarathiText size={11} color="#fff">
          {name}
        </MarathiText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#06b6d4",
    borderRadius: 12,
  },
  label: {
    position: "absolute",
    top: -24,
    left: 0,
    backgroundColor: "#06b6d4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
});
