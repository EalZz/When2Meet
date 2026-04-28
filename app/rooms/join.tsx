import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppTextInput } from "../../src/components/AppTextInput";
import { Screen } from "../../src/components/Screen";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { joinRoom } from "../../src/features/rooms/roomApi";

export default function JoinRoomScreen() {
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  async function handleJoin() {
    if (inviteCode.trim().length < 6) {
      Alert.alert("초대코드는 6자 이상이어야 합니다.");
      return;
    }

    if (!auth.user) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      const roomId = await joinRoom(inviteCode, auth.user.id);
      router.replace({
        pathname: "/room-calendar",
        params: { roomId },
      });
    } catch (error) {
      Alert.alert(
        "방 참여 실패",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.form}>
        <AppTextInput
          autoCapitalize="characters"
          placeholder="초대코드"
          value={inviteCode}
          onChangeText={setInviteCode}
        />
        <AppButton
          disabled={isSubmitting}
          label={isSubmitting ? "참여 중..." : "참여하기"}
          onPress={handleJoin}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});
