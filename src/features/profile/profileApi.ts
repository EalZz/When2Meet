import { supabase } from "../../lib/supabase";
import type { Profile, UpdateProfileInput } from "./profileTypes";

const profileColumns =
  "id, username, display_name, avatar_url, bio, role, theme_preference";

function mapProfile(row: any): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    role: row.role,
    themePreference: row.theme_preference,
  };
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select(profileColumns)
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const updates: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (input.displayName !== undefined) {
    updates.display_name = input.displayName.trim();
  }

  if (input.avatarUrl !== undefined) {
    updates.avatar_url = input.avatarUrl?.trim() ? input.avatarUrl.trim() : null;
  }

  if (input.bio !== undefined) {
    updates.bio = input.bio?.trim() ? input.bio.trim() : null;
  }

  if (input.themePreference !== undefined) {
    updates.theme_preference = input.themePreference;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select(profileColumns)
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}
