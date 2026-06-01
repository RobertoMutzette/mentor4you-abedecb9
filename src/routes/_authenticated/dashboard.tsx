import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Users2, Compass, MapPin, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Mentor4You" }] }),
  component: DashboardPage,
});

type Profile = {
  id: string;
  full_name: string;
  role: "mentor" | "mentee" | null;
  looking_for_partners: boolean;
  open_to_collab: boolean;
  bio: string;
  location: string;
  experience_level: string;
  hours_per_week: number;
  skills: string[];
  interests: string[];
  goals: string[];
  onboarded: boolean;
};

type Scored = Profile & { score: number; overlap: { skills: string[]; interests: string[]; goals: string[] } };

function DashboardPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Profile | null>(null);
  const [others, setOthers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"mentors" | "partners">("mentors");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: mine } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (!mine || !mine.onboarded) { navigate({ to: "/onboarding" }); return; }
      setMe(mine as Profile);
      const { data: rest } = await supabase.from("profiles").select("*").neq("id", u.user.id).eq("onboarded", true);
      setOthers((rest || []) as Profile[]);
      setLoading(false);
    })();
  }, [navigate]);

  if (loading || !me) return <div className="mx-auto max-w-6xl px-6 py-16 text-muted-foreground">Loading your matches…</div>;

  const score = (other: Profile): Scored => {
    const inter = (a: string[], b: string[]) => a.filter((x) => b.includes(x));
    const ov = {
      skills: inter(me.skills, other.skills),
      interests: inter(me.interests, other.interests),
      goals: inter(me.goals, other.goals),
    };
    const s = ov.skills.length * 2 + ov.interests.length * 3 + ov.goals.length * 2;
    return { ...other, score: s, overlap: ov };
  };

  const mentors = others.filter((o) => o.role === "mentor").map(score).sort((a, b) => b.score - a.score).slice(0, 9);

  // Partners: anyone open to collab (mentees looking for partners OR mentors open to collab), excluding the user
  const partners = others
    .filter((o) => (o.role === "mentee" && o.looking_for_partners) || (o.role === "mentor" && o.open_to_collab))
    .map(score).sort((a, b) => b.score - a.score).slice(0, 9);

  const showPartners = me.role === "mentee" ? me.looking_for_partners : me.open_to_collab;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/40 border border-border p-7">
          <div className="text-sm font-medium text-primary">{me.role === "mentor" ? "Mentor" : "Mentee"}</div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight">Welcome back, {me.full_name.split(" ")[0] || "builder"}.</h1>
          <p className="mt-3 text-muted-foreground max-w-lg">
            {me.role === "mentor"
              ? "Here are mentees whose goals and interests overlap with what you can teach."
              : "Here are your top mentor matches, ranked by how well your interests and goals align."}
          </p>
          <Link to="/onboarding" className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium px-4 py-2 rounded-full border border-border bg-card hover:bg-secondary transition">
            Edit my profile <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="rounded-3xl bg-card border border-border p-7">
          <div className="text-sm font-medium text-muted-foreground">Your profile</div>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Skills" items={me.skills} />
            <Row label="Interests" items={me.interests} />
            <Row label="Goals" items={me.goals} />
          </div>
        </div>
      </div>

      {me.role === "mentee" && (
        <div className="flex gap-2 mb-6">
          <TabBtn active={tab === "mentors"} onClick={() => setTab("mentors")}>Mentors for you</TabBtn>
          {showPartners && <TabBtn active={tab === "partners"} onClick={() => setTab("partners")}>Partners to build with</TabBtn>}
        </div>
      )}
      {me.role === "mentor" && (
        <div className="flex gap-2 mb-6">
          <TabBtn active={tab === "mentors"} onClick={() => setTab("mentors")}>Mentees who match you</TabBtn>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(me.role === "mentor" ? others.filter((o) => o.role === "mentee").map(score).sort((a, b) => b.score - a.score).slice(0, 9) : tab === "mentors" ? mentors : partners).map((p) => (
          <MatchCard key={p.id} p={p} />
        ))}
        {((me.role === "mentor" && others.filter((o) => o.role === "mentee").length === 0) || (me.role === "mentee" && tab === "mentors" && mentors.length === 0) || (me.role === "mentee" && tab === "partners" && partners.length === 0)) && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No matches yet — invite some friends to join Mentor4You and we'll surface them here.
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
        {items.map((s) => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary">{s}</span>)}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition ${active ? "bg-foreground text-background" : "bg-card border border-border hover:bg-secondary"}`}>
      {children}
    </button>
  );
}

function MatchCard({ p }: { p: Scored }) {
  const initials = p.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <article className="rounded-3xl border border-border bg-card p-6 flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display font-bold">{initials}</div>
          <div>
            <div className="font-display text-lg font-semibold leading-tight">{p.full_name || "Anonymous"}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              {p.role === "mentor" ? <Compass className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              {p.role === "mentor" ? "Mentor" : "Mentee"}
              {p.location && <><span>·</span><MapPin className="h-3 w-3" />{p.location}</>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Match</div>
          <div className="font-display font-bold text-primary">{Math.min(99, 40 + p.score * 5)}%</div>
        </div>
      </div>
      {p.bio && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{p.bio}</p>}
      <div className="mt-4 space-y-2">
        {p.overlap.interests.length > 0 && <OverlapRow label="Shared interests" items={p.overlap.interests} />}
        {p.overlap.skills.length > 0 && <OverlapRow label="Shared skills" items={p.overlap.skills} />}
        {p.overlap.goals.length > 0 && <OverlapRow label="Shared goals" items={p.overlap.goals} />}
      </div>
      <button className="mt-5 inline-flex items-center justify-between text-sm font-medium pt-4 border-t border-border hover:text-primary transition">
        <span className="inline-flex items-center gap-1.5"><Users2 className="h-4 w-4" /> Connect</span>
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </article>
  );
}

function OverlapRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground font-medium">{items.slice(0, 4).join(" · ")}</span>
    </div>
  );
}
