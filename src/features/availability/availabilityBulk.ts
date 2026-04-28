import { createThirtyMinuteSlots } from "../../constants/timeSlots";

export const bulkAvailabilityFullDayRange = {
  startTime: "08:00",
  endTime: "24:00",
} as const;

export type BulkAvailabilityAction = "available" | "unavailable" | "delete";

export function createBulkAvailabilitySlots(action: BulkAvailabilityAction) {
  return createThirtyMinuteSlots().map((slotTime) => ({
    slotTime,
    status: action === "delete" ? null : action,
  }));
}
