import { supabase } from "@/integrations/supabase/client";

export async function blockUser(blockedId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase.from("user_blocks").insert({ blocker_id: u.user.id, blocked_id: blockedId });
  if (error && !/duplicate/i.test(error.message)) throw error;
}

export async function unblockUser(blockedId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("user_blocks").delete().eq("blocker_id", u.user.id).eq("blocked_id", blockedId);
}

export async function isBlocked(blockedId: string): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data } = await supabase
    .from("user_blocks").select("id")
    .eq("blocker_id", u.user.id).eq("blocked_id", blockedId).maybeSingle();
  return !!data;
}

export async function reportUser(reportedId: string, reason: string, details = "") {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase.from("user_reports").insert({
    reporter_id: u.user.id, reported_id: reportedId, reason, details,
  });
  if (error) throw error;
}
