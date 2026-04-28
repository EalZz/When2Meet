import { supabase } from "../../lib/supabase";
import type { CreateIssueInput, IssueStatus } from "./issueTypes";

export async function createIssue(input: CreateIssueInput) {
  const { data, error } = await supabase
    .from("user_issues")
    .insert({
      user_id: input.userId,
      room_id: input.roomId ?? null,
      issue_type: input.issueType,
      title: input.title.trim(),
      body: input.body.trim(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listIssuesForAdmin() {
  const { data, error } = await supabase
    .from("user_issues")
    .select("*, profiles(username, display_name), rooms(name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateIssueStatus(issueId: string, status: IssueStatus) {
  const { data, error } = await supabase
    .from("user_issues")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", issueId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
