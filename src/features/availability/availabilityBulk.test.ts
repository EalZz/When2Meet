import { describe, expect, it } from "vitest";
import { bulkAvailabilityFullDayRange, createBulkAvailabilitySlots } from "./availabilityBulk";

describe("createBulkAvailabilitySlots", () => {
  it("uses the app full-day range for bulk operations", () => {
    expect(bulkAvailabilityFullDayRange).toEqual({
      startTime: "08:00",
      endTime: "24:00",
    });
  });

  it("creates full-day available slot records", () => {
    const slots = createBulkAvailabilitySlots("available");
    expect(slots).toHaveLength(32);
    expect(slots[0]).toEqual({ slotTime: "08:00", status: "available" });
    expect(slots[slots.length - 1]).toEqual({ slotTime: "23:30", status: "available" });
  });

  it("creates full-day unavailable slot records", () => {
    const slots = createBulkAvailabilitySlots("unavailable");
    expect(slots).toHaveLength(32);
    expect(slots[0]).toEqual({ slotTime: "08:00", status: "unavailable" });
    expect(slots[slots.length - 1]).toEqual({ slotTime: "23:30", status: "unavailable" });
  });

  it("creates full-day delete slot records", () => {
    const slots = createBulkAvailabilitySlots("delete");
    expect(slots).toHaveLength(32);
    expect(slots[0]).toEqual({ slotTime: "08:00", status: null });
    expect(slots[slots.length - 1]).toEqual({ slotTime: "23:30", status: null });
  });
});
