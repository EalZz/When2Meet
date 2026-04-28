export function createThirtyMinuteSlots(): string[] {
  const slots: string[] = [];

  for (let hour = 8; hour < 24; hour += 1) {
    for (const minute of [0, 30]) {
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }

  return slots;
}
