import { ScrollView, StyleSheet, View } from "react-native";

import { createThirtyMinuteSlots } from "../constants/timeSlots";
import {
  expandBlockToSlots,
  type AvailabilityBlock,
  type AvailabilityBlockStatus,
} from "../features/availability/availabilityBlocks";
import { useTheme } from "../theme/useTheme";
import { AppText } from "./AppText";

type TimelineBoardProps = {
  blocks: AvailabilityBlock[];
  users: Array<{
    id: string;
    name: string;
  }>;
};

const nameColumnWidth = 96;
const slotWidth = 54;
const rowHeight = 72;
const blockHeight = 40;

function statusColor(status: AvailabilityBlockStatus, theme: ReturnType<typeof useTheme>) {
  if (status === "available") {
    return theme.colors.available;
  }
  if (status === "unavailable") {
    return theme.colors.unavailable;
  }
  return theme.colors.surfaceElevated;
}

export function TimelineBoard({ blocks, users }: TimelineBoardProps) {
  const theme = useTheme();
  const slots = createThirtyMinuteSlots();
  const timelineWidth = slots.length * slotWidth;

  return (
    <View style={[styles.frame, { borderColor: theme.colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces>
        <View style={styles.board}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.nameHeader,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppText style={styles.headerText}>이름</AppText>
            </View>
            <View style={[styles.timeHeader, { width: timelineWidth }]}>
              {slots.map((slot) => (
                <View key={slot} style={styles.timeCell}>
                  <AppText style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                    {slot}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          {users.map((user) => {
            const userBlocks = blocks.filter((block) => block.userId === user.id);

            return (
              <View key={user.id} style={styles.row}>
                <View
                  style={[
                    styles.nameCell,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <AppText style={styles.userName} numberOfLines={1}>
                    {user.name}
                  </AppText>
                </View>

                <View style={[styles.timeline, { width: timelineWidth }]}>
                  {slots.map((slot, index) => (
                    <View
                      key={slot}
                      style={[
                        styles.slotLine,
                        {
                          left: index * slotWidth,
                          borderColor: theme.colors.border,
                          backgroundColor:
                            index % 2 === 0 ? theme.colors.surface : theme.colors.background,
                        },
                      ]}
                    />
                  ))}

                  {userBlocks.map((block) => {
                    const blockSlots = expandBlockToSlots(block.startTime, block.endTime);
                    const startIndex = slots.indexOf(block.startTime);
                    const width = Math.max(blockSlots.length * slotWidth - 8, slotWidth - 8);

                    if (startIndex < 0 || blockSlots.length === 0) {
                      return null;
                    }

                    return (
                      <View
                        key={block.id}
                        style={[
                          styles.block,
                          {
                            left: startIndex * slotWidth + 4,
                            width,
                            backgroundColor: statusColor(block.status, theme),
                          },
                        ]}
                      >
                        <AppText style={styles.blockText} numberOfLines={1}>
                          {block.title}
                        </AppText>
                        <AppText style={styles.blockMeta} numberOfLines={1}>
                          {block.startTime} - {block.endTime}
                        </AppText>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: 7,
    gap: 2,
    height: blockHeight,
    justifyContent: "center",
    paddingHorizontal: 10,
    position: "absolute",
    top: 16,
  },
  blockMeta: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "600",
  },
  blockText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  board: {
    minWidth: "100%",
  },
  frame: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
  },
  headerText: {
    fontSize: 13,
    fontWeight: "800",
  },
  nameCell: {
    alignItems: "center",
    borderRightWidth: 1,
    borderTopWidth: 1,
    height: rowHeight,
    justifyContent: "center",
    paddingHorizontal: 8,
    width: nameColumnWidth,
  },
  nameHeader: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    height: 42,
    justifyContent: "center",
    width: nameColumnWidth,
  },
  row: {
    flexDirection: "row",
  },
  slotLine: {
    borderRightWidth: 1,
    height: rowHeight,
    position: "absolute",
    top: 0,
    width: slotWidth,
  },
  timeCell: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: slotWidth,
  },
  timeHeader: {
    flexDirection: "row",
  },
  timeline: {
    borderTopWidth: 1,
    height: rowHeight,
    position: "relative",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  userName: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
