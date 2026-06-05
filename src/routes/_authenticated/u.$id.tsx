import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendConnectionRequest } from "@/lib/connections";
import { useSignedImage } from "@/lib/storage";
import { ArrowUpRight, Award, Briefcase, Check, Clock, Globe, GraduationCap, Instagram, Languages, Linkedin, Loader2, MapPin, Sparkles, Compass, Facebook } from "lucide-react";

export const Route = createFileRoute("/_authenticated/u/$id")({
  head: () => ({ meta: [{ title: "Profile — Mentor4You" }] }),
  component: ProfileView,
});

type EduItem = { school: string; degree: string; year: string };
type ExpItem = { company: string; title: string; years: string };

function ProfileView() {
  const { id } = useParams({ from: "/_authenticated/u/$id" });
  const [profile, setProfile] = useState<any>(null);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u.user?.id ?? null);
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      setProfile(data);
      if (u.user) {
        const { data: req } = await supabase
          .from("connection_requests")
          .select("id")
          .eq("from_user", u.user.id)
          .eq("to_user", id)
          .maybeSingle();
        setSent(!!req);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-6 py-16 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading profile…</div>;
  }
  if (!profile) {
    return <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-2xl font-bold">Profile not found</h1>
      <p className="text-muted-foreground mt-2">This user doesn't exist or isn't public yet.</p>
      <Link to="/dashboard" className="mt-4 inline-block text-primary font-medium">← Back to dashboard</Link>
    </div>;
  }

  const isMe = me === profile.id;
  const initials = (profile.full_name || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  const edu: EduItem[] = profile.education || [];
  const exp: ExpItem[] = profile.experience || [];

  const handleConnect = async () => {
    setSending(true);
    try { await sendConnectionRequest(profile.id); setSent(true); }
    finally { setSending(false); }
  };

  return <ProfileBody profile={profile} isMe={isMe} initials={initials} edu={edu} exp={exp} sent={sent} sending={sending} onConnect={handleConnect} />;
}

function ProfileBody({ profile, isMe, initials, edu, exp, sent, sending, onConnect }: any) {
  const avatar = useSignedImage("avatars", profile.avatar_url);
  const cover = useSignedImage("covers", profile.cover_url);
  const socials = [
    profile.website && { Icon: Globe, url: profile.website, label: "Website" },
    profile.social_linkedin && { Icon: Linkedin, url: profile.social_linkedin, label: "LinkedIn" },
    profile.social_x && { Icon: () => <span className="font-bold text-sm">𝕏</span>, url: profile.social_x.startsWith("http") ? profile.social_x : `https://x.com/${profile.social_x.replace(/^@/, "")}`, label: "X" },
    profile.social_instagram && { Icon: Instagram, url: profile.social_instagram.startsWith("http") ? profile.social_instagram : `https://instagram.com/${profile.social_instagram.replace(/^@/, "")}`, label: "Instagram" },
    profile.social_facebook && { Icon: Facebook, url: profile.social_facebook, label: "Facebook" },
  ].filter(Boolean) as { Icon: any; url: string; label: string }[];
  const certs = profile.certifications || [];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="relative h-32 sm:h-48 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary">
          {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        </div>
        <div className="px-5 sm:px-7 pb-6 -mt-12 sm:-mt-14">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-primary to-primary/40 text-primary-foreground flex items-center justify-center font-display font-bold text-3xl border-4 border-card overflow-hidden">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 text-xs text-primary font-medium capitalize">
              {profile.role === "mentor" ? <Compass className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />} {profile.role}
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight">{profile.full_name || "Anonymous"}</h1>
            {profile.headline && <p className="mt-1 text-base text-muted-foreground">{profile.headline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>}
              {profile.timezone && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {profile.timezone}</span>}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {!isMe && (
              <button onClick={onConnect} disabled={sent || sending}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2.5 rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-60 transition">
                {sent ? <><Clock className="h-4 w-4" /> Request sent</> : sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Connect <ArrowUpRight className="h-4 w-4" /></>}
              </button>
            )}
            {isMe && (
              <Link to="/settings" className="inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2.5 rounded-full border border-border bg-card hover:bg-secondary transition">
                Edit profile <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
            {socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" title={s.label} className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-border hover:bg-secondary transition">
                <s.Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {profile.bio && (
        <Section title="About">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
        </Section>
      )}

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <TagSection title="Skills" items={profile.skills} />
        <TagSection title="Interests" items={profile.interests} />
        <TagSection title="Industries" items={profile.industries} />
        <TagSection title="Goals" items={profile.goals} />
        <TagSection title="Mentorship topics" items={profile.mentorship_topics} />
        <TagSection title="Project style" items={profile.project_preferences} />
        <TagSection title="Languages" items={profile.languages} />
        <InfoSection title="Availability" value={profile.hours_per_week ? `${profile.hours_per_week} hrs / week` : null} sub={profile.experience_level} />
      </div>

      {(profile.certifications || []).length > 0 && (
        <Section title="Certifications" icon={<Award className="h-4 w-4" />}>
          <ul className="space-y-3">
            {profile.certifications.map((c: any, i: number) => (
              <li key={i} className="flex justify-between gap-3 text-sm border-b border-border last:border-0 pb-3 last:pb-0">
                <div>
                  <div className="font-medium">{c.name || "—"}</div>
                  <div className="text-muted-foreground">{c.issuer}</div>
                </div>
                {c.year && <div className="text-muted-foreground shrink-0">{c.year}</div>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {edu.length > 0 && (
        <Section title="Education" icon={<GraduationCap className="h-4 w-4" />}>
          <ul className="space-y-3">
            {edu.map((e: EduItem, i: number) => (
              <li key={i} className="flex justify-between gap-3 text-sm border-b border-border last:border-0 pb-3 last:pb-0">
                <div>
                  <div className="font-medium">{e.school || "—"}</div>
                  <div className="text-muted-foreground">{e.degree}</div>
                </div>
                {e.year && <div className="text-muted-foreground shrink-0">{e.year}</div>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {exp.length > 0 && (
        <Section title="Experience" icon={<Briefcase className="h-4 w-4" />}>
          <ul className="space-y-3">
            {exp.map((e: ExpItem, i: number) => (
              <li key={i} className="flex justify-between gap-3 text-sm border-b border-border last:border-0 pb-3 last:pb-0">
                <div>
                  <div className="font-medium">{e.title || "—"}</div>
                  <div className="text-muted-foreground">{e.company}</div>
                </div>
                {e.years && <div className="text-muted-foreground shrink-0">{e.years}</div>}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-3">{icon} {title}</h2>
      {children}
    </section>
  );
}

function TagSection({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) => <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-secondary font-medium">{s}</span>)}
      </div>
    </div>
  );
}

function InfoSection({ title, value, sub }: { title: string; value: string | null; sub?: string }) {
  if (!value && !sub) return null;
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      {value && <div className="font-display font-semibold">{value}</div>}
      {sub && <div className="text-sm text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
