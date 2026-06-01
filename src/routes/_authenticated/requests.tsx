import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { respondToRequest, cancelRequest } from "@/lib/connections";
import { Check, Inbox, Loader2, Send, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "Inbox — Mentor4You" }] }),
  component: RequestsPage,
});

type Req = {
  id: string;
  from_user: string;
  to_user: string;
  status: "pending" | "accepted" | "declined";
  message: string;
  created_at: string;
};
type Profile = { id: string; full_name: string; role: string | null; bio: string };

function RequestsPage() {
  const [me, setMe] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<Req[]>([]);
  const [outgoing, setOutgoing] = useState<Req[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);
    const [{ data: inc }, { data: out }] = await Promise.all([
      supabase.from("connection_requests").select("*").eq("to_user", u.user.id).order("created_at", { ascending: false }),
      supabase.from("connection_requests").select("*").eq("from_user", u.user.id).order("created_at", { ascending: false }),
    ]);
    const allIds = Array.from(new Set([...(inc || []), ...(out || [])].flatMap((r: any) => [r.from_user, r.to_user])));
    if (allIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, role, bio").in("id", allIds);
      const map: Record<string, Profile> = {};
      (profs || []).forEach((p: any) => (map[p.id] = p));
      setProfiles(map);
    }
    setIncoming((inc || []) as Req[]);
    setOutgoing((out || []) as Req[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="mx-auto max-w-4xl px-6 py-16 text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading inbox…</div>;

  const list = tab === "incoming" ? incoming : outgoing;
  const pendingCount = incoming.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
          <Inbox className="h-3 w-3" /> Connection requests
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Inbox</h1>
      </header>

      <div className="flex gap-2 mb-6">
        <TabBtn active={tab === "incoming"} onClick={() => setTab("incoming")}>
          Incoming{pendingCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">{pendingCount}</span>}
        </TabBtn>
        <TabBtn active={tab === "outgoing"} onClick={() => setTab("outgoing")}>Sent</TabBtn>
      </div>

      <div className="space-y-3">
        {list.map((r) => {
          const otherId = tab === "incoming" ? r.from_user : r.to_user;
          const other = profiles[otherId];
          return (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
              <div className="h-11 w-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display font-bold shrink-0">
                {(other?.full_name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-display font-semibold">{other?.full_name || "Unknown"}</div>
                  <span className="text-xs text-muted-foreground capitalize">{other?.role}</span>
                  <StatusBadge status={r.status} />
                </div>
                {r.message && <p className="mt-1 text-sm text-muted-foreground">"{r.message}"</p>}
                {!r.message && <p className="mt-1 text-sm text-muted-foreground italic">Wants to connect</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {tab === "incoming" && r.status === "pending" && (
                  <>
                    <button onClick={async () => { await respondToRequest(r.id, "accepted"); load(); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 transition"><Check className="h-3 w-3" /> Accept</button>
                    <button onClick={async () => { await respondToRequest(r.id, "declined"); load(); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-secondary transition"><X className="h-3 w-3" /> Decline</button>
                  </>
                )}
                {tab === "outgoing" && r.status === "pending" && (
                  <button onClick={async () => { await cancelRequest(r.id); load(); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-secondary transition"><X className="h-3 w-3" /> Cancel</button>
                )}
              </div>
            </article>
          );
        })}
        {list.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            {tab === "incoming"
              ? "No incoming requests yet — your matches will show up here when they connect."
              : <>You haven't sent any requests. <span className="inline-flex items-center gap-1"><Send className="h-3 w-3" /> Tap "Connect" on a match to start.</span></>}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition inline-flex items-center ${active ? "bg-foreground text-background" : "bg-card border border-border hover:bg-secondary"}`}>
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: Req["status"] }) {
  const cls = status === "accepted" ? "bg-primary/10 text-primary"
    : status === "declined" ? "bg-destructive/10 text-destructive"
    : "bg-secondary text-muted-foreground";
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${cls}`}>{status}</span>;
}
