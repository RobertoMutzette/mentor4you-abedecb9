import { safeUrl } from "@/lib/safe-url";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, Github, Globe, Loader2, Pencil, Plus, Rocket, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — Mentor4You" }] }),
  component: ProjectsPage,
});

type Project = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  status: string;
  completion_percentage: number;
  funding_goal: number;
  funding_raised: number;
  tags: string[];
  skills_needed: string[];
  github_url: string;
  demo_url: string;
};

type Owner = { id: string; full_name: string };

const STATUSES = ["idea", "building", "launched", "paused"];
const statusStyle = (s: string) =>
  s === "launched" ? "bg-primary/10 text-primary"
  : s === "building" ? "bg-foreground/10 text-foreground"
  : s === "paused" ? "bg-destructive/10 text-destructive"
  : "bg-secondary text-secondary-foreground";

function ProjectsPage() {
  const [me, setMe] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [owners, setOwners] = useState<Record<string, Owner>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Project | "new" | null>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);
    const { data: p } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    const list = (p || []) as Project[];
    setProjects(list);
    const ids = Array.from(new Set(list.map((x) => x.owner_id)));
    if (ids.length) {
      const { data: ow } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, Owner> = {};
      (ow || []).forEach((o: any) => (map[o.id] = o));
      setOwners(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await supabase.from("projects").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="mx-auto max-w-6xl px-6 py-16 text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading projects…</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            <Rocket className="h-3 w-3" /> Showroom
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Projects</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">Ideas in motion. Browse what the community is building and find a project to join — or launch your own.</p>
        </div>
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-foreground text-background font-medium text-sm hover:opacity-90 transition self-start">
          <Plus className="h-4 w-4" /> New project
        </button>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => (
          <ProjectCard key={p.id} p={p} owner={owners[p.owner_id]} mine={p.owner_id === me}
            onEdit={() => setEditing(p)} onDelete={() => remove(p.id)} />
        ))}
        {projects.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No projects yet. Be the first to launch one.
          </div>
        )}
      </div>

      {editing && (
        <ProjectModal project={editing === "new" ? null : editing} ownerId={me!}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function ProjectCard({ p, owner, mine, onEdit, onDelete }: { p: Project; owner?: Owner; mine: boolean; onEdit: () => void; onDelete: () => void }) {
  const pct = Math.min(100, Math.max(0, p.completion_percentage));
  const fundPct = p.funding_goal > 0 ? Math.min(100, Math.round((Number(p.funding_raised) / Number(p.funding_goal)) * 100)) : 0;
  return (
    <article className="rounded-3xl border border-border bg-card p-6 flex flex-col hover:shadow-card transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${statusStyle(p.status)}`}>{p.status}</span>
            {owner && <span className="text-xs text-muted-foreground truncate">by {owner.full_name || "Anonymous"}</span>}
          </div>
          <h3 className="font-display text-xl font-bold leading-tight">{p.title}</h3>
        </div>
        {mine && (
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-full hover:bg-secondary transition" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>

      {p.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.description}</p>}

      <div className="mt-5 space-y-3">
        <Progress label="Completion" value={pct} suffix={`${pct}%`} />
        {p.funding_goal > 0 && (
          <Progress label="Funding" value={fundPct} suffix={`$${Number(p.funding_raised).toLocaleString()} / $${Number(p.funding_goal).toLocaleString()}`} />
        )}
      </div>

      {(p.tags.length > 0 || p.skills_needed.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-1">
          {p.tags.map((t) => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary">{t}</span>)}
          {p.skills_needed.map((t) => <span key={"sk" + t} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">need: {t}</span>)}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3 text-sm font-medium">
        <div className="flex gap-3">
          {safeUrl(p.github_url) && <a href={safeUrl(p.github_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary"><Github className="h-4 w-4" /> Code</a>}
          {safeUrl(p.demo_url) && <a href={safeUrl(p.demo_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary"><Globe className="h-4 w-4" /> Demo</a>}
        </div>
        <Link to="/project/$id" params={{ id: p.id }} className="inline-flex items-center gap-1 text-primary hover:underline">Workspace <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
    </article>
  );
}

function Progress({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{suffix}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ProjectModal({ project, ownerId, onClose, onSaved }: { project: Project | null; ownerId: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    title: project?.title ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "idea",
    completion_percentage: project?.completion_percentage ?? 0,
    funding_goal: project?.funding_goal ?? 0,
    funding_raised: project?.funding_raised ?? 0,
    tags: (project?.tags ?? []).join(", "),
    skills_needed: (project?.skills_needed ?? []).join(", "),
    github_url: project?.github_url ?? "",
    demo_url: project?.demo_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    const payload = {
      owner_id: ownerId,
      title: f.title.trim(),
      description: f.description.trim(),
      status: f.status,
      completion_percentage: Number(f.completion_percentage),
      funding_goal: Number(f.funding_goal),
      funding_raised: Number(f.funding_raised),
      tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean),
      skills_needed: f.skills_needed.split(",").map((s) => s.trim()).filter(Boolean),
      github_url: safeUrl(f.github_url) ?? "",
      demo_url: safeUrl(f.demo_url) ?? "",
    };
    const res = project
      ? await supabase.from("projects").update(payload).eq("id", project.id)
      : await supabase.from("projects").insert(payload);
    if (res.error) { setErr(res.error.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-card rounded-3xl border border-border p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl font-bold">{project ? "Edit project" : "New project"}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          <Field label="Title"><input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} /></Field>
          <Field label="Description"><textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={inputCls}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Completion %"><input type="number" min={0} max={100} value={f.completion_percentage} onChange={(e) => setF({ ...f, completion_percentage: Number(e.target.value) })} className={inputCls} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Funding goal ($)"><input type="number" min={0} value={f.funding_goal} onChange={(e) => setF({ ...f, funding_goal: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Raised ($)"><input type="number" min={0} value={f.funding_raised} onChange={(e) => setF({ ...f, funding_raised: Number(e.target.value) })} className={inputCls} /></Field>
          </div>
          <Field label="Tags (comma separated)"><input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="climate, ai, mobile" className={inputCls} /></Field>
          <Field label="Skills needed (comma separated)"><input value={f.skills_needed} onChange={(e) => setF({ ...f, skills_needed: e.target.value })} placeholder="react, design" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="GitHub URL"><input value={f.github_url} onChange={(e) => setF({ ...f, github_url: e.target.value })} className={inputCls} /></Field>
            <Field label="Demo URL"><input value={f.demo_url} onChange={(e) => setF({ ...f, demo_url: e.target.value })} className={inputCls} /></Field>
          </div>
        </div>

        {err && <div className="mt-4 text-sm text-destructive">{err}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm font-medium hover:bg-secondary transition">Cancel</button>
          <button disabled={saving} className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-60 transition inline-flex items-center gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {project ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>{children}</label>;
}
