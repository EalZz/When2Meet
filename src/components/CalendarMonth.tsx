import { Pressable, StyleSheet, View } from "react-native";

import type { DateMarkerState } from "../features/availability/availabilityLogic";
import { buildMonthCells } from "../features/calendar/calendarLogic";
import { useTheme } from "../theme/useTheme";
import { AppText } from "./AppText";

type CalendarMonthProps = {
  month: Date;
  markedDates?: string[];
  markerStatesByDate?: Record<string, DateMarkerState>;
  selectedDate?: string | null;
  selectedDates?: string[];
  onSelectDate: (date: string) => void;
};

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarMonth({
  month,
  markedDates = [],
  markerStatesByDate = {},
  selectedDate = null,
  selectedDates = [],
  onSelectDate,
}: CalendarMonthProps) {
  const theme = useTheme();

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const cells = buildMonthCells(year, monthIndex);
  const marked = new Set(markedDates);

  return (
    <View style={[styles.container, { borderColor: theme.colors.border }]}>
      <View style={styles.weekdays}>
        {weekdays.map((weekday) => (
          <View key={weekday} style={styles.weekdayCell}>
            <AppText style={[styles.weekday, { color: theme.colors.textSecondary }]}>
              {weekday}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell) => {
          const hasCandidate = Boolean(cell.date && marked.has(cell.date));
          const markerState = cell.date ? markerStatesByDate[cell.date] : undefined;
          const isSelected = Boolean(
            cell.date && (cell.date === selectedDate || selectedDates.includes(cell.date)),
          );

          return (
            <Pressable
              key={cell.key}
              disabled={!cell.date}
              onPress={() => cell.date && onSelectDate(cell.date)}
              style={[
                styles.day,
                {
                  backgroundColor: cell.date
                    ? isSelected
                      ? theme.colors.surfaceElevated
                      : theme.colors.surface
                    : theme.colors.background,
                  borderColor: isSelected
                    ? theme.colors.available
                    : cell.isToday
                    ? theme.colors.primary
                    : theme.colors.border,
                  opacity: cell.date ? 1 : 0.45,
                },
              ]}
            >
              {cell.day ? (
                <>
                  <AppText
                    style={[
                      styles.dayText,
                      isSelected ? { color: theme.colors.available } : null,
                      cell.isToday ? { color: theme.colors.primary } : null,
                    ]}
                  >
                    {cell.day}
                  </AppText>
                  {hasCandidate || markerState ? (
                    <View
                      style={[
                        styles.marker,
                        {
                          backgroundColor:
                            markerState === "partial"
                              ? theme.colors.partial
                              : markerState === "unavailable"
                                ? theme.colors.unavailable
                                : theme.colors.available,
                        },
                      ]}
                    />
                  ) : null}
                </>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  day: {
    alignItems: "center",
    borderRightWidth: 1,
    borderTopWidth: 1,
    height: 62,
    justifyContent: "center",
    position: "relative",
    width: `${100 / 7}%`,
  },
  dayText: {
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  marker: {
    borderRadius: 3,
    bottom: 8,
    height: 6,
    position: "absolute",
    width: 6,
  },
  weekday: {
    fontSize: 12,
    fontWeight: "800",
  },
  weekdayCell: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: `${100 / 7}%`,
  },
  weekdays: {
    flexDirection: "row",
  },
});
