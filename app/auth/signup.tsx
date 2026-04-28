import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppTextInput } from "../../src/components/AppTextInput";
import { Screen } from "../../src/components/Screen";
import { useAuth } from "../../src/features/auth/AuthProvider";

export default function SignupScreen() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      await auth.register({ username, displayName, password });
      router.replace("/rooms");
    } catch (error) {
      Alert.alert(
        "회원가입 실패",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.form}>
        <AppTextInput placeholder="아이디" value={username} onChangeText={setUsername} />
        <AppTextInput
          placeholder="비밀번호"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <AppTextInput placeholder="이름" value={displayName} onChangeText={setDisplayName} />
        <AppButton
          disabled={isSubmitting}
          label={isSubmitting ? "가입 중..." : "회원가입"}
          onPress={handleSubmit}
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
