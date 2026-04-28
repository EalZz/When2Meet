import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppText } from "../../src/components/AppText";
import { AppTextInput } from "../../src/components/AppTextInput";
import { Screen } from "../../src/components/Screen";
import { createThirtyMinuteSlots } from "../../src/constants/timeSlots";
import { blockToSlotRecords } from "../../src/features/availability/availabilityBlocks";
import {
  deletePersonalAvailability,
  listPersonalDayAvailabilityBlocks,
  savePersonalAvailability,
} from "../../src/features/availability/availabilityApi";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { isSupabaseConfigured } from "../../src/lib/supabase";
import { useTheme } from "../../src/theme/useTheme";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function MyDayScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const theme = useTheme();
  const auth = useAuth();
  const date = params.date ?? todayKey();
  const slots = createThirtyMinuteSlots();

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [status, setStatus] = useState<"available" | "unavailable">("available");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myBlocksSummary, setMyBlocksSummary] = useState<string[]>([]);

  const userId = auth.user?.id ?? null;
  const userName =
    auth.user?.user_metadata?.display_name ?? auth.user?.email?.split("@")[0] ?? "사용자";
  const canUseDb = Boolean(userId && isSupabaseConfigured);

  useEffect(() => {
    if (!canUseDb || !userId) {
      setMyBlocksSummary([]);
      setErrorMessage(
        !userId
          ? "로그인 후 이용해 주세요."
          : !isSupabaseConfigured
            ? "Supabase 설정이 필요합니다."
            : null,
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    listPersonalDayAvailabilityBlocks(userId, date)
      .then((blocks) => {
        const lines = blocks.map(
          (block) =>
            `${block.startTime}-${block.endTime} · ${
              block.status === "available" ? "가능" : "불가능"
            } · ${block.title}`,
        );
        setMyBlocksSummary(lines);
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "일정을 불러오지 못했습니다.");
      })
      .finally(() => setIsLoading(false));
  }, [canUseDb, date, userId]);

  async function handleSave() {
    if (!userId) {
      Alert.alert("로그인 후 이용해 주세요.");
      return;
    }

    if (title.trim().length < 1) {
      Alert.alert("일정 이름을 입력해 주세요.");
      return;
    }

    const startIndex = slots.indexOf(startTime);
    const endIndex = slots.indexOf(endTime);
    if (startIndex < 0 || endIndex <= startIndex) {
      Alert.alert("끝나는 시간은 시작 시간보다 뒤여야 합니다.");
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert("Supabase 설정이 필요합니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      await savePersonalAvailability({
        userId,
        date,
        title: title.trim(),
        slots: blockToSlotRecords({
          id: "tmp",
          userId,
          userName,
          title: title.trim(),
          date,
          startTime,
          endTime,
          status,
        }),
      });

      setTitle("");
      Alert.alert("일정을 저장했습니다.");
      router.replace({ pathname: "/me/day", params: { date } });
    } catch (error) {
      Alert.alert("일정 저장에 실패했습니다.", error instanceof Error ? error.message : "");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!userId) {
      Alert.alert("로그인 후 이용해 주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      await deletePersonalAvailability({
        userId,
        date,
        startTime,
        endTime,
      });
      Alert.alert("일정을 삭제했습니다.");
      router.replace({ pathname: "/me/day", params: { date } });
    } catch (error) {
      Alert.alert("일정 삭제에 실패했습니다.", error instanceof Error ? error.message : "");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText style={styles.title}>내 일정</AppText>
          <AppText style={{ color: theme.colors.textSecondary }}>{date}</AppText>
        </View>

        {errorMessage ? (
          <AppText style={{ color: theme.colors.unavailable }}>{errorMessage}</AppText>
        ) : null}

        <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
          <AppText style={styles.panelTitle}>일정 입력</AppText>
          <AppTextInput placeholder="일정 이름" value={title} onChangeText={setTitle} />

          <View style={styles.field}>
            <AppText style={styles.fieldLabel}>시작 시간</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionRow}>
                {slots.slice(0, -1).map((slot) => (
                  <AppButton
                    key={slot}
                    label={slot}
                    variant={startTime === slot ? "primary" : "secondary"}
                    onPress={() => setStartTime(slot)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.field}>
            <AppText style={styles.fieldLabel}>끝 시간</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionRow}>
                {slots.slice(1).map((slot) => (
                  <AppButton
                    key={slot}
                    label={slot}
                    variant={endTime === slot ? "primary" : "secondary"}
                    onPress={() => setEndTime(slot)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.field}>
            <AppText style={styles.fieldLabel}>상태</AppText>
            <View style={styles.optionRow}>
              <AppButton
                label="가능"
                variant={status === "available" ? "primary" : "secondary"}
                onPress={() => setStatus("available")}
              />
              <AppButton
                label="불가능"
                variant={status === "unavailable" ? "primary" : "secondary"}
                onPress={() => setStatus("unavailable")}
              />
            </View>
          </View>

          <View style={styles.saveRow}>
            <AppText style={{ color: theme.colors.textSecondary }}>
              선택: {startTime} - {endTime}
            </AppText>
            <View style={styles.actionRow}>
              <AppButton
                disabled={isSubmitting || !canUseDb}
                label="일정 삭제"
                variant="danger"
                onPress={handleDelete}
              />
              <AppButton
                disabled={isSubmitting || !canUseDb}
                label={isSubmitting ? "저장 중..." : "저장"}
                onPress={handleSave}
              />
            </View>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
          <AppText style={styles.panelTitle}>오늘 저장된 일정</AppText>
          {isLoading ? (
            <AppText style={{ color: theme.colors.textSecondary }}>불러오는 중...</AppText>
          ) : null}
          {myBlocksSummary.length === 0 && !isLoading ? (
            <AppText style={{ color: theme.colors.textSecondary }}>저장된 일정이 없습니다.</AppText>
          ) : null}
          {myBlocksSummary.map((line) => (
            <AppText key={line}>{line}</AppText>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  content: {
    gap: 14,
    paddingBottom: 28,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  header: {
    gap: 2,
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
  },
  panel: {
    borderRadius: 8,
    gap: 12,
    padding: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  saveRow: {
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
  },
});
