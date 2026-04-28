import type { ThemePreference } from "../../theme/themeLogic";

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: "user" | "admin";
  themePreference: ThemePreference;
};

export type UpdateProfileInput = {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  themePreference?: ThemePreference;
};
