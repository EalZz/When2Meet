export type SlotStatus = "available" | "unavailable";

export type SlotInput = {
  slotTime: string;
  status: SlotStatus | null;
};

export type SaveAvailabilityInput = {
  roomId: string;
  userId: string;
  date: string;
  title?: string | null;
  slots: SlotInput[];
};
