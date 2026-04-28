import { TextInput, StyleSheet, type TextInputProps } from "react-native";

import { useTheme } from "../theme/useTheme";

export function AppTextInput({ style, placeholderTextColor, ...props }: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      {...props}
      placeholderTextColor={placeholderTextColor ?? theme.colors.textSecondary}
      style={[
        styles.input,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.textPrimary,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
});
