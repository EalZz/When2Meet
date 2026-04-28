import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { colors, type ThemeColors } from "./colors";
import {
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "./themeLogic";

type ThemeContextValue = {
  colors: ThemeColors;
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedTheme = resolveTheme(preference, systemTheme);

    return {
      colors: colors[resolvedTheme],
      preference,
      resolvedTheme,
      setPreference,
    };
  }, [preference, systemTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return value;
}
