import { createThirtyMinuteSlots } from "../../constants/timeSlots";

export type AvailabilityBlockStatus = "unchecked" | "available" | "unavailable";

export type AvailabilityBlock = {
  id: string;
  userId: string;
  userName: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AvailabilityBlockStatus;
};

export function expandBlockToSlots(startTime: string, endTime: string): string[] {
  const slots = createThirtyMinuteSlots();
  const startIndex = slots.indexOf(startTime);
  const endIndex = slots.indexOf(endTime);

  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    return [];
  }

  return slots.slice(startIndex, endIndex);
}

export function blockToSlotRecords(block: AvailabilityBlock) {
  return expandBlockToSlots(block.startTime, block.endTime).map((slotTime) => ({
    slotTime,
    status: block.status === "unchecked" ? null : block.status,
  }));
}
