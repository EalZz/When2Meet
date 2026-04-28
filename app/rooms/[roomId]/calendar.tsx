import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "../../../src/components/AppButton";
import { AppText } from "../../../src/components/AppText";
import { CalendarMonth } from "../../../src/components/CalendarMonth";
import { CandidateList } from "../../../src/components/CandidateList";
import { Screen } from "../../../src/components/Screen";
import {
  listAvailabilitySlots,
  listPersonalAvailabilitySlots,
} from "../../../src/features/availability/availabilityApi";
import {
  findCandidateSlots,
  summarizeDateMarkersForUser,
  type AvailabilitySlot,
} from "../../../src/features/availability/availabilityLogic";
import { useAuth } from "../../../src/features/auth/AuthProvider";
import { isSupabaseConfigured } from "../../../src/lib/supabase";
import { useTheme } from "../../../src/theme/useTheme";

export default function RoomCalendarScreen() {
  const params = useLocalSearchParams<{ roomId?: string }>();
  const theme = useTheme();
  const auth = useAuth();
  const roomId = params.roomId ?? "";
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function mergeSlots(
    roomSlots: AvailabilitySlot[],
    personalSlots: AvailabilitySlot[],
    currentUserId: string,
  ) {
    const merged = roomSlots.filter((slot) => slot.userId !== currentUserId);
    const seen = new Set(
      merged.map((slot) => `${slot.userId}-${slot.date}-${slot.slotTime}-${slot.status}`),
    );

    for (const slot of personalSlots) {
      const key = `${slot.userId}-${slot.date}-${slot.slotTime}-${slot.status}`;
      if (!seen.has(key)) {
        merged.push({ ...slot, roomId });
        seen.add(key);
      }
    }

    return merged;
  }

  useEffect(() => {
    if (!auth.user) {
      setSlots([]);
      setErrorMessage("로그인이 필요합니다.");
      return;
    }

    if (!roomId) {
      setSlots([]);
      setErrorMessage("방 정보를 찾지 못했습니다.");
      return;
    }

    if (!isSupabaseConfigured) {
      setSlots([]);
      setErrorMessage("Supabase 환경변수가 아직 연결되지 않았습니다.");
      return;
    }

    const startDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const endDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    setErrorMessage(null);
    Promise.all([
      listAvailabilitySlots(roomId, startDate, endDate),
      listPersonalAvailabilitySlots(auth.user.id, startDate, endDate),
    ])
      .then(([roomSlots, personalSlots]) =>
        setSlots(mergeSlots(roomSlots, personalSlots, auth.user!.id)),
      )
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "캘린더 데이터를 불러오지 못했습니다.",
        );
      });
  }, [auth.user, roomId, visibleMonth]);

  const candidates = useMemo(() => findCandidateSlots(slots), [slots]);
  const markedDates = candidates.map((candidate) => candidate.date);
  const markerStatesByDate = useMemo(() => {
    if (!auth.user) {
      return {};
    }
    return summarizeDateMarkersForUser(slots, auth.user.id);
  }, [auth.user, slots]);
  const monthLabel = `${visibleMonth.getFullYear()}년 ${visibleMonth.getMonth() + 1}월`;

  function openDay(date: string) {
    router.push({
      pathname: "/room-day",
      params: { roomId, date },
    });
  }

  function moveMonth(offset: number) {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>약속 후보</AppText>
          {errorMessage ? (
            <AppText style={{ color: theme.colors.unavailable }}>{errorMessage}</AppText>
          ) : null}
          <CandidateList candidates={candidates} onSelect={(candidate) => openDay(candidate.date)} />
        </View>

        <View style={styles.section}>
          <View style={styles.monthHeader}>
            <AppButton label="이전" variant="secondary" onPress={() => moveMonth(-1)} />
            <View style={styles.monthTitle}>
              <AppText style={styles.sectionTitle}>{monthLabel}</AppText>
              <AppText style={{ color: theme.colors.textSecondary }}>
                초록점은 가능만, 빨간점은 불가능만, 노란점은 둘 다 체크한 날짜입니다.
              </AppText>
            </View>
            <AppButton label="다음" variant="secondary" onPress={() => moveMonth(1)} />
          </View>
          <CalendarMonth
            month={visibleMonth}
            markedDates={markedDates}
            markerStatesByDate={markerStatesByDate}
            onSelectDate={openDay}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
    paddingBottom: 28,
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  monthTitle: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
});
