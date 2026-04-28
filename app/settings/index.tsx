import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton } from "../../src/components/AppButton";
import { AppText } from "../../src/components/AppText";
import { Screen } from "../../src/components/Screen";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { useTheme } from "../../src/theme/useTheme";
import type { ThemePreference } from "../../src/theme/themeLogic";

const themeOptions: Array<{ label: string; value: ThemePreference }> = [
  { label: "시스템", value: "system" },
  { label: "라이트", value: "light" },
  { label: "다크", value: "dark" },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const auth = useAuth();

  async function handleLogout() {
    await auth.logout();
    router.replace("/");
  }

  return (
    <Screen>
      <View style={styles.content}>
        <AppButton
          label="프로필 편집"
          variant="secondary"
          onPress={() => router.push("/settings/profile")}
        />
        <AppButton
          label="이슈/요청 보내기"
          variant="secondary"
          onPress={() => router.push("/settings/issues")}
        />
        <View style={styles.section}>
          <AppText style={styles.title}>테마</AppText>
          <View style={styles.row}>
            {themeOptions.map((option) => (
              <AppButton
                key={option.value}
                label={option.label}
                variant={theme.preference === option.value ? "primary" : "secondary"}
                onPress={() => theme.setPreference(option.value)}
              />
            ))}
          </View>
        </View>
        <AppButton label="로그아웃" variant="danger" onPress={handleLogout} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  section: {
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
});

