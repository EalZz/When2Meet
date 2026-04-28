import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, type ViewProps } from "react-native";

import { useTheme } from "../theme/useTheme";

export function Screen({ children, style, ...props }: ViewProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      {...props}
      style={[styles.screen, { backgroundColor: theme.colors.background }, style]}
    >
      <StatusBar style={theme.resolvedTheme === "dark" ? "light" : "dark"} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
  },
});
