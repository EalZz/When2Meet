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
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName.trim(),
      avatar_url: input.avatarUrl ?? null,
      bio: input.bio ?? null,
      theme_preference: input.themePreference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select(profileColumns)
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}
