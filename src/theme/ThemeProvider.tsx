import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { colors, type ThemeColors } from "./colors";
import {
  normalizeThemePreference,
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
const themePreferenceStorageKey = "when2meet.themePreference";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(themePreferenceStorageKey)
      .then((storedPreference) => {
        if (isMounted) {
          setPreferenceState(normalizeThemePreference(storedPreference));
        }
      })
      .catch(() => {
        if (isMounted) {
          setPreferenceState("system");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedTheme = resolveTheme(preference, systemTheme);

    const setPreference = (nextPreference: ThemePreference) => {
      setPreferenceState(nextPreference);
      AsyncStorage.setItem(themePreferenceStorageKey, nextPreference).catch(() => {
        // 저장 실패는 조용히 무시하여 사용자 경험 유지
      });
    };

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
