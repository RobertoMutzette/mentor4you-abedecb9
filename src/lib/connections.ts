import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit } from "./storage";

export async function sendConnectionRequest(toUserId: string, message = "") {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const allowed = await checkRateLimit("connection_request", 30);
  if (!allowed) throw new Error("You've sent too many requests this hour. Try again later.");
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
