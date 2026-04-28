import { Pressable, StyleSheet, type PressableProps } from "react-native";

import { useTheme } from "../theme/useTheme";
import { AppText } from "./AppText";

type AppButtonProps = PressableProps & {
  label: string;
  variant?: "primary" | "secondary" | "danger";
};

export function AppButton({
  label,
  style,
  variant = "primary",
  ...props
}: AppButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary
            ? theme.colors.primary
            : isDanger
              ? theme.colors.unavailable
              : theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.82 : 1,
        },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      <AppText
        style={{
          color: isPrimary || isDanger ? "#FFFFFF" : theme.colors.textPrimary,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
