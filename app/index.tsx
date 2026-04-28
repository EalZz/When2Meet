import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Modal, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "../src/components/AppButton";
import { AppText } from "../src/components/AppText";
import { AppTextInput } from "../src/components/AppTextInput";
import { Screen } from "../src/components/Screen";
import { useAuth } from "../src/features/auth/AuthProvider";
import { useTheme } from "../src/theme/useTheme";

type AuthMode = "login" | "signup";

export default function IndexScreen() {
  const theme = useTheme();
  const auth = useAuth();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && auth.user) {
      router.replace("/rooms");
    }
  }, [auth.isLoading, auth.user]);

  function openAuth(nextMode: AuthMode) {
    setMode(nextMode);
    setIsModalVisible(true);
  }

  function closeAuth() {
    setIsSubmitting(false);
    setIsModalVisible(false);
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      const normalizedUsername = username.trim().toLowerCase();

      if (normalizedUsername.length < 2) {
        Alert.alert("아이디는 2자 이상 입력해 주세요.");
        return;
      }

      if (!/^[a-z0-9._-]+$/.test(normalizedUsername)) {
        Alert.alert("아이디는 영문 소문자, 숫자, ., _, - 만 사용할 수 있습니다.");
        return;
      }

      if (password.length < 6) {
        Alert.alert("비밀번호는 6자 이상 입력해 주세요.");
        return;
      }

      if (mode === "signup" && displayName.trim().length < 1) {
        Alert.alert("이름을 입력해 주세요.");
        return;
      }

      if (mode === "login") {
        await auth.login({ username: normalizedUsername, password });
      } else {
        await auth.register({
          username: normalizedUsername,
          password,
          displayName,
        });
      }

      closeAuth();
      router.replace("/rooms");
    } catch (error) {
      Alert.alert(
        mode === "login" ? "로그인 실패" : "회원가입 실패",
        error instanceof Error ? error.message : "다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.hero}>
          <AppText style={styles.title}>When2Meet</AppText>
          <AppText style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            초대코드로 모이고, 가능한 시간을 30분 단위로 맞춰보세요.
          </AppText>
          <View
            style={[
              styles.heroLogoFrame,
              {
                backgroundColor: theme.resolvedTheme === "dark" ? "#000000" : "#FFFFFF",
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Image source={require("../assets/icon.png")} style={styles.heroLogo} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton label="로그인" onPress={() => openAuth("login")} />
          <AppButton label="회원가입" variant="secondary" onPress={() => openAuth("signup")} />
        </View>
      </View>

      <Modal animationType="slide" transparent visible={isModalVisible} onRequestClose={closeAuth}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modeRow}>
              <AppButton
                label="로그인"
                variant={mode === "login" ? "primary" : "secondary"}
                onPress={() => setMode("login")}
              />
              <AppButton
                label="회원가입"
                variant={mode === "signup" ? "primary" : "secondary"}
                onPress={() => setMode("signup")}
              />
            </View>

            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              <AppTextInput placeholder="아이디" value={username} onChangeText={setUsername} />
              <AppTextInput
                placeholder="비밀번호"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {mode === "signup" ? (
                <AppTextInput placeholder="이름" value={displayName} onChangeText={setDisplayName} />
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <AppButton label="취소" variant="secondary" onPress={closeAuth} />
              <AppButton
                disabled={isSubmitting}
                label={isSubmitting ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
                onPress={handleSubmit}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 36,
  },
  form: {
    gap: 12,
  },
  hero: {
    gap: 12,
  },
  heroLogo: {
    height: 240,
    width: 240,
  },
  heroLogoFrame: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 10,
    overflow: "hidden",
    padding: 18,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
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
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
  },
});
