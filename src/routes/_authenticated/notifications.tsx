import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { markAllRead, markRead, type Notification } from "@/lib/notifications";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Mentor4You" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(100);
    setItems((data || []) as Notification[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    let channel: any;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      channel = supabase.channel("notifications-page")
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${u.user.id}` }, () => load())
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight inline-flex items-center gap-2"><Bell className="h-6 w-6" /> Notifications</h1>
        <button onClick={async () => { await markAllRead(); load(); }}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full hover:bg-secondary transition">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </header>

      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">No notifications yet.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <Link to={n.link || "/dashboard"}
                onClick={() => !n.read && markRead(n.id)}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition ${n.read ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}>
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{n.title}</div>
                  {n.body && <div className="text-sm text-muted-foreground mt-0.5">{n.body}</div>}
                  <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.read && (
                  <button onClick={(e) => { e.preventDefault(); markRead(n.id).then(load); }} className="p-1.5 rounded-full hover:bg-secondary transition shrink-0" aria-label="Mark read">
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
