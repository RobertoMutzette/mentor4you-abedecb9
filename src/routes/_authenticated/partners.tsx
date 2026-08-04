import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rankMatches, type ProfileLite, type Scored } from "@/lib/matching";
import { sendConnectionRequest } from "@/lib/connections";
import { LocationMap } from "@/components/LocationMap";
import { ArrowUpRight, Check, Clock, Loader2, Map as MapIcon, MapPin, Rows3, Search, Sparkles, X } from "lucide-react";


export const Route = createFileRoute("/_authenticated/partners")({
  head: () => ({ meta: [{ title: "Find a Partner — Mentor4You" }] }),
  component: PartnersPage,
});

type Profile = ProfileLite & { onboarded: boolean };

function PartnersPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [pool, setPool] = useState<Profile[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [q, setQ] = useState("");

  const [skillFilter, setSkillFilter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: mine }, { data: rest }, { data: reqs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("profiles").select("*").neq("id", u.user.id).eq("onboarded", true),
        supabase.from("connection_requests").select("to_user").eq("from_user", u.user.id),
      ]);
      setMe(mine as Profile);
      // partners = anyone open to collab
      setPool(((rest || []) as Profile[]).filter((p) =>
        (p.role === "mentee" && p.looking_for_partners) ||
        (p.role === "mentor" && p.open_to_collab)
      ));
      setSent(new Set((reqs || []).map((r: any) => r.to_user)));
      setLoading(false);
    })();
  }, []);

  const allSkills = useMemo(() => {
    const s = new Set<string>();
    pool.forEach((p) => p.skills.forEach((x) => s.add(x)));
    return Array.from(s).sort();
  }, [pool]);

  const ranked = useMemo(() => {
    if (!me) return [];
    let filtered = pool;
    if (skillFilter) filtered = filtered.filter((p) => p.skills.includes(skillFilter));
    if (q) {
      const lc = q.toLowerCase();
      filtered = filtered.filter((p) =>
        p.full_name.toLowerCase().includes(lc) ||
        p.bio.toLowerCase().includes(lc) ||
        p.skills.some((s) => s.toLowerCase().includes(lc)) ||
        p.interests.some((s) => s.toLowerCase().includes(lc))
      );
    }
    return rankMatches(me, filtered, 60);
  }, [me, pool, q, skillFilter]);

  if (loading) return <div className="mx-auto max-w-6xl px-6 py-16 text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading partners…</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 md:p-10">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium mb-4">
          <Sparkles className="h-3 w-3" /> Your #1 destination
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-balance">Find your build partner</h1>
        <p className="mt-4 text-muted-foreground max-w-xl text-lg">
          People open to collaboration, ranked by how well your skills, interests and goals align. Send a request — start shipping this week.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />{pool.length} builder{pool.length === 1 ? "" : "s"} available</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />Fit score 0–100</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />1-tap connect</span>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, skill, interest…"
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm outline-none focus:border-primary transition" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {skillFilter && (
            <button onClick={() => setSkillFilter(null)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
              {skillFilter} <X className="h-3 w-3" />
            </button>
          )}
          {allSkills.slice(0, 14).filter((s) => s !== skillFilter).map((s) => (
            <button key={s} onClick={() => setSkillFilter(s)} className="px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium hover:bg-secondary shrink-0 transition">
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setView("list")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${view === "list" ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-secondary"}`}>
          <Rows3 className="h-4 w-4" /> List
        </button>
        <button onClick={() => setView("map")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${view === "map" ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-secondary"}`}>
          <MapIcon className="h-4 w-4" /> Map
        </button>
        <span className="text-xs text-muted-foreground ml-1">{ranked.length} result{ranked.length === 1 ? "" : "s"}</span>
      </div>

      {view === "map" ? (
        <div className="mb-6">
          <LocationMap
            height={520}
            markers={ranked
              .filter((p: any) => p.latitude && p.longitude)
              .map((p: any) => ({
                id: p.id,
                latitude: p.latitude,
                longitude: p.longitude,
                title: p.full_name,
                subtitle: p.headline || p.location_label || p.location || "",
                href: `/u/${p.id}`,
              }))}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Only partners who shared a location appear on the map. Add yours in profile settings.
          </p>
        </div>
      ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

        {ranked.map((p) => (
          <PartnerCard key={p.id} p={p} alreadySent={sent.has(p.id)} onConnect={async () => {
            await sendConnectionRequest(p.id);
            setSent((s) => new Set(s).add(p.id));
          }} />
        ))}
        {ranked.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No partners match those filters yet. Try clearing them, or invite friends to join.
          </div>
        )}
      </div>
      )}
    </div>

  );
}

function PartnerCard({ p, alreadySent, onConnect }: { p: Scored<ProfileLite>; alreadySent: boolean; onConnect: () => Promise<void> }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(alreadySent);
  const initials = p.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <article className="rounded-3xl border border-border bg-card p-6 flex flex-col hover:shadow-card transition">
      <div className="flex items-start justify-between gap-3">
        <Link to="/u/$id" params={{ id: p.id }} className="flex items-center gap-3 min-w-0 group">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/50 text-primary-foreground flex items-center justify-center font-display font-bold shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold leading-tight truncate group-hover:text-primary transition">{p.full_name || "Anonymous"}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 capitalize">
              {p.role}{p.location && <><span>·</span><MapPin className="h-3 w-3" />{p.location}</>}
            </div>
          </div>
        </Link>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fit</div>
          <div className="font-display font-bold text-2xl leading-none text-primary">{p.score}</div>
        </div>
      </div>

      {p.bio && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.bio}</p>}

      {p.skills.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Skills</div>
          <div className="flex flex-wrap gap-1">
            {p.skills.slice(0, 6).map((s) => (
              <span key={s} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${p.overlap.skills.includes(s) ? "bg-primary/10 text-primary" : "bg-secondary"}`}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {p.reasons.length > 0 && (
        <ul className="mt-3 space-y-1">
          {p.reasons.slice(0, 2).map((r) => (
            <li key={r} className="text-xs flex items-start gap-1.5"><Check className="h-3 w-3 mt-0.5 text-primary shrink-0" /> {r}</li>
          ))}
        </ul>
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
