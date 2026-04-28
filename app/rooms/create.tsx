import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppTextInput } from "../../src/components/AppTextInput";
import { Screen } from "../../src/components/Screen";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { createRoom } from "../../src/features/rooms/roomApi";

export default function CreateRoomScreen() {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  async function handleCreate() {
    if (name.trim().length < 2) {
      Alert.alert("방 이름은 2자 이상 입력해 주세요.");
      return;
    }

    if (!auth.user) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      const room = await createRoom(name, auth.user.id);
      router.replace({
        pathname: "/rooms/[roomId]/calendar",
        params: { roomId: room.id },
      });
    } catch (error) {
      Alert.alert(
        "방 만들기 실패",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.form}>
        <AppTextInput placeholder="방 이름" value={name} onChangeText={setName} />
        <AppButton
          disabled={isSubmitting}
          label={isSubmitting ? "방 생성 중..." : "방 만들기"}
          onPress={handleCreate}
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
