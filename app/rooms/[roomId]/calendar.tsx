import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "../../../src/components/AppButton";
import { AppText } from "../../../src/components/AppText";
import { CalendarMonth } from "../../../src/components/CalendarMonth";
import { CandidateList } from "../../../src/components/CandidateList";
import { Screen } from "../../../src/components/Screen";
import {
  applyBulkAvailabilityForAllRooms,
  listAvailabilitySlots,
  listPersonalAvailabilitySlots,
} from "../../../src/features/availability/availabilityApi";
import type { BulkAvailabilityAction } from "../../../src/features/availability/availabilityBulk";
import {
  findCandidateSlots,
  summarizeDateMarkersForUser,
  type AvailabilitySlot,
} from "../../../src/features/availability/availabilityLogic";
import { getMonthDateRange } from "../../../src/features/calendar/calendarLogic";

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

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAvailabilityAction>("available");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

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

  async function loadCalendar() {
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

    const { startDate, endDate } = getMonthDateRange(visibleMonth);

    setErrorMessage(null);
    try {
      const [roomSlots, personalSlots] = await Promise.all([
        listAvailabilitySlots(roomId, startDate, endDate),
        listPersonalAvailabilitySlots(auth.user.id, startDate, endDate),
      ]);
      setSlots(mergeSlots(roomSlots, personalSlots, auth.user!.id));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "캘린더 데이터를 불러오지 못했습니다.",
      );
    }
  }

  useEffect(() => {
    loadCalendar();
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

  function toggleBulkDate(date: string) {
    setSelectedDates((current) => {
      if (current.includes(date)) {
        return current.filter((d) => d !== date);
      }
      return [...current, date].sort();
    });
  }

  function handleSelectDate(date: string) {
    if (isBulkMode) {
      toggleBulkDate(date);
    } else {
      router.push({
        pathname: "/rooms/[roomId]/day",
        params: { roomId, date },
      });
    }
  }

  async function handleApplyBulk() {
    if (selectedDates.length === 0) {
      Alert.alert("알림", "적용할 날짜를 선택해 주세요.");
      return;
    }

    if (!auth.user) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert("Supabase 설정이 필요합니다.");
      return;
    }

    try {
      setIsBulkSubmitting(true);
      await applyBulkAvailabilityForAllRooms({
        userId: auth.user.id,
        dates: selectedDates,
        action: bulkAction,
      });
      await loadCalendar();
      setIsBulkMode(false);
      setSelectedDates([]);
      setBulkAction("available");
    } catch (error) {
      Alert.alert(
        "일괄 적용 실패",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsBulkSubmitting(false);
    }
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
          <CandidateList candidates={candidates} onSelect={(candidate) => handleSelectDate(candidate.date)} />
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
          <View style={styles.bulkToolbar}>
            <AppButton
              label={isBulkMode ? "일괄 선택 취소" : "복수 날짜 일괄 설정"}
              variant={isBulkMode ? "secondary" : "primary"}
              disabled={isBulkSubmitting}
              onPress={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedDates([]);
                setBulkAction("available");
              }}
            />
            {isBulkMode ? (
              <AppText style={{ fontWeight: "800", color: theme.colors.primary }}>
                {selectedDates.length}개 선택됨
              </AppText>
            ) : null}
          </View>

          <CalendarMonth
            month={visibleMonth}
            markedDates={markedDates}
            markerStatesByDate={markerStatesByDate}
            selectedDates={selectedDates}
            onSelectDate={handleSelectDate}
          />

          {isBulkMode ? (
            <View style={[styles.bulkPanel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <AppText style={styles.sectionTitle}>일괄 설정</AppText>
              <View style={styles.optionRow}>
                <AppButton
                  label="가능"
                  disabled={isBulkSubmitting}
                  variant={bulkAction === "available" ? "primary" : "secondary"}
                  onPress={() => setBulkAction("available")}
                />
                <AppButton
                  label="불가능"
                  disabled={isBulkSubmitting}
                  variant={bulkAction === "unavailable" ? "primary" : "secondary"}
                  onPress={() => setBulkAction("unavailable")}
                />
                <AppButton
                  label="삭제"
                  disabled={isBulkSubmitting}
                  variant={bulkAction === "delete" ? "primary" : "danger"}
                  onPress={() => setBulkAction("delete")}
                />
              </View>
              <View style={styles.bulkActions}>
                <AppButton
                  label="취소"
                  variant="secondary"
                  disabled={isBulkSubmitting}
                  onPress={() => {
                    setIsBulkMode(false);
                    setSelectedDates([]);
                    setBulkAction("available");
                  }}
                />
                <AppButton
                  label={isBulkSubmitting ? "적용 중..." : "적용하기"}
                  disabled={isBulkSubmitting || selectedDates.length === 0}
                  onPress={handleApplyBulk}
                />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bulkActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 8,
  },
  bulkPanel: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    marginTop: 12,
    padding: 16,
  },
  bulkToolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    marginTop: 4,
  },
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
  optionRow: {
    flexDirection: "row",
    gap: 8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
});
