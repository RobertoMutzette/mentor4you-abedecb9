import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit } from "./storage";
import { createNotification } from "./notifications";

export async function sendConnectionRequest(toUserId: string, message = "") {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  // Block check (both directions)
  const { data: blocks } = await supabase.from("user_blocks").select("blocker_id")
    .or(`and(blocker_id.eq.${u.user.id},blocked_id.eq.${toUserId}),and(blocker_id.eq.${toUserId},blocked_id.eq.${u.user.id})`)
    .limit(1);
  if (blocks && blocks.length > 0) throw new Error("You can't connect with this user.");
  const allowed = await checkRateLimit("connection_request", 30);
  if (!allowed) throw new Error("You've sent too many requests this hour. Try again later.");
  const { error } = await supabase.from("connection_requests").insert({
    from_user: u.user.id,
    to_user: toUserId,
    message,
  });
  if (error && !/duplicate key/i.test(error.message)) throw error;
  const { data: me } = await supabase.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle();
  await createNotification({
    user_id: toUserId,
    type: "connection_request",
    title: "New connection request",
    body: `${me?.full_name || "Someone"} wants to connect.`,
    link: "/requests",
  });
}

export async function respondToRequest(id: string, status: "accepted" | "declined") {
  const { data: req } = await supabase.from("connection_requests").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("connection_requests").update({ status }).eq("id", id);
  if (error) throw error;
  if (req && status === "accepted") {
    const { data: me } = await supabase.auth.getUser();
    const { data: meProfile } = me.user ? await supabase.from("profiles").select("full_name").eq("id", me.user.id).maybeSingle() : { data: null };
    await createNotification({
      user_id: req.from_user,
      type: "connection_accepted",
      title: "Connection accepted",
      body: `${meProfile?.full_name || "Your request"} was accepted.`,
      link: "/requests",
    });
  }
}

export async function cancelRequest(id: string) {
  const { error } = await supabase.from("connection_requests").delete().eq("id", id);
  if (error) throw error;
}
