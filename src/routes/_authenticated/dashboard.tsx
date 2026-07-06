import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { respondToRequest } from "@/lib/connections";
import {
  Rocket, Plus, ArrowUpRight, CalendarClock, CheckCircle2, Loader2,
  Users2, Sparkles, ArrowRight, Circle,
} from "lucide-react";
import type { Notification } from "@/lib/notifications";
import { markRead } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Workspace — Mentor4You" }] }),
  component: WorkspacePage,
});

type Profile = {
  id: string; full_name: string; role: string; onboarded: boolean;
};
type Project = {
  id: string; title: string; description: string | null;
  status: string | null; completion_percentage: number | null;
  owner_id: string; updated_at: string;
};
type Task = {
  id: string; project_id: string; title: string; due_at: string | null; done: boolean;
};
type Requester = {
  id: string; from_user: string; message: string | null;
  profile: { full_name: string; role: string } | null;
};

function WorkspacePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [requests, setRequests] = useState<Requester[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const uid = u.user.id;

    const [{ data: mine }, { data: owned }, { data: joined }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, role, onboarded").eq("id", uid).maybeSingle(),
      supabase.from("projects").select("id,title,description,status,completion_percentage,owner_id,updated_at").eq("owner_id", uid),
      supabase.from("project_members").select("project_id").eq("user_id", uid),
    ]);
    if (!mine || !mine.onboarded) { navigate({ to: "/onboarding" }); return; }

    const memberIds = (joined || []).map((r: any) => r.project_id);
    let joinedProjects: Project[] = [];
    if (memberIds.length) {
      const { data } = await supabase
        .from("projects").select("id,title,description,status,completion_percentage,owner_id,updated_at")
        .in("id", memberIds);
      joinedProjects = (data || []) as Project[];
    }
    const all = [...((owned || []) as Project[]), ...joinedProjects];
    const uniq = Array.from(new Map(all.map((p) => [p.id, p])).values())
      .sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1));

    const projIds = uniq.map((p) => p.id);
    const [{ data: ts }, { data: reqs }, { data: ns }] = await Promise.all([
      projIds.length
        ? supabase.from("project_tasks").select("id,project_id,title,due_at,done")
            .in("project_id", projIds).eq("done", false)
            .order("due_at", { ascending: true, nullsFirst: false }).limit(6)
        : Promise.resolve({ data: [] as Task[] } as any),
      supabase.from("connection_requests").select("id, from_user, message")
        .eq("to_user", uid).eq("status", "pending").limit(4),
      supabase.from("notifications").select("*").eq("user_id", uid)
        .order("created_at", { ascending: false }).limit(4),
    ]);

    let enriched: Requester[] = [];
    if (reqs && reqs.length) {
      const ids = reqs.map((r: any) => r.from_user);
      const { data: ps } = await supabase.from("profiles").select("id, full_name, role").in("id", ids);
      const map = new Map((ps || []).map((p: any) => [p.id, p]));
      enriched = reqs.map((r: any) => ({ ...r, profile: map.get(r.from_user) || null }));
    }

    setMe(mine as Profile);
    setProjects(uniq);
    setTasks((ts || []) as Task[]);
    setRequests(enriched);
    setNotifs((ns || []) as Notification[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  if (loading || !me) return (
    <div className="mx-auto max-w-6xl px-6 py-16 flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading your workspace…
    </div>
  );

  const firstName = me.full_name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-4">
      {/* Greeting header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{greeting}</div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            {firstName}, <span className="text-primary">let's build.</span>
          </h1>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" /> New project
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active projects — main */}
        <section className="lg:col-span-8 rounded-[32px] bg-card border border-border p-6 sm:p-8 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Active projects</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{projects.length} in flight</p>
            </div>
            <Link
              to="/projects"
              aria-label="Open all projects"
              className="p-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 transition"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <EmptyProjects />
          ) : (
            <div className="space-y-7">
              {projects.slice(0, 4).map((p) => {
                const pct = Math.max(0, Math.min(100, p.completion_percentage ?? 0));
                return (
                  <Link
                    key={p.id}
                    to="/project/$id"
                    params={{ id: p.id }}
                    className="block group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Rocket className="h-3.5 w-3.5 text-primary shrink-0" />
                          <h3 className="font-display font-bold text-lg truncate group-hover:text-primary transition">
                            {p.title}
                          </h3>
                        </div>
                        {p.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>
                        )}
                      </div>
                      <span className="font-display font-bold text-xl text-primary tabular-nums shrink-0">{pct}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Side rail: tasks + requests + activity */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Upcoming tasks */}
          <section className="rounded-[32px] bg-card border border-border p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Up next</h2>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks yet. Add one from a project to see it here.
              </p>
            ) : (
              <ul className="space-y-3">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 group">
                    <button
                      onClick={async () => {
                        await supabase.from("project_tasks").update({ done: true }).eq("id", t.id);
                        setTasks((ts) => ts.filter((x) => x.id !== t.id));
                      }}
                      className="mt-0.5 shrink-0"
                      aria-label="Mark done"
                    >
                      <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                    </button>
                    <Link to="/project/$id" params={{ id: t.project_id }} className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-tight">{t.title}</div>
                      {t.due_at && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDue(t.due_at)}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Requests — bold electric card */}
          <section className="rounded-[32px] bg-primary text-primary-foreground p-6 shadow-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users2 className="h-4 w-4" />
                <h2 className="font-display text-lg font-bold">New requests</h2>
              </div>
              {requests.length > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary-foreground text-primary text-[10px] font-bold flex items-center justify-center">
                  {requests.length}
                </span>
              )}
            </div>
            {requests.length === 0 ? (
              <p className="text-sm text-primary-foreground/80">
                Nothing pending. Head to <Link to="/partners" className="underline underline-offset-2 font-medium">Partners</Link> to send connections.
              </p>
            ) : (
              <ul className="space-y-3">
                {requests.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary-foreground/15 flex items-center justify-center text-xs font-display font-bold shrink-0">
                      {(r.profile?.full_name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate">{r.profile?.full_name || "Someone"}</div>
                      <div className="text-[11px] text-primary-foreground/70 capitalize">{r.profile?.role || "member"}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await respondToRequest(r.id, "accepted");
                        setRequests((rs) => rs.filter((x) => x.id !== r.id));
                      }}
                      className="text-[11px] font-bold bg-primary-foreground text-primary px-3 py-1.5 rounded-full hover:scale-[1.03] transition"
                    >
                      Accept
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/requests"
              className="mt-5 pt-4 border-t border-primary-foreground/15 flex items-center justify-between text-xs font-medium text-primary-foreground/85 hover:text-primary-foreground transition"
            >
              See all requests <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          {/* Recent activity */}
          <section className="rounded-[32px] bg-card border border-border p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Activity</h2>
            </div>
            {notifs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Quiet for now.</p>
            ) : (
              <ul className="space-y-3">
                {notifs.map((n) => (
                  <li key={n.id}>
                    <Link
                      to={n.link || "/dashboard"}
                      onClick={() => { if (!n.read) markRead(n.id); }}
                      className="flex items-start gap-2.5 group"
                    >
                      <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-snug group-hover:text-primary transition line-clamp-1">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function EmptyProjects() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Rocket className="h-5 w-5" />
      </div>
      <p className="font-display text-base font-bold">Start your first project</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Projects are your workbench — invite partners, track progress, ship together.
      </p>
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
      >
        <Plus className="h-4 w-4" /> Create project
      </Link>
    </div>
  );
}

function formatDue(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  const abs = Math.abs(ms);
  const hrs = Math.round(abs / 36e5);
  if (abs < 36e5) return ms < 0 ? "Overdue" : "Due within the hour";
  if (hrs < 24) return `${ms < 0 ? "Overdue by " : "Due in "}${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${ms < 0 ? "Overdue by " : "Due in "}${days}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
