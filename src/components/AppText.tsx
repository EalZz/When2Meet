import { Text, type TextProps } from "react-native";

import { useTheme } from "../theme/useTheme";

export function AppText({ style, ...props }: TextProps) {
  const theme = useTheme();

  return (
    <Text
      {...props}
      style={[{ color: theme.colors.textPrimary, fontSize: 16 }, style]}
    />
  );
}
