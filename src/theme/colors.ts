export const colors = {
  dark: {
    background: "#0B0D10",
    surface: "#141820",
    surfaceElevated: "#1B2029",
    textPrimary: "#F4F7FA",
    textSecondary: "#AAB4C0",
    border: "#2A313D",
    primary: "#4F8CFF",
    available: "#2ED47A",
    unavailable: "#FF5C5C",
    partial: "#F5B84B",
  },
  light: {
    background: "#F7F8FA",
    surface: "#FFFFFF",
    surfaceElevated: "#F0F3F7",
    textPrimary: "#111827",
    textSecondary: "#5B6472",
    border: "#D8DEE8",
    primary: "#2563EB",
    available: "#16A34A",
    unavailable: "#DC2626",
    partial: "#D97706",
  },
} as const;

export type ThemeColors = (typeof colors)[keyof typeof colors];
