import { describe, expect, it } from "vitest";

import { resolveTheme } from "./themeLogic";

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
