import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadProfileImage, useSignedImage } from "@/lib/storage";
import { ArrowLeft, Camera, Check, Loader2, Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Edit profile — Mentor4You" }] }),
  component: SettingsPage,
});

type EduItem = { school: string; degree: string; year: string };
type ExpItem = { company: string; title: string; years: string };
type CertItem = { name: string; issuer: string; year: string };

const LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Mandarin", "Hindi", "Arabic", "Japanese", "Korean", "Russian", "Dutch", "Polish", "Turkish", "Swedish"];
const CONTACT_PREFS = [
  { v: "in-app", label: "In-app messaging only" },
  { v: "email", label: "Email" },
  { v: "video", label: "Video calls" },
  { v: "any", label: "Open to any channel" },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const [p, setP] = useState<any>({
    full_name: "", headline: "", bio: "", location: "", timezone: "",
    avatar_url: "", cover_url: "",
    languages: [] as string[],
    education: [] as EduItem[],
    experience: [] as ExpItem[],
    certifications: [] as CertItem[],
    mentorship_topics: [] as string[],
    social_instagram: "", social_facebook: "", social_linkedin: "", social_x: "", website: "",
    contact_pref: "in-app",
    availability_schedule: {} as Record<string, boolean>,
    profile_visibility: "public",
    show_email: false,
    allow_messages_from: "connections",
  });

  const avatar = useSignedImage("avatars", p.avatar_url);
  const cover = useSignedImage("covers", p.cover_url);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) setP({ ...p, ...data, languages: data.languages || [], certifications: data.certifications || [], education: data.education || [], experience: data.experience || [], mentorship_topics: data.mentorship_topics || [], availability_schedule: data.availability_schedule || {} });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k: string, v: any) => setP((prev: any) => ({ ...prev, [k]: v }));
  const toggleArr = (k: string, v: string) => setP((prev: any) => ({ ...prev, [k]: prev[k].includes(v) ? prev[k].filter((x: string) => x !== v) : [...prev[k], v] }));
  const toggleDay = (d: string) => setP((prev: any) => ({ ...prev, availability_schedule: { ...prev.availability_schedule, [d]: !prev.availability_schedule[d] } }));

  const handleUpload = async (kind: "avatars" | "covers", file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return; }
    const path = await uploadProfileImage(kind, file);
    set(kind === "avatars" ? "avatar_url" : "cover_url", path);
  };

  const save = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase.from("profiles").update({
      full_name: p.full_name, headline: p.headline, bio: p.bio, location: p.location, timezone: p.timezone,
      avatar_url: p.avatar_url, cover_url: p.cover_url,
      languages: p.languages, education: p.education, experience: p.experience,
      certifications: p.certifications, mentorship_topics: p.mentorship_topics,
      social_instagram: p.social_instagram, social_facebook: p.social_facebook,
      social_linkedin: p.social_linkedin, social_x: p.social_x, website: p.website,
      contact_pref: p.contact_pref, availability_schedule: p.availability_schedule,
    }).eq("id", u.user.id);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else alert(error.message);
  };

  if (loading) return <div className="mx-auto max-w-3xl px-6 py-20 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 pb-32">
      <div className="flex items-center justify-between mb-6 gap-3">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Edit profile</h1>
        <div className="w-16" />
      </div>

      {/* Cover + avatar */}
      <section className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="relative h-40 sm:h-56 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary">
          {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <button onClick={() => coverInput.current?.click()} className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-background/90 backdrop-blur hover:bg-background transition shadow"><Camera className="h-3.5 w-3.5" /> Cover</button>
          <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload("covers", e.target.files[0])} />
        </div>
        <div className="px-5 sm:px-7 pb-6 -mt-12 sm:-mt-14">
          <div className="relative inline-block">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-primary to-primary/40 text-primary-foreground flex items-center justify-center font-display font-bold text-3xl border-4 border-card overflow-hidden">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (p.full_name || "?").charAt(0).toUpperCase()}
            </div>
            <button onClick={() => avatarInput.current?.click()} className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center shadow hover:scale-105 transition"><Camera className="h-4 w-4" /></button>
            <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload("avatars", e.target.files[0])} />
          </div>
        </div>
      </section>

      <Card title="Basics">
        <Field label="Full name"><Input value={p.full_name} onChange={(v) => set("full_name", v)} /></Field>
        <Field label="Headline"><Input value={p.headline} onChange={(v) => set("headline", v)} placeholder="e.g. CS student building climate tools" /></Field>
        <Field label="Bio"><Textarea value={p.bio} onChange={(v) => set("bio", v)} rows={4} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Location"><Input value={p.location} onChange={(v) => set("location", v)} placeholder="City, Country" /></Field>
          <Field label="Timezone"><Input value={p.timezone} onChange={(v) => set("timezone", v)} placeholder="e.g. UTC+1, PST" /></Field>
        </div>
      </Card>

      <Card title="Languages">
        <ChipPicker options={LANGUAGES} selected={p.languages} onToggle={(v) => toggleArr("languages", v)} />
      </Card>

      <Card title="Education">
        <Repeater items={p.education} setItems={(v) => set("education", v)} blank={{ school: "", degree: "", year: "" }} fields={[{ k: "school", label: "School" }, { k: "degree", label: "Degree" }, { k: "year", label: "Year" }]} />
      </Card>

      <Card title="Experience">
        <Repeater items={p.experience} setItems={(v) => set("experience", v)} blank={{ company: "", title: "", years: "" }} fields={[{ k: "company", label: "Company" }, { k: "title", label: "Title" }, { k: "years", label: "Years" }]} />
      </Card>

      <Card title="Certifications">
        <Repeater items={p.certifications} setItems={(v) => set("certifications", v)} blank={{ name: "", issuer: "", year: "" }} fields={[{ k: "name", label: "Certification" }, { k: "issuer", label: "Issuer" }, { k: "year", label: "Year" }]} />
      </Card>

      <Card title="Mentorship topics" subtitle="Topics you can mentor on or want guidance with">
        <TagInput tags={p.mentorship_topics} setTags={(v) => set("mentorship_topics", v)} placeholder="Add a topic and press Enter" />
      </Card>

      <Card title="Social & web">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Personal website"><Input value={p.website} onChange={(v) => set("website", v)} placeholder="https://" /></Field>
          <Field label="LinkedIn"><Input value={p.social_linkedin} onChange={(v) => set("social_linkedin", v)} placeholder="https://linkedin.com/in/…" /></Field>
          <Field label="X / Twitter"><Input value={p.social_x} onChange={(v) => set("social_x", v)} placeholder="@handle or URL" /></Field>
          <Field label="Instagram"><Input value={p.social_instagram} onChange={(v) => set("social_instagram", v)} placeholder="@handle or URL" /></Field>
          <Field label="Facebook"><Input value={p.social_facebook} onChange={(v) => set("social_facebook", v)} placeholder="URL" /></Field>
        </div>
      </Card>

      <Card title="Contact & availability">
        <Field label="Preferred contact">
          <select value={p.contact_pref} onChange={(e) => set("contact_pref", e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm">
            {CONTACT_PREFS.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Available days">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const on = !!p.availability_schedule[d];
              return <button key={d} onClick={() => toggleDay(d)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${on ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary"}`}>{d}</button>;
            })}
          </div>
        </Field>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-3 flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-primary inline-flex items-center gap-1"><Check className="h-4 w-4" /> Saved</span>}
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-60 transition">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-7 space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>{children}</label>;
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />;
}

function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y" />;
}

