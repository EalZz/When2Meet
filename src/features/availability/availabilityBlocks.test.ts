import { describe, expect, it } from "vitest";

import { expandBlockToSlots } from "./availabilityBlocks";

describe("expandBlockToSlots", () => {
  it("includes every 30 minute slot from start time up to but not including end time", () => {
    expect(expandBlockToSlots("10:00", "11:30")).toEqual([
      "10:00",
      "10:30",
      "11:00",
    ]);
  });

  it("supports 24:00 as the exclusive end time", () => {
    expect(expandBlockToSlots("23:30", "24:00")).toEqual(["23:30"]);
    expect(expandBlockToSlots("08:00", "24:00")).toHaveLength(32);
  });

  it("returns an empty list when the end time is not after the start time", () => {
    expect(expandBlockToSlots("11:00", "10:00")).toEqual([]);
  });
});
