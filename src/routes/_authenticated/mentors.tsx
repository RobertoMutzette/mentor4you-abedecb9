import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rankMatches, type ProfileLite, type Scored } from "@/lib/matching";
import { sendConnectionRequest } from "@/lib/connections";
import { Sparkles, Compass, MapPin, ArrowUpRight, Check, Clock, Loader2, LayoutGrid, Map as MapIcon, Crosshair } from "lucide-react";
import { LocationMap } from "@/components/LocationMap";
import { useMyLocation } from "@/hooks/useMyLocation";
import { distanceKm, formatDistance } from "@/lib/geo";


export const Route = createFileRoute("/_authenticated/mentors")({
  head: () => ({ meta: [{ title: "Mentors — Mentor4You" }] }),
  component: MentorsPage,
});

type Profile = ProfileLite & { onboarded: boolean };

function MentorsPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Profile | null>(null);
  const [others, setOthers] = useState<Profile[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [radius, setRadius] = useState<number | null>(null);
  const { coords, source, locating, locate } = useMyLocation();


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
    let pool = others.filter((o) => o.role === targetRole);
    if (coords && radius) {
      pool = pool.filter((o: any) =>
        o.latitude && o.longitude
          ? distanceKm(coords.latitude, coords.longitude, Number(o.latitude), Number(o.longitude)) <= radius
          : false,
      );
    }
    return rankMatches(me, pool, 24);
  }, [me, others, targetRole, coords, radius]);

  const distanceFor = (p: any) =>
    coords && p.latitude && p.longitude
      ? formatDistance(distanceKm(coords.latitude, coords.longitude, Number(p.latitude), Number(p.longitude)))
      : null;


  if (loading || !me) return (
    <div className="mx-auto max-w-6xl px-6 py-16 flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading matches…
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-4">
      <div className="flex items-end justify-between gap-3 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            {me.role === "mentor" ? "Mentees" : "Mentors"}
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            {me.role === "mentor" ? "Guide someone" : "Find your guide"}
          </h1>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full border border-border bg-card">
          <button onClick={() => setView("list")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <LayoutGrid className="h-3.5 w-3.5" /> List
          </button>
          <button onClick={() => setView("map")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <MapIcon className="h-3.5 w-3.5" /> Map
          </button>
        </div>
      </div>

      <NearbyBar
        coords={coords}
        source={source}
        locating={locating}
        locate={locate}
        radius={radius}
        setRadius={setRadius}
      />

      {view === "map" ? (
        <LocationMap
          height={520}
          you={coords}
          radiusKm={radius}
          markers={matches.filter((p: any) => p.latitude && p.longitude).map((p: any) => ({
            id: p.id, latitude: p.latitude, longitude: p.longitude,
            title: p.full_name || "Mentor", subtitle: distanceFor(p) || p.headline || p.role, href: `/u/${p.id}`,
          }))}
        />
      ) : (

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {matches.map((p) => (
          <MatchCard key={p.id} p={p} distance={distanceFor(p)} alreadySent={sent.has(p.id)} onConnect={async () => {
            await sendConnectionRequest(p.id);
            setSent((s) => new Set(s).add(p.id));
          }} />
        ))}

        {matches.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No {targetRole} matches yet — check back soon.
          </div>
        )}
      </div>
      )}
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
        <Link to="/u/$id" params={{ id: p.id }} className="flex items-center gap-3 min-w-0 group">
          <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display font-bold shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold leading-tight truncate group-hover:text-primary transition">{p.full_name || "Anonymous"}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              {p.role === "mentor" ? <Compass className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              <span className="capitalize">{p.role}</span>
              {p.location && <><span>·</span><MapPin className="h-3 w-3" />{p.location}</>}
            </div>
          </div>
        </Link>
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
