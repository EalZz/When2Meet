export type AvailabilityStatus = "available" | "unavailable";

export type AvailabilitySlot = {
  roomId: string;
  userId: string;
  date: string;
  slotTime: string;
  status: AvailabilityStatus;
  displayName: string;
};

export type CandidateSlot = {
  date: string;
  slotTime: string;
  users: Array<{
    userId: string;
    displayName: string;
  }>;
};

export type DateMarkerState = "available" | "unavailable" | "partial";

function addThirtyMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + 30;
  const nextHours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const nextMinutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${nextHours}:${nextMinutes}`;
}

export function findCandidateSlots(slots: AvailabilitySlot[]): CandidateSlot[] {
  const checkedUsersByDate = new Map<string, Set<string>>();
  const availableUsersByDateSlot = new Map<
    string,
    Map<string, AvailabilitySlot[]>
  >();

  for (const slot of slots) {
    if (!checkedUsersByDate.has(slot.date)) {
      checkedUsersByDate.set(slot.date, new Set());
    }
    checkedUsersByDate.get(slot.date)!.add(slot.userId);

    if (slot.status !== "available") {
      continue;
    }

    if (!availableUsersByDateSlot.has(slot.date)) {
      availableUsersByDateSlot.set(slot.date, new Map());
    }

    const slotMap = availableUsersByDateSlot.get(slot.date)!;
    if (!slotMap.has(slot.slotTime)) {
      slotMap.set(slot.slotTime, []);
    }
    slotMap.get(slot.slotTime)!.push(slot);
  }

  const candidates: CandidateSlot[] = [];

  for (const [date, slotMap] of availableUsersByDateSlot) {
    const checkedUserCount = checkedUsersByDate.get(date)?.size ?? 0;
    if (checkedUserCount < 2) {
      continue;
    }

    for (const [slotTime, availableSlots] of slotMap) {
      const uniqueUsers = new Map(
        availableSlots.map((slot) => [slot.userId, slot]),
      );

      if (uniqueUsers.size >= 2) {
        candidates.push({
          date,
          slotTime,
          users: Array.from(uniqueUsers.values()).map((slot) => ({
            userId: slot.userId,
            displayName: slot.displayName,
          })),
        });
      }
    }
  }

  const sortedCandidates = candidates.sort((a, b) =>
    `${a.date} ${a.slotTime}`.localeCompare(`${b.date} ${b.slotTime}`),
  );

  return sortedCandidates.filter((candidate, index) => {
    const previous = sortedCandidates[index - 1];

    if (!previous || previous.date !== candidate.date) {
      return true;
    }

    return addThirtyMinutes(previous.slotTime) !== candidate.slotTime;
  });
}

export function summarizeDateMarkersForUser(
  slots: AvailabilitySlot[],
  userId: string,
): Record<string, DateMarkerState> {
  const grouped = new Map<string, Set<AvailabilityStatus>>();

  for (const slot of slots) {
    if (slot.userId !== userId) {
      continue;
    }

    if (!grouped.has(slot.date)) {
      grouped.set(slot.date, new Set());
    }

    grouped.get(slot.date)!.add(slot.status);
  }

  const result: Record<string, DateMarkerState> = {};

  for (const [date, statuses] of grouped) {
    if (statuses.has("available") && statuses.has("unavailable")) {
      result[date] = "partial";
    } else if (statuses.has("available")) {
      result[date] = "available";
    } else if (statuses.has("unavailable")) {
      result[date] = "unavailable";
    }
  }

  return result;
}
