import { Stack } from "expo-router";

import { AuthProvider } from "../src/features/auth/AuthProvider";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";

function RootStack() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.textSecondary,
        headerTitle: "",
        headerTitleStyle: { color: theme.colors.background },
        headerShown: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="rooms/index" />
      <Stack.Screen name="rooms/create" />
      <Stack.Screen name="rooms/join" />
      <Stack.Screen name="rooms/[roomId]/calendar" />
      <Stack.Screen name="rooms/[roomId]/day" />
      <Stack.Screen name="rooms/[roomId]/issues" />
      <Stack.Screen name="me/day" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/profile" />
      <Stack.Screen name="settings/issues" />
      <Stack.Screen name="admin/issues" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
