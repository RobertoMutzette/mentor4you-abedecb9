import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Check, Sparkles, Users2, Compass, Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — Mentor4You" }] }),
  component: OnboardingPage,
});

type Role = "mentor" | "mentee";
type EduItem = { school: string; degree: string; year: string };
type ExpItem = { company: string; title: string; years: string };

const SKILL_OPTIONS = ["Product design", "UX research", "Frontend dev", "Backend dev", "Mobile dev", "AI/ML", "Data science", "Hardware", "Product management", "Marketing", "Sales", "Content", "Community", "Finance", "Fundraising", "Operations", "Strategy", "Research", "Legal", "Public speaking"];
const INTEREST_OPTIONS = ["Climate tech", "AI", "Biotech", "Fintech", "EdTech", "Health", "Robotics", "Music tech", "Gaming", "Policy", "Social impact", "Consumer", "DeepTech", "Space", "Web3", "Creator economy"];
const INDUSTRY_OPTIONS = ["Software", "Healthcare", "Finance", "Education", "Energy", "Manufacturing", "Media", "Retail", "Government", "Non-profit", "Real estate", "Agriculture", "Transport"];
const GOAL_OPTIONS = ["Find a co-founder", "Land an internship", "Ship my first project", "Apply to an accelerator", "Raise funding", "Win a hackathon", "Switch careers", "Grow my network", "Learn a new skill", "Mentor others", "Find research collab", "Apply to a fellowship"];
const PROJECT_PREFS = ["Solo experiments", "Small team (2–4)", "Larger team (5+)", "Open-source", "Commercial / startup", "Research", "Social impact", "Hackathon-style sprints", "Long-term build"];
const EXP_LEVELS = ["Student", "Early career (0–3 yrs)", "Mid-career (3–8 yrs)", "Senior (8+ yrs)"];
const AGE_RANGES = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"];
const COMM_STYLES = ["Async (text-first)", "Sync (calls)", "Mix of both"];
const MEETING_FREQ = ["Weekly", "Bi-weekly", "Monthly", "As needed"];
const LEARN_STYLES = ["Hands-on building", "Discussion & feedback", "Structured curriculum", "Pair programming"];
const RESPONSE_TIMES = ["Within hours", "Within a day", "Within a few days"];
const PERSONALITY = ["Direct", "Empathetic", "Analytical", "Creative", "Methodical", "Big-picture", "Detail-oriented", "Energetic", "Calm"];
const TIMEZONES = ["UTC-8 (PT)", "UTC-5 (ET)", "UTC+0 (GMT)", "UTC+1 (CET)", "UTC+2 (EET)", "UTC+5:30 (IST)", "UTC+8 (CST/SGT)", "UTC+10 (AEST)"];

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [role, setRole] = useState<Role | null>(null);
  const [lookingForPartners, setLookingForPartners] = useState(false);
  const [openToCollab, setOpenToCollab] = useState(false);
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [hours, setHours] = useState(5);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [projectPrefs, setProjectPrefs] = useState<string[]>([]);
  const [education, setEducation] = useState<EduItem[]>([]);
  const [workExperience, setWorkExperience] = useState<ExpItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) {
        if (data.onboarded) { navigate({ to: "/dashboard" }); return; }
        setFullName(data.full_name || u.user.user_metadata?.full_name || "");
        setHeadline((data as any).headline || "");
        setRole(data.role as Role | null);
        setLookingForPartners(data.looking_for_partners);
        setOpenToCollab(data.open_to_collab);
        setBio(data.bio || "");
        setLocation(data.location || "");
        setExperience(data.experience_level || "");
        setHours(data.hours_per_week || 5);
        setSkills(data.skills || []);
        setInterests(data.interests || []);
        setIndustries(((data as any).industries as string[]) || []);
        setGoals(data.goals || []);
        setProjectPrefs(((data as any).project_preferences as string[]) || []);
        setEducation(((data as any).education as EduItem[]) || []);
        setWorkExperience(((data as any).experience as ExpItem[]) || []);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const totalSteps = 6;
  const canNext = () => {
    if (step === 0) return !!role;
    if (step === 1) return fullName.trim().length > 1 && !!experience;
    if (step === 2) return skills.length >= 1;
    if (step === 3) return interests.length >= 1 && industries.length >= 1;
    if (step === 4) return goals.length >= 1 && projectPrefs.length >= 1;
    if (step === 5) return true; // background optional
    return false;
  };

  const finish = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const payload: any = {
      id: u.user.id,
      full_name: fullName,
      headline,
      role,
      looking_for_partners: role === "mentee" ? lookingForPartners : false,
      open_to_collab: role === "mentor" ? openToCollab : false,
      bio,
      location,
      experience_level: experience,
      hours_per_week: hours,
      skills,
      interests,
      industries,
      goals,
      project_preferences: projectPrefs,
      education: education.filter((e) => e.school || e.degree),
      experience: workExperience.filter((e) => e.company || e.title),
      onboarded: true,
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (!error) navigate({ to: "/dashboard" });
  };

  if (loading) return <div className="mx-auto max-w-2xl px-6 py-20 text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:py-16">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
        </div>
      </div>

      {step === 0 && (
        <Stage title="Why are you here?" subtitle="Pick the role that fits you best — you can always update it later.">
          <div className="grid sm:grid-cols-2 gap-4">
            <RoleCard active={role === "mentee"} onClick={() => setRole("mentee")} icon={<Sparkles className="h-5 w-5" />} title="I'm a mentee" desc="I'm looking for guidance, a mentor, and maybe partners to build with." />
            <RoleCard active={role === "mentor"} onClick={() => setRole("mentor")} icon={<Compass className="h-5 w-5" />} title="I want to mentor" desc="I want to share what I've learned and help young builders grow." />
          </div>
          {role === "mentee" && (
            <ToggleRow checked={lookingForPartners} onChange={setLookingForPartners} icon={<Users2 className="h-4 w-4" />}
              title="I'm also looking for partners" desc="We'll surface other builders open to teaming up on projects." />
          )}
          {role === "mentor" && (
            <ToggleRow checked={openToCollab} onChange={setOpenToCollab} icon={<Users2 className="h-4 w-4" />}
              title="I'm open to collaborate on projects" desc="Mentees looking for partners will see you in matches too." />
          )}
        </Stage>
      )}

      {step === 1 && (
        <Stage title="About you" subtitle="The basics — keep it short.">
          <Input label="Full name" value={fullName} onChange={setFullName} required />
          <Input label="Headline" value={headline} onChange={setHeadline} placeholder="e.g. CS student building climate tech" />
          <Input label="Where are you based?" value={location} onChange={setLocation} placeholder="City, Country or Remote" />
          <SelectChips label="Experience level" options={EXP_LEVELS} value={experience ? [experience] : []} onChange={(v) => setExperience(v[v.length - 1] || "")} single />
          <div>
            <label className="text-sm font-medium">Hours per week you can commit</label>
            <input type="range" min={1} max={40} value={hours} onChange={(e) => setHours(+e.target.value)} className="w-full mt-3 accent-primary" />
            <div className="text-sm text-muted-foreground">{hours} hours / week</div>
          </div>
          <Textarea label="Short bio" value={bio} onChange={setBio} placeholder="One or two sentences about you." />
        </Stage>
      )}

      {step === 2 && (
        <Stage title={role === "mentor" ? "What can you teach?" : "What are your skills?"} subtitle="Pick at least one. Choose all that apply.">
          <SelectChips options={SKILL_OPTIONS} value={skills} onChange={setSkills} />
        </Stage>
      )}

      {step === 3 && (
        <Stage title="Fields & industries" subtitle="What domains excite you? We match heavily on overlap.">
          <SelectChips label="Fields of interest" options={INTEREST_OPTIONS} value={interests} onChange={setInterests} />
          <SelectChips label="Industries" options={INDUSTRY_OPTIONS} value={industries} onChange={setIndustries} />
        </Stage>
      )}

      {step === 4 && (
        <Stage title="Goals & project style" subtitle="Tell us what you're trying to do and how you like to work.">
          <SelectChips label={role === "mentor" ? "What do you want to help with?" : "Your goals"} options={GOAL_OPTIONS} value={goals} onChange={setGoals} />
          <SelectChips label="Project preferences" options={PROJECT_PREFS} value={projectPrefs} onChange={setProjectPrefs} />
        </Stage>
      )}

      {step === 5 && (
        <Stage title="Background" subtitle="Optional — but it strengthens your matches and builds trust.">
          <RepeaterEdu items={education} onChange={setEducation} />
          <RepeaterExp items={workExperience} onChange={setWorkExperience} />
        </Stage>
      )}

      <div className="mt-10 flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full hover:bg-secondary disabled:opacity-30 transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step < totalSteps - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={finish} disabled={!canNext() || saving}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:shadow-glow disabled:opacity-40 transition">
            {saving ? "Saving…" : "Finish & see my matches"} <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function Stage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function RoleCard({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left rounded-2xl border-2 p-6 transition ${active ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:border-primary/40"}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>{icon}</div>
      <div className="mt-4 font-display text-lg font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    </button>
  );
}

function ToggleRow({ checked, onChange, icon, title, desc }: { checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`w-full text-left flex items-start gap-4 rounded-2xl border p-4 transition ${checked ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/50"}`}>
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${checked ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{icon}</div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${checked ? "border-primary bg-primary" : "border-border"}`}>
        {checked && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
    </button>
  );
}

function Input({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input value={value} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full px-4 py-3 rounded-2xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} rows={3}
        className="mt-1.5 w-full px-4 py-3 rounded-2xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none" />
    </label>
  );
}

function SelectChips({ label, options, value, onChange, single }: { label?: string; options: string[]; value: string[]; onChange: (v: string[]) => void; single?: boolean }) {
  const toggle = (opt: string) => {
    if (single) { onChange([opt]); return; }
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };
  return (
    <div>
      {label && <div className="text-sm font-medium mb-3">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RepeaterEdu({ items, onChange }: { items: EduItem[]; onChange: (v: EduItem[]) => void }) {
  return (
    <div>
      <div className="text-sm font-medium mb-3">Education</div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start rounded-2xl border border-border bg-card p-3">
            <input value={it.school} onChange={(e) => { const c = [...items]; c[i] = { ...it, school: e.target.value }; onChange(c); }} placeholder="School / University" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <input value={it.degree} onChange={(e) => { const c = [...items]; c[i] = { ...it, degree: e.target.value }; onChange(c); }} placeholder="Degree / Field" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <div className="flex gap-2">
              <input value={it.year} onChange={(e) => { const c = [...items]; c[i] = { ...it, year: e.target.value }; onChange(c); }} placeholder="Year" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...items, { school: "", degree: "", year: "" }])}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-dashed border-border hover:bg-secondary transition">
        <Plus className="h-4 w-4" /> Add education
      </button>
    </div>
  );
}

function RepeaterExp({ items, onChange }: { items: ExpItem[]; onChange: (v: ExpItem[]) => void }) {
  return (
    <div>
      <div className="text-sm font-medium mb-3">Professional experience</div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start rounded-2xl border border-border bg-card p-3">
            <input value={it.company} onChange={(e) => { const c = [...items]; c[i] = { ...it, company: e.target.value }; onChange(c); }} placeholder="Company" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <input value={it.title} onChange={(e) => { const c = [...items]; c[i] = { ...it, title: e.target.value }; onChange(c); }} placeholder="Role / Title" className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <div className="flex gap-2">
              <input value={it.years} onChange={(e) => { const c = [...items]; c[i] = { ...it, years: e.target.value }; onChange(c); }} placeholder="Years" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...items, { company: "", title: "", years: "" }])}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-dashed border-border hover:bg-secondary transition">
        <Plus className="h-4 w-4" /> Add experience
      </button>
    </div>
  );
}
