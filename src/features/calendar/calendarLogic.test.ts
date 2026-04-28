import { describe, expect, it } from "vitest";

import { buildMonthCells } from "./calendarLogic";

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
