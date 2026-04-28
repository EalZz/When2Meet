import { describe, expect, it } from "vitest";

import { createThirtyMinuteSlots } from "./timeSlots";

describe("createThirtyMinuteSlots", () => {
  it("creates 30 minute slots from 08:00 through 23:30", () => {
    const slots = createThirtyMinuteSlots();

    expect(slots).toHaveLength(32);
    expect(slots[0]).toBe("08:00");
    expect(slots[1]).toBe("08:30");
    expect(slots.at(-1)).toBe("23:30");
  });
});
