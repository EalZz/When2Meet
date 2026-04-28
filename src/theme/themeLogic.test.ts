import { describe, expect, it } from "vitest";

import { normalizeThemePreference, resolveTheme } from "./themeLogic";

describe("resolveTheme", () => {
  it("uses the explicit light preference", () => {
    expect(resolveTheme("light", "dark")).toBe("light");
  });

  it("uses the explicit dark preference", () => {
    expect(resolveTheme("dark", "light")).toBe("dark");
  });

  it("uses the system theme when preference is system", () => {
    expect(resolveTheme("system", "light")).toBe("light");
  });

  it("falls back to dark when the system theme is unavailable", () => {
    expect(resolveTheme("system", null)).toBe("dark");
  });
});

describe("normalizeThemePreference", () => {
  it("normalizes valid stored theme preferences", () => {
    expect(normalizeThemePreference("system")).toBe("system");
    expect(normalizeThemePreference("light")).toBe("light");
    expect(normalizeThemePreference("dark")).toBe("dark");
  });

  it("falls back to system for invalid stored theme preferences", () => {
    expect(normalizeThemePreference(null)).toBe("system");
    expect(normalizeThemePreference(undefined)).toBe("system");
    expect(normalizeThemePreference("invalid")).toBe("system");
  });
});
