import { supabase } from "@/integrations/supabase/client";

export async function sendConnectionRequest(toUserId: string, message = "") {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase.from("connection_requests").insert({
    from_user: u.user.id,
    to_user: toUserId,
    message,
  });
  if (error && !/duplicate key/i.test(error.message)) throw error;
}

export async function respondToRequest(id: string, status: "accepted" | "declined") {
  const { error } = await supabase.from("connection_requests").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function cancelRequest(id: string) {
  const { error } = await supabase.from("connection_requests").delete().eq("id", id);
  if (error) throw error;
}
