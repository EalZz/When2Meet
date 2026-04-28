import { supabase } from "../../lib/supabase";
import type { SignInInput, SignUpInput } from "./authTypes";
import { usernameToEmail } from "./authLogic";

export async function signUp(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(input.username),
    password: input.password,
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error(
      "회원가입은 되었지만 로그인 세션이 생성되지 않았습니다. Supabase Authentication > Email에서 Confirm email을 꺼 주세요.",
    );
  }

  // Ensure subsequent DB writes run with the just-created auth session.
  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      username: input.username.trim().toLowerCase(),
      display_name: input.displayName.trim(),
    });

    if (profileError) {
      throw profileError;
    }
  }

  return data;
}

export async function signIn(input: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(input.username),
    password: input.password,
  });

  if (error) {
    throw error;
  }

  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
