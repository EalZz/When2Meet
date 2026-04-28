import { StyleSheet, View } from "react-native";

import { useTheme } from "../theme/useTheme";
import { AppText } from "./AppText";

type UserDaySummaryProps = {
  name: string;
  status: "available" | "unavailable" | "partial";
};

export function UserDaySummary({ name, status }: UserDaySummaryProps) {
  const theme = useTheme();
  const color =
    status === "available"
      ? theme.colors.available
      : status === "unavailable"
        ? theme.colors.unavailable
        : theme.colors.partial;

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText>{name}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
});
