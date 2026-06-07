import { supabase } from "@/integrations/supabase/client";

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
};

export async function createNotification(input: {
  user_id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  data?: Record<string, unknown>;
}) {
  // Cross-user notifications go through SECURITY DEFINER RPC; self-notifications via direct insert.
  const { data: u } = await supabase.auth.getUser();
  if (u.user && u.user.id === input.user_id) {
    await supabase.from("notifications").insert({
      user_id: input.user_id, type: input.type, title: input.title,
      body: input.body ?? "", link: input.link ?? "", data: (input.data ?? {}) as any,
    });
    return;
  }
  await (supabase.rpc as any)("create_notification", {
    _user_id: input.user_id, _type: input.type, _title: input.title,
    _body: input.body ?? "", _link: input.link ?? "", _data: input.data ?? {},
  });
}

export async function markRead(id: string) {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllRead() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", u.user.id).eq("read", false);
}
