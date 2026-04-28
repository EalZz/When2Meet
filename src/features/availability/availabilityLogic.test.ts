import { describe, expect, it } from "vitest";

import { findCandidateSlots, type AvailabilitySlot } from "./availabilityLogic";

const baseSlot = (
  overrides: Partial<AvailabilitySlot>,
): AvailabilitySlot => ({
  roomId: "room-1",
  userId: "user-1",
  displayName: "사용자",
  date: "2026-04-27",
  slotTime: "10:00",
  status: "available",
  ...overrides,
});

describe("findCandidateSlots", () => {
  it("does not create candidates when fewer than two users checked the date", () => {
    const candidates = findCandidateSlots([
      baseSlot({ userId: "user-1", displayName: "사용자1" }),
    ]);

    expect(candidates).toEqual([]);
  });

  it("creates a candidate when two users are available for the same slot", () => {
    const candidates = findCandidateSlots([
      baseSlot({ userId: "user-1", displayName: "사용자1" }),
      baseSlot({ userId: "user-2", displayName: "사용자2" }),
    ]);

    expect(candidates).toEqual([
      {
        date: "2026-04-27",
        slotTime: "10:00",
        users: [
          { userId: "user-1", displayName: "사용자1" },
          { userId: "user-2", displayName: "사용자2" },
        ],
      },
    ]);
  });

  it("does not create a candidate when the second checked user is unavailable", () => {
    const candidates = findCandidateSlots([
      baseSlot({ userId: "user-1", displayName: "사용자1" }),
      baseSlot({
        userId: "user-2",
        displayName: "사용자2",
        status: "unavailable",
      }),
    ]);

    expect(candidates).toEqual([]);
  });

  it("collapses consecutive overlapping slots into the first slot only", () => {
    const candidates = findCandidateSlots([
      baseSlot({ userId: "user-1", displayName: "사용자1", slotTime: "10:00" }),
      baseSlot({ userId: "user-2", displayName: "사용자2", slotTime: "10:00" }),
      baseSlot({ userId: "user-1", displayName: "사용자1", slotTime: "10:30" }),
      baseSlot({ userId: "user-2", displayName: "사용자2", slotTime: "10:30" }),
    ]);

    expect(candidates).toEqual([
      {
        date: "2026-04-27",
        slotTime: "10:00",
        users: [
          { userId: "user-1", displayName: "사용자1" },
          { userId: "user-2", displayName: "사용자2" },
        ],
      },
    ]);
  });
});
