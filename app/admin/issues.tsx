import { StyleSheet, View } from "react-native";

import { AppText } from "../../src/components/AppText";
import { Screen } from "../../src/components/Screen";
import { useTheme } from "../../src/theme/useTheme";

export default function AdminIssuesScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
        <AppText style={styles.title}>관리자 이슈 목록</AppText>
        <AppText style={{ color: theme.colors.textSecondary }}>
          Supabase 연결 후 open, reviewing, resolved, closed 상태를 관리합니다.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 8,
    gap: 8,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
  },
});
