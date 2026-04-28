import { Pressable, StyleSheet, View } from "react-native";

import { createThirtyMinuteSlots } from "../constants/timeSlots";
import type { SlotStatus } from "../features/availability/availabilityTypes";
import { useTheme } from "../theme/useTheme";
import { AppText } from "./AppText";

type SlotState = SlotStatus | null;

type TimeSlotGridProps = {
  values: Record<string, SlotState>;
  onChange: (slotTime: string, status: SlotState) => void;
};

function nextStatus(status: SlotState): SlotState {
  if (status === null) {
    return "available";
  }
  if (status === "available") {
    return "unavailable";
  }
  return null;
}

export function TimeSlotGrid({ values, onChange }: TimeSlotGridProps) {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {createThirtyMinuteSlots().map((slotTime) => {
        const status = values[slotTime] ?? null;
        const color =
          status === "available"
            ? theme.colors.available
            : status === "unavailable"
              ? theme.colors.unavailable
              : theme.colors.surface;

        return (
          <Pressable
            key={slotTime}
            onPress={() => onChange(slotTime, nextStatus(status))}
            style={[styles.slot, { backgroundColor: color, borderColor: theme.colors.border }]}
          >
            <AppText
              style={{
                color: status ? "#FFFFFF" : theme.colors.textSecondary,
                fontWeight: "700",
              }}
            >
              {slotTime}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slot: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: "30%",
  },
});
