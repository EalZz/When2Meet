import { Pressable, StyleSheet, View } from "react-native";

import type { CandidateSlot } from "../features/availability/availabilityLogic";
import { useTheme } from "../theme/useTheme";
import { AppText } from "./AppText";

type CandidateListProps = {
  candidates: CandidateSlot[];
  onSelect: (candidate: CandidateSlot) => void;
};

export function CandidateList({ candidates, onSelect }: CandidateListProps) {
  const theme = useTheme();

  if (candidates.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: theme.colors.border }]}>
        <AppText style={{ color: theme.colors.textSecondary }}>
          아직 겹치는 가능 시간이 없습니다.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {candidates.map((candidate) => (
        <Pressable
          key={`${candidate.date}-${candidate.slotTime}`}
          onPress={() => onSelect(candidate)}
          style={[styles.item, { backgroundColor: theme.colors.surfaceElevated }]}
        >
          <AppText style={styles.itemTitle}>
            {candidate.date} {candidate.slotTime}
          </AppText>
          <AppText style={{ color: theme.colors.textSecondary }}>
            {candidate.users.map((user) => user.displayName).join(", ")}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  item: {
    borderRadius: 8,
    gap: 4,
    padding: 14,
  },
  itemTitle: {
    fontWeight: "800",
  },
  list: {
    gap: 10,
  },
});
