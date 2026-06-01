import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rankMatches, type ProfileLite, type Scored } from "@/lib/matching";
import { sendConnectionRequest } from "@/lib/connections";
import { Sparkles, Compass, MapPin, ArrowUpRight, Check, Clock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Mentor4You" }] }),
  component: DashboardPage,
});

type Profile = ProfileLite & { onboarded: boolean };

function DashboardPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Profile | null>(null);
  const [others, setOthers] = useState<Profile[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: mine }, { data: rest }, { data: reqs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("profiles").select("*").neq("id", u.user.id).eq("onboarded", true),
        supabase.from("connection_requests").select("to_user").eq("from_user", u.user.id),
      ]);
      if (!mine || !mine.onboarded) { navigate({ to: "/onboarding" }); return; }
      setMe(mine as Profile);
      setOthers((rest || []) as Profile[]);
      setSent(new Set((reqs || []).map((r: any) => r.to_user)));
      setLoading(false);
    })();
  }, [navigate]);

  const targetRole = me?.role === "mentor" ? "mentee" : "mentor";
  const matches = useMemo(() => {
    if (!me) return [];
    const pool = others.filter((o) => o.role === targetRole);
    return rankMatches(me, pool, 12);
  }, [me, others, targetRole]);

  if (loading || !me) return <Loading />;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/40 border border-border p-7">
          <div className="text-sm font-medium text-primary capitalize">{me.role}</div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, {me.full_name.split(" ")[0] || "builder"}.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg">
            {me.role === "mentor"
              ? "These mentees match your expertise and goals — sorted by compatibility."
              : "Your top mentor matches, ranked 0-100 by interests, complementary skills, experience gap and availability."}
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <Link to="/onboarding" className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border border-border bg-card hover:bg-secondary transition">
              Edit profile <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            {me.role === "mentee" && (
              <Link to="/partners" className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition">
                Find a partner <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
        <div className="rounded-3xl bg-card border border-border p-7">
          <div className="text-sm font-medium text-muted-foreground">Your profile signal</div>
          <Row label="Skills" items={me.skills} />
          <Row label="Interests" items={me.interests} />
          <Row label="Goals" items={me.goals} />
        </div>
      </div>

      <div className="flex items-end justify-between mb-5">
        <h2 className="font-display text-2xl font-bold">
          {me.role === "mentor" ? "Mentees who match you" : "Mentors for you"}
        </h2>
        <span className="text-sm text-muted-foreground">{matches.length} match{matches.length === 1 ? "" : "es"}</span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {matches.map((p) => (
          <MatchCard key={p.id} p={p} alreadySent={sent.has(p.id)} onConnect={async () => {
            await sendConnectionRequest(p.id);
            setSent((s) => new Set(s).add(p.id));
          }} />
        ))}
        {matches.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No {targetRole} matches yet — check back soon as more people join.
          </div>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading your matches…
    </div>
  );
}

function Row({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
        {items.map((s) => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary">{s}</span>)}
      </div>
    </div>
  );
}

function MatchCard({ p, alreadySent, onConnect }: { p: Scored<Profile>; alreadySent: boolean; onConnect: () => Promise<void> }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(alreadySent);
  const initials = p.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";
  const scoreColor = p.score >= 80 ? "text-primary" : p.score >= 60 ? "text-foreground" : "text-muted-foreground";

  return (
    <article className="rounded-3xl border border-border bg-card p-6 flex flex-col hover:shadow-card transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display font-bold shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold leading-tight truncate">{p.full_name || "Anonymous"}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              {p.role === "mentor" ? <Compass className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              <span className="capitalize">{p.role}</span>
              {p.location && <><span>·</span><MapPin className="h-3 w-3" />{p.location}</>}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Match</div>
          <div className={`font-display font-bold text-2xl leading-none ${scoreColor}`}>{p.score}</div>
        </div>
      </div>

      {p.bio && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{p.bio}</p>}

      {p.reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {p.reasons.slice(0, 3).map((r) => (
            <li key={r} className="text-xs flex items-start gap-1.5">
              <Check className="h-3 w-3 mt-0.5 text-primary shrink-0" /> <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      {p.overlap.complementary.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {p.overlap.complementary.slice(0, 4).map((s) => (
            <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
          ))}
        </div>
      )}

      <button
        disabled={sent || sending}
        onClick={async () => { setSending(true); try { await onConnect(); setSent(true); } finally { setSending(false); } }}
        className="mt-5 inline-flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {sent ? <><Clock className="h-4 w-4" /> Request sent</> : sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Connect <ArrowUpRight className="h-4 w-4" /></>}
      </button>
    </article>
  );
}
