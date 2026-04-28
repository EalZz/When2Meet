export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme | null | undefined,
): ResolvedTheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  return systemTheme === "light" ? "light" : "dark";
}
