import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppText } from "../../src/components/AppText";
import { AppTextInput } from "../../src/components/AppTextInput";
import { CalendarMonth } from "../../src/components/CalendarMonth";
import { Screen } from "../../src/components/Screen";
import { TimelineBoard } from "../../src/components/TimelineBoard";
import { createThirtyMinuteSlots } from "../../src/constants/timeSlots";
import {
  blockToSlotRecords,
  type AvailabilityBlock,
} from "../../src/features/availability/availabilityBlocks";
import {
  deletePersonalAvailability,
  listPersonalAvailabilitySlots,
  listPersonalDayAvailabilityBlocks,
  savePersonalAvailability,
} from "../../src/features/availability/availabilityApi";
import { summarizeDateMarkersForUser } from "../../src/features/availability/availabilityLogic";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { createRoom, joinRoom, listRooms } from "../../src/features/rooms/roomApi";
import type { Room } from "../../src/features/rooms/roomTypes";
import { isSupabaseConfigured } from "../../src/lib/supabase";
import { useTheme } from "../../src/theme/useTheme";

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const drawerWidth = 240;

export default function RoomsScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const slots = createThirtyMinuteSlots();
  const drawerTranslateX = useRef(new Animated.Value(-drawerWidth)).current;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(new Date()));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timelineBlocks, setTimelineBlocks] = useState<AvailabilityBlock[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [markerStatesByDate, setMarkerStatesByDate] = useState<Record<string, "available" | "unavailable" | "partial">>({});

  const [isPersonalModalVisible, setIsPersonalModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [status, setStatus] = useState<"available" | "unavailable">("available");
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [selectedDeleteBlockId, setSelectedDeleteBlockId] = useState<string | null>(null);

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  const currentUserId = auth.user?.id ?? null;
  const currentUserName =
    auth.user?.user_metadata?.display_name ?? auth.user?.email?.split("@")[0] ?? "사용자";

  useEffect(() => {
    if (!auth.user) {
      setRooms([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    listRooms(auth.user.id)
      .then(setRooms)
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "방 목록을 불러오지 못했습니다.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [auth.user]);

  useEffect(() => {
    if (!currentUserId || !isSupabaseConfigured) {
      setMarkerStatesByDate({});
      return;
    }

    const startDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const endDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    listPersonalAvailabilitySlots(currentUserId, startDate, endDate)
      .then((monthSlots) =>
        setMarkerStatesByDate(summarizeDateMarkersForUser(monthSlots, currentUserId)),
      )
      .catch(() => setMarkerStatesByDate({}));
  }, [currentUserId, visibleMonth]);

  useEffect(() => {
    if (!selectedDate || !currentUserId) {
      setTimelineBlocks([]);
      return;
    }

    setIsTimelineLoading(true);
    listPersonalDayAvailabilityBlocks(currentUserId, selectedDate)
      .then(setTimelineBlocks)
      .catch(() => {
        setTimelineBlocks([]);
      })
      .finally(() => setIsTimelineLoading(false));
  }, [currentUserId, selectedDate]);

  const monthLabel = useMemo(
    () => `${visibleMonth.getFullYear()}년 ${visibleMonth.getMonth() + 1}월`,
    [visibleMonth],
  );

  function openDrawer() {
    setIsDrawerOpen(true);
    Animated.timing(drawerTranslateX, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }

  function closeDrawer() {
    Animated.timing(drawerTranslateX, {
      toValue: -drawerWidth,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsDrawerOpen(false);
      }
    });
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > 18 &&
          Math.abs(gestureState.dy) < 20 &&
          gestureState.dx > 0,
        onPanResponderRelease: (event, gestureState) => {
          const startX = event.nativeEvent.pageX - gestureState.dx;
          if (startX <= 28 && gestureState.dx > 55) {
            openDrawer();
          }
        },
      }),
    [],
  );

  function resetPersonalForm() {
    setTitle("");
    setStartTime("10:00");
    setEndTime("11:00");
    setStatus("available");
    setSelectedDeleteBlockId(null);
    setIsPersonalModalVisible(false);
  }

  function selectDate(dateKey: string) {
    setSelectedDate(dateKey);
  }

  async function reloadTimeline(dateKey: string) {
    if (!currentUserId) {
      return;
    }
    const blocks = await listPersonalDayAvailabilityBlocks(currentUserId, dateKey);
    setTimelineBlocks(blocks);
  }

  async function reloadMarkerStates() {
    if (!currentUserId || !isSupabaseConfigured) {
      return;
    }

    const startDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const endDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    const monthSlots = await listPersonalAvailabilitySlots(currentUserId, startDate, endDate);
    setMarkerStatesByDate(summarizeDateMarkersForUser(monthSlots, currentUserId));
  }

  async function handleSavePersonalSchedule() {
    if (!currentUserId) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }

    if (!selectedDate) {
      Alert.alert("날짜를 먼저 선택해 주세요.");
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert("Supabase 환경변수가 아직 연결되지 않았습니다.");
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

    try {
      setIsSavingPersonal(true);
      await savePersonalAvailability({
        userId: currentUserId,
        date: selectedDate,
        title: title.trim(),
        slots: blockToSlotRecords({
          id: "draft",
          userId: currentUserId,
          userName: currentUserName,
          title: title.trim(),
          date: selectedDate,
          startTime,
          endTime,
          status,
        }),
      });
      await Promise.all([reloadTimeline(selectedDate), reloadMarkerStates()]);
      Alert.alert("저장되었습니다.");
      resetPersonalForm();
    } catch (error) {
      Alert.alert(
        "일정 저장에 실패했습니다",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsSavingPersonal(false);
    }
  }

  async function handleDeletePersonalSchedule() {
    if (!currentUserId || !selectedDate) {
      Alert.alert("날짜를 먼저 선택해 주세요.");
      return;
    }

    const targetBlock = timelineBlocks.find((block) => block.id === selectedDeleteBlockId);
    if (!targetBlock) {
      Alert.alert("삭제할 일정을 선택해 주세요.");
      return;
    }

    try {
      setIsSavingPersonal(true);
      await deletePersonalAvailability({
        userId: currentUserId,
        date: selectedDate,
        startTime: targetBlock.startTime,
        endTime: targetBlock.endTime,
      });
      await Promise.all([reloadTimeline(selectedDate), reloadMarkerStates()]);
      Alert.alert("일정을 삭제했습니다.");
      resetPersonalForm();
    } catch (error) {
      Alert.alert(
        "일정 삭제에 실패했습니다",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsSavingPersonal(false);
    }
  }

  async function handleCreateRoom() {
    if (roomName.trim().length < 2) {
      Alert.alert("방 이름은 2자 이상 입력해 주세요.");
      return;
    }

    if (!auth.user) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }

    try {
      setIsCreatingRoom(true);
      const room = await createRoom(roomName, auth.user.id);
      setRooms((current) => [...current, room]);
      setRoomName("");
      setIsCreateModalVisible(false);
      closeDrawer();
      router.push({ pathname: "/room-calendar", params: { roomId: room.id } });
    } catch (error) {
      Alert.alert(
        "방 만들기에 실패했습니다",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsCreatingRoom(false);
    }
  }

  async function handleJoinRoom() {
    if (inviteCode.trim().length < 6) {
      Alert.alert("초대코드는 6자 이상이어야 합니다.");
      return;
    }

    if (!auth.user) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }

    try {
      setIsJoiningRoom(true);
      const roomId = await joinRoom(inviteCode, auth.user.id);
      setInviteCode("");
      setIsJoinModalVisible(false);
      closeDrawer();
      router.push({ pathname: "/room-calendar", params: { roomId } });
    } catch (error) {
      Alert.alert(
        "방 참여에 실패했습니다",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsJoiningRoom(false);
    }
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.flex} {...panResponder.panHandlers}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topRow}>
            <Pressable
              onPress={openDrawer}
              style={[styles.menuButton, { backgroundColor: theme.colors.surface }]}
            >
              <View style={[styles.menuLine, { backgroundColor: theme.colors.textPrimary }]} />
              <View style={[styles.menuLine, { backgroundColor: theme.colors.textPrimary }]} />
              <View style={[styles.menuLine, { backgroundColor: theme.colors.textPrimary }]} />
            </Pressable>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
            <AppText style={styles.title}>내 방</AppText>
            <AppText style={{ color: theme.colors.textSecondary }}>
              참여 중인 방을 확인하고, 새 방을 만들거나 들어갈 수 있습니다.
            </AppText>

            {isLoading ? (
              <AppText style={{ color: theme.colors.textSecondary }}>
                방 목록을 불러오는 중...
              </AppText>
            ) : null}

            {errorMessage ? (
              <AppText style={{ color: theme.colors.unavailable }}>{errorMessage}</AppText>
            ) : null}

            {rooms.map((room) => (
              <View key={room.id} style={[styles.roomRow, { borderColor: theme.colors.border }]}>
                <View style={styles.roomText}>
                  <AppText style={styles.roomName}>{room.name}</AppText>
                  <AppText style={{ color: theme.colors.textSecondary }}>
                    초대코드: {room.inviteCode}
                  </AppText>
                </View>
                <AppButton
                  label="열기"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: "/room-calendar",
                      params: { roomId: room.id },
                    })
                  }
                />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.monthHeader}>
              <AppButton
                label="이전"
                variant="secondary"
                onPress={() =>
                  setVisibleMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  )
                }
              />
              <AppText style={styles.sectionTitle}>{monthLabel}</AppText>
              <AppButton
                label="다음"
                variant="secondary"
                onPress={() =>
                  setVisibleMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  )
                }
              />
            </View>

            <CalendarMonth
              month={visibleMonth}
              markerStatesByDate={markerStatesByDate}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
            />

            {selectedDate ? (
              <View style={[styles.timelinePanel, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.timelineHeader}>
                  <AppText style={styles.timelineTitle}>{selectedDate}</AppText>
                  <AppButton label="일정 추가" onPress={() => setIsPersonalModalVisible(true)} />
                </View>
                {isTimelineLoading ? (
                  <AppText style={{ color: theme.colors.textSecondary }}>
                    일정을 불러오는 중...
                  </AppText>
                ) : (
                  <TimelineBoard
                    blocks={timelineBlocks}
                    users={[{ id: currentUserId ?? "me", name: currentUserName }]}
                  />
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>

        {isDrawerOpen ? (
          <Pressable style={styles.drawerOverlay} onPress={closeDrawer}>
            <Animated.View
              style={[
                styles.drawer,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  transform: [{ translateX: drawerTranslateX }],
                },
              ]}
            >
              <AppText style={styles.drawerTitle}>메뉴</AppText>
              <AppButton label="방 만들기" onPress={() => setIsCreateModalVisible(true)} />
              <AppButton
                label="초대코드 참여"
                variant="secondary"
                onPress={() => setIsJoinModalVisible(true)}
              />
              <AppButton
                label="설정"
                variant="secondary"
                onPress={() => {
                  closeDrawer();
                  router.push("/settings");
                }}
              />
            </Animated.View>
          </Pressable>
        ) : null}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={isPersonalModalVisible}
        onRequestClose={resetPersonalForm}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { backgroundColor: theme.colors.surface }]}>
            <AppText style={styles.modalTitle}>개인 일정 추가</AppText>
            <AppText style={{ color: theme.colors.textSecondary }}>{selectedDate}</AppText>
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
              {timelineBlocks.length === 0 ? (
                <AppText style={{ color: theme.colors.textSecondary }}>
                  이 날짜에 삭제할 내 일정이 없습니다.
                </AppText>
              ) : (
                <View style={styles.radioList}>
                  {timelineBlocks.map((block) => {
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
              <AppButton label="일정 삭제" variant="danger" onPress={handleDeletePersonalSchedule} />
              <AppButton label="취소" variant="secondary" onPress={resetPersonalForm} />
              <AppButton
                disabled={isSavingPersonal}
                label={isSavingPersonal ? "저장 중..." : "저장"}
                onPress={handleSavePersonalSchedule}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isCreateModalVisible}
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { backgroundColor: theme.colors.surface }]}>
            <AppText style={styles.modalTitle}>방 만들기</AppText>
            <AppTextInput placeholder="방 이름" value={roomName} onChangeText={setRoomName} />
            <View style={styles.modalActions}>
              <AppButton
                label="취소"
                variant="secondary"
                onPress={() => setIsCreateModalVisible(false)}
              />
              <AppButton
                disabled={isCreatingRoom}
                label={isCreatingRoom ? "생성 중..." : "생성"}
                onPress={handleCreateRoom}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isJoinModalVisible}
        onRequestClose={() => setIsJoinModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { backgroundColor: theme.colors.surface }]}>
            <AppText style={styles.modalTitle}>초대코드 참여</AppText>
            <AppTextInput
              autoCapitalize="characters"
              placeholder="초대코드"
              value={inviteCode}
              onChangeText={setInviteCode}
            />
            <View style={styles.modalActions}>
              <AppButton
                label="취소"
                variant="secondary"
                onPress={() => setIsJoinModalVisible(false)}
              />
              <AppButton
                disabled={isJoiningRoom}
                label={isJoiningRoom ? "참여 중..." : "참여"}
                onPress={handleJoinRoom}
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
    paddingBottom: 32,
  },
  drawer: {
    borderRightWidth: 1,
    bottom: 0,
    gap: 12,
    left: 0,
    padding: 20,
    position: "absolute",
    top: 0,
    width: drawerWidth,
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  flex: {
    flex: 1,
  },
  menuButton: {
    borderRadius: 10,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 48,
  },
  menuLine: {
    borderRadius: 999,
    height: 2,
    width: 22,
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
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
  },
  panel: {
    borderRadius: 8,
    gap: 8,
    padding: 16,
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
  roomName: {
    fontSize: 16,
    fontWeight: "800",
  },
  roomRow: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 12,
  },
  roomText: {
    flex: 1,
    gap: 4,
  },
  screen: {
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  section: {
    gap: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  timelineHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timelinePanel: {
    borderRadius: 8,
    gap: 12,
    padding: 16,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
  },
  topRow: {
    paddingHorizontal: 20,
  },
});
