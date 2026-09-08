import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { inviteToProject, leaveProject, postComment, postUpdate } from "@/lib/projects";
import { ArrowLeft, Github, Globe, Globe2, Lock, Loader2, MessageSquare, Megaphone, UserPlus, Users2, X, LogOut } from "lucide-react";
import { safeUrl } from "@/lib/safe-url";
import { SHARE_FIELD_LABELS, normalizeShareFields, publishProject, unpublishProject, updateShareFields, type ShareFields } from "@/lib/project-visibility";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/project/$id")({
  head: () => ({ meta: [{ title: "Project — Mentor4You" }] }),
  component: ProjectWorkspace,
});

function ProjectWorkspace() {
  const { id } = useParams({ from: "/_authenticated/project/$id" });
  const [me, setMe] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [comments, setComments] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"updates" | "discussion" | "team">("updates");
  const [showInvite, setShowInvite] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    setMe(u.user?.id ?? null);
    const [{ data: p }, { data: m }, { data: c }, { data: up }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).maybeSingle(),
      supabase.from("project_members").select("*").eq("project_id", id),
      supabase.from("project_comments").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("project_updates").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    ]);
    setProject(p); setMembers(m || []); setComments(c || []); setUpdates(up || []);
    const ids = Array.from(new Set([
      p?.owner_id, ...(m || []).map((x: any) => x.user_id), ...(c || []).map((x: any) => x.user_id), ...(up || []).map((x: any) => x.user_id),
    ].filter(Boolean) as string[]));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, headline, avatar_url").in("id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((pr: any) => (map[pr.id] = pr));
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const channel = supabase.channel(`project-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_comments", filter: `project_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "project_updates", filter: `project_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <div className="mx-auto max-w-4xl px-6 py-16 text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  if (!project) return <div className="mx-auto max-w-4xl px-6 py-16">
    <h1 className="font-display text-2xl font-bold">Project not found</h1>
    <Link to="/projects" className="mt-4 inline-block text-primary font-medium">← Back to projects</Link>
  </div>;

  const isOwner = me === project.owner_id;
  const isMember = isOwner || members.some((m) => m.user_id === me);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> All projects</Link>

      <header className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary">{project.status}</span>
              <span className="text-xs text-muted-foreground">by {profiles[project.owner_id]?.full_name || "Anonymous"}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{project.title}</h1>
            {project.description && <p className="mt-3 text-muted-foreground max-w-2xl">{project.description}</p>}
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <button onClick={() => setShowVisibility(true)} className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border transition ${project.visibility === "public" ? "border-primary text-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
                {project.visibility === "public" ? <><Globe2 className="h-4 w-4" /> Public</> : <><Lock className="h-4 w-4" /> Private</>}
              </button>
            )}
            {isOwner && (
              <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition">
                <UserPlus className="h-4 w-4" /> Invite
              </button>
            )}
            {isMember && !isOwner && (
              <button onClick={async () => { await leaveProject(id); load(); }} className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border border-border hover:bg-secondary transition">
                <LogOut className="h-4 w-4" /> Leave
              </button>
            )}
          </div>
        </div>
        {(safeUrl(project.github_url) || safeUrl(project.demo_url)) && (
          <div className="mt-5 flex gap-4 text-sm font-medium">
            {safeUrl(project.github_url) && <a href={safeUrl(project.github_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary"><Github className="h-4 w-4" /> Code</a>}
            {safeUrl(project.demo_url) && <a href={safeUrl(project.demo_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary"><Globe className="h-4 w-4" /> Demo</a>}
          </div>
        )}
      </header>

      <nav className="mt-6 flex gap-1 border-b border-border overflow-x-auto">
        <TabBtn active={tab === "posts"} onClick={() => setTab("posts")} icon={<Rss className="h-4 w-4" />}>Posts</TabBtn>
        <TabBtn active={tab === "updates"} onClick={() => setTab("updates")} icon={<Megaphone className="h-4 w-4" />}>Updates</TabBtn>
        <TabBtn active={tab === "discussion"} onClick={() => setTab("discussion")} icon={<MessageSquare className="h-4 w-4" />}>Discussion</TabBtn>
        <TabBtn active={tab === "team"} onClick={() => setTab("team")} icon={<Users2 className="h-4 w-4" />}>Team</TabBtn>
      </nav>

      <div className="mt-6">
        {tab === "posts" && <PostsTab projectId={id} isMember={isMember} isPublic={project.visibility === "public"} />}
        {tab === "updates" && <UpdatesTab projectId={id} updates={updates} profiles={profiles} isMember={isMember} onPosted={load} />}
        {tab === "discussion" && <DiscussionTab projectId={id} comments={comments} profiles={profiles} onPosted={load} />}
        {tab === "team" && <TeamTab ownerId={project.owner_id} members={members} profiles={profiles} />}
      </div>

      {showInvite && <InviteModal projectId={id} onClose={() => setShowInvite(false)} />}
      {showVisibility && <VisibilityModal project={project} onClose={() => setShowVisibility(false)} onSaved={load} />}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: any) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
      {icon} {children}
    </button>
  );
}

function UpdatesTab({ projectId, updates, profiles, isMember, onPosted }: any) {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      {isMember && (
        <form onSubmit={async (e) => { e.preventDefault(); if (!title.trim()) return; setBusy(true); await postUpdate(projectId, title, body); setTitle(""); setBody(""); setBusy(false); onPosted(); }}
          className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Update title" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-medium" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="What's new?" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none" />
          <div className="flex justify-end"><button disabled={busy || !title.trim()} className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium disabled:opacity-50">Post update</button></div>
        </form>
      )}
      {updates.length === 0 ? <Empty>No updates yet.</Empty> : updates.map((u: any) => (
        <article key={u.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs text-muted-foreground mb-1">{profiles[u.user_id]?.full_name || "Member"} · {new Date(u.created_at).toLocaleString()}</div>
          <h3 className="font-display text-lg font-bold">{u.title}</h3>
          {u.body && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{u.body}</p>}
        </article>
      ))}
    </div>
  );
}

function DiscussionTab({ projectId, comments, profiles, onPosted }: any) {
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <form onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; setBusy(true); await postComment(projectId, text); setText(""); setBusy(false); onPosted(); }}
        className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Add a comment…" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none" />
        <div className="flex justify-end"><button disabled={busy || !text.trim()} className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium disabled:opacity-50">Post</button></div>
      </form>
      {comments.length === 0 ? <Empty>Be the first to comment.</Empty> : comments.map((c: any) => (
        <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">
            <Link to="/u/$id" params={{ id: c.user_id }} className="font-medium text-foreground hover:text-primary">{profiles[c.user_id]?.full_name || "Member"}</Link>
            {" · "}{new Date(c.created_at).toLocaleString()}
          </div>
          <p className="text-sm whitespace-pre-line">{c.body}</p>
        </div>
      ))}
    </div>
  );
}

function TeamTab({ ownerId, members, profiles }: any) {
  const all = [{ user_id: ownerId, role: "owner" }, ...members.filter((m: any) => m.user_id !== ownerId)];
  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {all.map((m: any) => {
        const p = profiles[m.user_id];
        return (
          <li key={m.user_id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
              {(p?.full_name || "?").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <Link to="/u/$id" params={{ id: m.user_id }} className="font-medium hover:text-primary truncate block">{p?.full_name || "Member"}</Link>
              <div className="text-xs text-muted-foreground">{m.role}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Empty({ children }: any) {
  return <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground text-sm">{children}</div>;
}

function InviteModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [q, setQ] = useState(""); const [results, setResults] = useState<any[]>([]); const [message, setMessage] = useState("");
  const [inviting, setInviting] = useState<string | null>(null); const [done, setDone] = useState<string[]>([]); const [err, setErr] = useState("");

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.length < 2) { setResults([]); return; }
      const { data } = await supabase.from("profiles").select("id, full_name, headline").ilike("full_name", `%${q}%`).eq("onboarded", true).limit(8);
      setResults(data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const invite = async (uid: string) => {
    setInviting(uid); setErr("");
    try { await inviteToProject(projectId, uid, message); setDone((d) => [...d, uid]); }
    catch (e: any) { setErr(e.message); }
    finally { setInviting(null); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card rounded-3xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Invite collaborators</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people by name…" autoFocus className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm mb-3" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Optional message…" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm mb-3 resize-none" />
        {err && <div className="text-sm text-destructive mb-2">{err}</div>}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {results.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-secondary">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{r.full_name}</div>
                {r.headline && <div className="text-xs text-muted-foreground truncate">{r.headline}</div>}
              </div>
              <button disabled={done.includes(r.id) || inviting === r.id} onClick={() => invite(r.id)} className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium disabled:opacity-60">
                {done.includes(r.id) ? "Invited" : inviting === r.id ? "…" : "Invite"}
              </button>
            </div>
          ))}
          {q.length >= 2 && results.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No matches.</div>}
        </div>
      </div>
    </div>
  );
}

function VisibilityModal({ project, onClose, onSaved }: { project: any; onClose: () => void; onSaved: () => void }) {
  const [fields, setFields] = useState<ShareFields>(normalizeShareFields(project.share_fields));
  const [isPublic, setIsPublic] = useState(project.visibility === "public");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      if (isPublic) { await publishProject(project.id, fields); toast.success("Project is now public"); }
      else if (project.visibility === "public") { await unpublishProject(project.id); toast.success("Project is now private"); }
      else { await updateShareFields(project.id, fields); toast.success("Saved"); }
      onSaved(); onClose();
    } catch (e: any) { toast.error(e.message || "Could not save"); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-border bg-card/95 backdrop-blur">
          <h2 className="font-display font-bold text-lg">Visibility</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex gap-2">
            <button onClick={() => setIsPublic(false)} className={`flex-1 rounded-2xl border p-3 text-left transition ${!isPublic ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
              <div className="flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4" /> Private</div>
              <div className="text-[11px] text-muted-foreground mt-1">Only you and your team can see it.</div>
            </button>
            <button onClick={() => setIsPublic(true)} className={`flex-1 rounded-2xl border p-3 text-left transition ${isPublic ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
              <div className="flex items-center gap-2 text-sm font-semibold"><Globe2 className="h-4 w-4" /> Public</div>
              <div className="text-[11px] text-muted-foreground mt-1">Visible in the feed and to partners.</div>
            </button>
          </div>

          <div className={isPublic ? "" : "opacity-50 pointer-events-none"}>
            <div className="text-xs font-semibold mb-1">What should people see?</div>
            <p className="text-[11px] text-muted-foreground mb-3">Anything switched off stays private to you and your team.</p>
            <div className="grid gap-2">
              {SHARE_FIELD_LABELS.map(({ key, label, hint }) => (
                <label key={key} className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={fields[key]} onChange={(e) => setFields({ ...fields, [key]: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[oklch(0.42_0.28_264)]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-tight">{label}</span>
                    <span className="block text-[11px] text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button disabled={busy} onClick={save} className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-medium disabled:opacity-50">
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