function ChipPicker({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return <button key={o} type="button" onClick={() => onToggle(o)} className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${on ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary"}`}>{o}</button>;
      })}
    </div>
  );
}

function TagInput({ tags, setTags, placeholder }: { tags: string[]; setTags: (v: string[]) => void; placeholder?: string }) {
  const [v, setV] = useState("");
  const add = () => { const t = v.trim(); if (!t || tags.includes(t)) return; setTags([...tags, t]); setV(""); };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-secondary font-medium">{t}<button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button></span>)}
      </div>
      <div className="flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder} className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm" />
        <button type="button" onClick={add} className="inline-flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-xl border border-border hover:bg-secondary"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function Repeater<T extends Record<string, string>>({ items, setItems, blank, fields }: { items: T[]; setItems: (v: T[]) => void; blank: T; fields: { k: keyof T & string; label: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="grid sm:grid-cols-[1fr_1fr_100px_auto] gap-2 items-end">
          {fields.map((f) => <input key={f.k} value={(it as any)[f.k] || ""} placeholder={f.label} onChange={(e) => { const copy = [...items]; (copy[i] as any)[f.k] = e.target.value; setItems(copy); }} className="bg-background border border-border rounded-xl px-3 py-2 text-sm" />)}
          <button onClick={() => setItems(items.filter((_, x) => x !== i))} className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-border hover:bg-secondary text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, { ...blank }])} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border border-dashed border-border hover:bg-secondary"><Plus className="h-4 w-4" /> Add</button>
    </div>
  );
}
