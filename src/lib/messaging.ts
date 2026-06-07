import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;

export type Conversation = {
  id: string; user_a: string; user_b: string; last_message_at: string; created_at: string;
};
export type DMMessage = {
  id: string; conversation_id: string; sender_id: string; body: string; read_at: string | null; created_at: string;
};

export async function getOrCreateConversation(otherUserId: string): Promise<string> {
  const { data, error } = await sb.rpc("get_or_create_conversation", { _other: otherUserId });
  if (error) throw error;
  return data as string;
}

export async function listConversations() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await sb.from("conversations").select("*").order("last_message_at", { ascending: false });
  if (!data) return [];
  const otherIds = data.map((c: any) => (c.user_a === u.user!.id ? c.user_b : c.user_a));
  const { data: profiles } = await sb.from("profiles").select("id, full_name, avatar_url, headline").in("id", otherIds);
  const map = new Map((profiles || []).map((p: any) => [p.id, p]));
  // Last message preview
  const { data: lastMsgs } = await sb.from("dm_messages")
    .select("conversation_id, body, sender_id, created_at, read_at")
    .in("conversation_id", data.map((c: any) => c.id))
    .order("created_at", { ascending: false });
  const lastMap = new Map<string, any>();
  for (const m of lastMsgs || []) if (!lastMap.has(m.conversation_id)) lastMap.set(m.conversation_id, m);
  return data.map((c: any) => {
    const otherId = c.user_a === u.user!.id ? c.user_b : c.user_a;
    return { ...c, other: map.get(otherId) || { id: otherId, full_name: "Unknown" }, last: lastMap.get(c.id) || null };
  });
}

export async function fetchMessages(conversationId: string): Promise<DMMessage[]> {
  const { data } = await sb.from("dm_messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(200);
  return (data || []) as DMMessage[];
}

export async function sendMessage(conversationId: string, body: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await sb.from("dm_messages").insert({ conversation_id: conversationId, sender_id: u.user.id, body });
  if (error) throw error;
  // Notify other user
  const { data: conv } = await sb.from("conversations").select("user_a, user_b").eq("id", conversationId).maybeSingle();
  if (conv) {
    const other = conv.user_a === u.user.id ? conv.user_b : conv.user_a;
    const { data: me } = await sb.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle();
    await sb.rpc("create_notification", {
      _user_id: other, _type: "message", _title: `Message from ${me?.full_name || "Someone"}`,
      _body: body.slice(0, 140), _link: `/messages/${conversationId}`, _data: {},
    });
  }
}

export async function markMessagesRead(conversationId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await sb.from("dm_messages").update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId).neq("sender_id", u.user.id).is("read_at", null);
}
