import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "../../../src/components/AppButton";
import { AppText } from "../../../src/components/AppText";
import { AppTextInput } from "../../../src/components/AppTextInput";
import { Screen } from "../../../src/components/Screen";
import { TimelineBoard } from "../../../src/components/TimelineBoard";
import { createThirtyMinuteSlots } from "../../../src/constants/timeSlots";
import {
  blockToSlotRecords,
  type AvailabilityBlock,
} from "../../../src/features/availability/availabilityBlocks";
import {
  deleteAvailabilityForAllRooms,
  deletePersonalAvailability,
  listDayAvailabilityBlocks,
  listPersonalDayAvailabilityBlocks,
  savePersonalAvailability,
  saveAvailabilityForAllRooms,
} from "../../../src/features/availability/availabilityApi";
import { useAuth } from "../../../src/features/auth/AuthProvider";
import { listRoomMembers } from "../../../src/features/rooms/roomApi";
import { isSupabaseConfigured } from "../../../src/lib/supabase";
import { useTheme } from "../../../src/theme/useTheme";

export default function DayTimelineScreen() {
  const params = useLocalSearchParams<{ roomId?: string; date?: string }>();
  const auth = useAuth();
  const theme = useTheme();
  const roomId = params.roomId ?? "";
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const slots = createThirtyMinuteSlots();

  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [status, setStatus] = useState<"available" | "unavailable">("available");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDeleteBlockId, setSelectedDeleteBlockId] = useState<string | null>(null);

  const currentUserId = auth.user?.id ?? "";
  const currentUserName =
    auth.user?.user_metadata?.display_name ?? auth.user?.email?.split("@")[0] ?? "사용자";

  const myBlocks = useMemo(
    () => blocks.filter((block) => block.userId === currentUserId),
    [blocks, currentUserId],
  );

  function mergeBlocks(
    roomBlocks: AvailabilityBlock[],
    personalBlocks: AvailabilityBlock[],
    targetUserId: string,
  ) {
    return [...roomBlocks.filter((block) => block.userId !== targetUserId), ...personalBlocks].sort(
      (left, right) =>
        `${left.userName}-${left.startTime}`.localeCompare(`${right.userName}-${right.startTime}`),
    );
  }

  async function loadTimeline() {
    if (!auth.user) {
      setUsers([]);
      setBlocks([]);
      setErrorMessage("로그인이 필요합니다.");
      return;
    }

    if (!isSupabaseConfigured) {
      setUsers([]);
      setBlocks([]);
      setErrorMessage("Supabase 환경변수가 아직 연결되지 않았습니다.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [members, roomBlocks, personalBlocks] = await Promise.all([
        listRoomMembers(roomId),
        listDayAvailabilityBlocks(roomId, date),
        listPersonalDayAvailabilityBlocks(currentUserId, date),
      ]);
      setUsers(members.length > 0 ? members : [{ id: currentUserId, name: currentUserName }]);
      setBlocks(mergeBlocks(roomBlocks, personalBlocks, currentUserId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "타임라인 데이터를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTimeline();
  }, [auth.user, roomId, date]);

  async function handleSaveBlock() {
    if (!auth.user) {
      Alert.alert("로그인이 필요합니다.");
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

    const nextBlock: AvailabilityBlock = {
      id: `block-${Date.now()}`,
      userId: currentUserId,
      userName: currentUserName,
      title: title.trim(),
      date,
      startTime,
      endTime,
      status,
    };

    try {
      setIsSubmitting(true);
      const slotRecords = blockToSlotRecords(nextBlock);
      await Promise.all([
        saveAvailabilityForAllRooms(
          {
            userId: currentUserId,
            date,
            title: nextBlock.title,
            slots: slotRecords,
          },
        ),
        savePersonalAvailability({
          userId: currentUserId,
          date,
          title: nextBlock.title,
          slots: slotRecords,
        }),
      ]);
      await loadTimeline();
      resetForm();
    } catch (error) {
      Alert.alert(
        "저장에 실패했습니다",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteBlock() {
    if (!auth.user) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }

    const targetBlock = myBlocks.find((block) => block.id === selectedDeleteBlockId);
    if (!targetBlock) {
      Alert.alert("삭제할 일정을 선택해 주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      await Promise.all([
        deleteAvailabilityForAllRooms(
          {
            userId: currentUserId,
            date,
            startTime: targetBlock.startTime,
            endTime: targetBlock.endTime,
          },
        ),
        deletePersonalAvailability({
          userId: currentUserId,
          date,
          startTime: targetBlock.startTime,
          endTime: targetBlock.endTime,
        }),
      ]);
      await loadTimeline();
      resetForm();
    } catch (error) {
      Alert.alert(
        "삭제에 실패했습니다",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setTitle("");
    setStartTime("10:00");
    setEndTime("11:00");
    setStatus("available");
    setSelectedDeleteBlockId(null);
    setIsModalVisible(false);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText style={styles.title}>{date}</AppText>
            <AppText style={{ color: theme.colors.textSecondary }}>
              사람별 일정 바를 확인하고, 새 일정은 버튼으로 추가합니다.
            </AppText>
          </View>
          <AppButton label="일정 추가" onPress={() => setIsModalVisible(true)} />
        </View>

        {isLoading ? (
          <AppText style={{ color: theme.colors.textSecondary }}>타임라인을 불러오는 중...</AppText>
        ) : null}
        {errorMessage ? (
          <AppText style={{ color: theme.colors.unavailable }}>{errorMessage}</AppText>
        ) : null}

        <TimelineBoard blocks={blocks} users={users} />
      </ScrollView>

      <Modal animationType="slide" transparent visible={isModalVisible} onRequestClose={resetForm}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { backgroundColor: theme.colors.surface }]}>
            <AppText style={styles.modalTitle}>일정 추가</AppText>
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

            <View style={styles.field}>
              <AppText style={styles.fieldLabel}>삭제할 일정 선택</AppText>
              {myBlocks.length === 0 ? (
                <AppText style={{ color: theme.colors.textSecondary }}>
                  이 날짜에 삭제할 내 일정이 없습니다.
                </AppText>
              ) : (
                <View style={styles.radioList}>
                  {myBlocks.map((block) => {
                    const selected = selectedDeleteBlockId === block.id;
                    return (
                      <Pressable
                        key={block.id}
                        onPress={() => setSelectedDeleteBlockId(block.id)}
                        style={[
                          styles.radioRow,
                          {
                            borderColor: selected ? theme.colors.primary : theme.colors.border,
                            backgroundColor: selected
                              ? theme.colors.surfaceElevated
                              : theme.colors.surface,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.radioOuter,
                            { borderColor: selected ? theme.colors.primary : theme.colors.border },
                          ]}
                        >
                          {selected ? (
                            <View
                              style={[
                                styles.radioInner,
                                { backgroundColor: theme.colors.primary },
                              ]}
                            />
                          ) : null}
                        </View>
                        <View style={styles.radioText}>
                          <AppText style={styles.radioTitle}>{block.title}</AppText>
                          <AppText style={{ color: theme.colors.textSecondary }}>
                            {block.startTime} - {block.endTime} ·{" "}
                            {block.status === "available" ? "가능" : "불가능"}
                          </AppText>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <AppButton label="일정 삭제" variant="danger" onPress={handleDeleteBlock} />
              <AppButton label="취소" variant="secondary" onPress={resetForm} />
              <AppButton
                disabled={isSubmitting}
                label={isSubmitting ? "저장 중..." : "저장"}
                onPress={handleSaveBlock}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
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
    gap: 14,
  },
  headerText: {
    gap: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    backgroundColor: "rgba(0,0,0,0.58)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalPanel: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    gap: 16,
    maxHeight: "86%",
    padding: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
  },
  radioInner: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  radioList: {
    gap: 8,
  },
  radioOuter: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  radioRow: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  radioText: {
    flex: 1,
    gap: 2,
  },
  radioTitle: {
    fontWeight: "800",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
  },
});
