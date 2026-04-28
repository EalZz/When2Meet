import { supabase } from "../../lib/supabase";
import { listRooms } from "../rooms/roomApi";
import type { AvailabilityBlock } from "./availabilityBlocks";
import type { AvailabilitySlot } from "./availabilityLogic";
import type { SaveAvailabilityInput } from "./availabilityTypes";

type ProfileJoin = {
  display_name?: string | null;
  username?: string | null;
};

type SlotGroup = {
  userId: string;
  userName: string;
  date: string;
  title: string | null;
  status: "available" | "unavailable";
  slotTimes: string[];
  idPrefix: string;
};

function getProfileName(profileValue: ProfileJoin | ProfileJoin[] | null | undefined) {
  const profile = Array.isArray(profileValue) ? profileValue[0] : profileValue;
  return profile?.display_name ?? profile?.username ?? "사용자";
}

function addThirtyMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + 30;
  const nextHours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const nextMinutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${nextHours}:${nextMinutes}`;
}

function buildSlotTimes(startTime: string, endTime: string) {
  const slotTimes: string[] = [];
  let current = startTime;

  while (current < endTime) {
    slotTimes.push(current);
    current = addThirtyMinutes(current);
  }

  return slotTimes;
}

function groupContinuousSlots(slotTimes: string[]) {
  const sorted = [...slotTimes].sort((left, right) => left.localeCompare(right));
  const groups: Array<{ startTime: string; endTime: string }> = [];

  for (const slotTime of sorted) {
    const previous = groups[groups.length - 1];

    if (!previous) {
      groups.push({ startTime: slotTime, endTime: addThirtyMinutes(slotTime) });
      continue;
    }

    if (previous.endTime === slotTime) {
      previous.endTime = addThirtyMinutes(slotTime);
      continue;
    }

    groups.push({ startTime: slotTime, endTime: addThirtyMinutes(slotTime) });
  }

  return groups;
}

function buildBlocksFromSlotGroups(groups: SlotGroup[]) {
  const blocks: AvailabilityBlock[] = [];

  for (const group of groups) {
    for (const range of groupContinuousSlots(group.slotTimes)) {
      blocks.push({
        id: `${group.idPrefix}-${group.status}-${range.startTime}`,
        userId: group.userId,
        userName: group.userName,
        title: group.title ?? (group.status === "available" ? "가능" : "불가능"),
        date: group.date,
        startTime: range.startTime,
        endTime: range.endTime,
        status: group.status,
      });
    }
  }

  return blocks;
}

async function resolveRoomIdsForWrite(userId: string, directRoomIds: string[]) {
  const cleaned = directRoomIds.filter(Boolean);
  if (cleaned.length > 0) {
    return cleaned;
  }

  const rooms = await listRooms(userId);
  return rooms.map((room) => room.id);
}

export async function saveAvailability(input: SaveAvailabilityInput) {
  const checkedSlots = input.slots.filter((slot) => slot.status);
  const uncheckedSlots = input.slots.filter((slot) => !slot.status);

  const { error: noteError } = await supabase.from("availability_day_notes").upsert(
    {
      room_id: input.roomId,
      user_id: input.userId,
      date: input.date,
      title: input.title ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_id,user_id,date" },
  );

  if (noteError) {
    throw noteError;
  }

  if (checkedSlots.length > 0) {
    const { error } = await supabase.from("availability_slots").upsert(
      checkedSlots.map((slot) => ({
        room_id: input.roomId,
        user_id: input.userId,
        date: input.date,
        slot_time: slot.slotTime,
        title: input.title ?? null,
        status: slot.status,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "room_id,user_id,date,slot_time" },
    );

    if (error) {
      throw error;
    }
  }

  if (uncheckedSlots.length > 0) {
    const { error } = await supabase
      .from("availability_slots")
      .delete()
      .eq("room_id", input.roomId)
      .eq("user_id", input.userId)
      .eq("date", input.date)
      .in(
        "slot_time",
        uncheckedSlots.map((slot) => slot.slotTime),
      );

    if (error) {
      throw error;
    }
  }
}

export async function saveAvailabilityForAllRooms(
  input: Omit<SaveAvailabilityInput, "roomId">,
  directRoomIds: string[] = [],
) {
  const roomIds = await resolveRoomIdsForWrite(input.userId, directRoomIds);

  if (roomIds.length === 0) {
    return;
  }

  await Promise.all(
    roomIds.map((roomId) =>
      saveAvailability({
        ...input,
        roomId,
      }),
    ),
  );
}

export async function deleteAvailabilityForAllRooms(
  input: {
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
  },
  directRoomIds: string[] = [],
) {
  const roomIds = await resolveRoomIdsForWrite(input.userId, directRoomIds);

  if (roomIds.length === 0) {
    return;
  }

  const slotTimes = buildSlotTimes(input.startTime, input.endTime);

  await Promise.all(
    roomIds.map(async (roomId) => {
      const { error } = await supabase
        .from("availability_slots")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", input.userId)
        .eq("date", input.date)
        .in("slot_time", slotTimes);

      if (error) {
        throw error;
      }
    }),
  );
}

export async function savePersonalAvailability(input: {
  userId: string;
  date: string;
  title?: string | null;
  slots: Array<{ slotTime: string; status: "available" | "unavailable" | null }>;
}) {
  const checkedSlots = input.slots.filter((slot) => slot.status);
  const uncheckedSlots = input.slots.filter((slot) => !slot.status);

  const { error: noteError } = await supabase.from("personal_availability_day_notes").upsert(
    {
      user_id: input.userId,
      date: input.date,
      title: input.title ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" },
  );

  if (noteError) {
    throw noteError;
  }

  if (checkedSlots.length > 0) {
    const { error } = await supabase.from("personal_availability_slots").upsert(
      checkedSlots.map((slot) => ({
        user_id: input.userId,
        date: input.date,
        slot_time: slot.slotTime,
        title: input.title ?? null,
        status: slot.status,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,date,slot_time" },
    );

    if (error) {
      throw error;
    }
  }

  if (uncheckedSlots.length > 0) {
    const { error } = await supabase
      .from("personal_availability_slots")
      .delete()
      .eq("user_id", input.userId)
      .eq("date", input.date)
      .in(
        "slot_time",
        uncheckedSlots.map((slot) => slot.slotTime),
      );

    if (error) {
      throw error;
    }
  }
}

export async function deletePersonalAvailability(input: {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const slotTimes = buildSlotTimes(input.startTime, input.endTime);

  const { error } = await supabase
    .from("personal_availability_slots")
    .delete()
    .eq("user_id", input.userId)
    .eq("date", input.date)
    .in("slot_time", slotTimes);

  if (error) {
    throw error;
  }
}

export async function listPersonalAvailabilitySlots(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<AvailabilitySlot[]> {
  const { data, error } = await supabase
    .from("personal_availability_slots")
    .select("user_id, date, slot_time, status, profiles(display_name, username)")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    roomId: "personal",
    userId: row.user_id as string,
    date: row.date as string,
    slotTime: String(row.slot_time).slice(0, 5),
    status: row.status,
    displayName: getProfileName(row.profiles as ProfileJoin | ProfileJoin[] | null),
  }));
}

export async function listPersonalDayAvailabilityBlocks(
  userId: string,
  date: string,
): Promise<AvailabilityBlock[]> {
  const [{ data: slots, error: slotsError }, { data: notes, error: notesError }] =
    await Promise.all([
      supabase
        .from("personal_availability_slots")
        .select("user_id, date, slot_time, title, status, profiles(display_name, username)")
        .eq("user_id", userId)
        .eq("date", date),
      supabase
        .from("personal_availability_day_notes")
        .select("user_id, title")
        .eq("user_id", userId)
        .eq("date", date),
    ]);

  if (slotsError) {
    throw slotsError;
  }

  if (notesError) {
    throw notesError;
  }

  const fallbackTitle = (notes?.[0]?.title as string | null | undefined) ?? null;
  const userName = getProfileName((slots?.[0] as any)?.profiles as ProfileJoin | ProfileJoin[] | null);
  const grouped = new Map<string, SlotGroup>();

  for (const row of slots ?? []) {
    const slotTime = String(row.slot_time).slice(0, 5);
    const status = row.status as "available" | "unavailable";
    const title = (row.title as string | null | undefined) ?? fallbackTitle;
    const groupKey = `${status}::${title ?? ""}`;
    const current = grouped.get(groupKey) ?? {
      userId,
      userName,
      date,
      title,
      status,
      slotTimes: [],
      idPrefix: `${userId}-${date}-personal-${title ?? "untitled"}`,
    };
    current.slotTimes.push(slotTime);
    grouped.set(groupKey, current);
  }

  return buildBlocksFromSlotGroups(Array.from(grouped.values())).sort((left, right) =>
    left.startTime.localeCompare(right.startTime),
  );
}

export async function listAvailabilitySlots(
  roomId: string,
  startDate: string,
  endDate: string,
): Promise<AvailabilitySlot[]> {
  const { data, error } = await supabase
    .from("availability_slots")
    .select("room_id, user_id, date, slot_time, status, profiles(display_name, username)")
    .eq("room_id", roomId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    roomId: row.room_id as string,
    userId: row.user_id as string,
    date: row.date as string,
    slotTime: String(row.slot_time).slice(0, 5),
    status: row.status,
    displayName: getProfileName(row.profiles as ProfileJoin | ProfileJoin[] | null),
  }));
}

export async function listDayAvailabilityBlocks(
  roomId: string,
  date: string,
): Promise<AvailabilityBlock[]> {
  const [{ data: slots, error: slotsError }, { data: notes, error: notesError }] =
    await Promise.all([
      supabase
        .from("availability_slots")
        .select("room_id, user_id, date, slot_time, title, status, profiles(display_name, username)")
        .eq("room_id", roomId)
        .eq("date", date),
      supabase
        .from("availability_day_notes")
        .select("user_id, title")
        .eq("room_id", roomId)
        .eq("date", date),
    ]);

  if (slotsError) {
    throw slotsError;
  }

  if (notesError) {
    throw notesError;
  }

  const fallbackTitleByUserId = new Map<string, string | null>(
    (notes ?? []).map((row: any) => [row.user_id as string, row.title as string | null]),
  );
  const grouped = new Map<string, SlotGroup>();

  for (const row of slots ?? []) {
    const userId = row.user_id as string;
    const userName = getProfileName(row.profiles as ProfileJoin | ProfileJoin[] | null);
    const slotTime = String(row.slot_time).slice(0, 5);
    const status = row.status as "available" | "unavailable";
    const title = (row.title as string | null | undefined) ?? fallbackTitleByUserId.get(userId) ?? null;
    const groupKey = `${userId}::${status}::${title ?? ""}`;
    const current = grouped.get(groupKey) ?? {
      userId,
      userName,
      date,
      title,
      status,
      slotTimes: [],
      idPrefix: `${userId}-${date}-${title ?? "untitled"}`,
    };
    current.slotTimes.push(slotTime);
    grouped.set(groupKey, current);
  }

  return buildBlocksFromSlotGroups(Array.from(grouped.values())).sort((left, right) =>
    `${left.userName}-${left.startTime}`.localeCompare(`${right.userName}-${right.startTime}`),
  );
}
