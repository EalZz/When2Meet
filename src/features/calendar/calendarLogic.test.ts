import { describe, expect, it } from "vitest";
import { buildMonthCells, formatDateKey, getMonthDateRange } from "./calendarLogic";

it("formats local date keys without UTC conversion", () => {
  expect(formatDateKey(2026, 3, 30)).toBe("2026-04-30");
});

it("returns the local first and last date keys for a month", () => {
  expect(getMonthDateRange(new Date(2026, 3, 15))).toEqual({
    startDate: "2026-04-01",
    endDate: "2026-04-30",
  });
});

describe("buildMonthCells", () => {
  it("creates leading empty cells so the first day appears on the correct weekday", () => {
    const cells = buildMonthCells(2026, 3);

    expect(cells).toHaveLength(35);
    expect(cells[0].date).toBeNull();
    expect(cells[1].date).toBeNull();
    expect(cells[2].date).toBeNull();
    expect(cells[3].date).toBe("2026-04-01");
  });
});
