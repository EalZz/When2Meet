import { supabase } from "../../lib/supabase";
import type { Room } from "./roomTypes";

function createInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function createRoomId() {
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return template.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const next = char === "x" ? value : (value & 0x3) | 0x8;
    return next.toString(16);
  });
}

function mapRoom(row: any): Room {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    ownerUserId: row.owner_user_id,
  };
}

export async function listRooms(userId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from("room_members")
    .select("rooms(id, name, invite_code, owner_user_id)")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => mapRoom(row.rooms));
}

export async function createRoom(name: string, userId: string): Promise<Room> {
  const roomId = createRoomId();
  const inviteCode = createInviteCode();

  const { error } = await supabase
    .from("rooms")
    .insert({
      id: roomId,
      name: name.trim(),
      invite_code: inviteCode,
      owner_user_id: userId,
    });

  if (error) {
    throw error;
  }

  const { error: memberError } = await supabase.from("room_members").insert({
    room_id: roomId,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    throw memberError;
  }

  return {
    id: roomId,
    name: name.trim(),
    inviteCode,
    ownerUserId: userId,
  };
}

export async function joinRoom(inviteCode: string, _userId: string) {
  const normalizedCode = inviteCode.trim().toUpperCase();

  const { data, error } = await supabase.rpc("join_room_by_invite_code", {
    input_invite_code: normalizedCode,
  });

  if (error) {
    if (error.message.includes("INVITE_CODE_NOT_FOUND")) {
      throw new Error("초대코드를 찾을 수 없습니다.");
    }
    if (error.message.includes("AUTH_REQUIRED")) {
      throw new Error("로그인이 필요합니다.");
    }
    throw error;
  }

  if (!data) {
    throw new Error("초대코드로 방에 참여하지 못했습니다.");
  }

  return data as string;
}

export async function listRoomMembers(roomId: string) {
  const { data, error } = await supabase
    .from("room_members")
    .select("user_id, profiles(display_name, username)")
    .eq("room_id", roomId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.user_id as string,
    name: row.profiles?.display_name ?? row.profiles?.username ?? "사용자",
  }));
}
