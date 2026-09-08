import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchFeed, fetchMyProjects, type PostWithAuthor, type PostProject } from "@/lib/social";
import { Card } from "@/components/ui/card";
import { Plus, Lock, X } from "lucide-react";
import { SHARE_FIELD_LABELS, DEFAULT_SHARE_FIELDS, normalizeShareFields, publishProject, type ShareFields } from "@/lib/project-visibility";
import { Composer, PostCard } from "@/components/post-feed";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Feed — Mentor4You" },
      { name: "description", content: "See what builders are shipping: project updates, ideas and opportunities from your network." },
      { property: "og:title", content: "Feed — Mentor4You" },
      { property: "og:description", content: "See what builders are shipping across the Mentor4You community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const [scope, setScope] = useState<"for-you" | "following">("for-you");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; full_name: string; avatar_url: string } | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setPosts(await fetchFeed({ scope })); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [scope]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await (supabase as any).from("profiles").select("id, full_name, avatar_url").eq("id", data.user.id).maybeSingle();
      setMe(p);
    });
    const ch = (supabase as any).channel("feed-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setScope("for-you")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${scope==="for-you"?"bg-primary text-primary-foreground":"bg-secondary text-foreground hover:bg-secondary/80"}`}>For you</button>
        <button onClick={() => setScope("following")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${scope==="following"?"bg-primary text-primary-foreground":"bg-secondary text-foreground hover:bg-secondary/80"}`}>Following</button>

        <button
          onClick={() => setComposerOpen(true)}
          aria-label="Create a post"
          className="ml-auto inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-[0_10px_30px_-12px_oklch(0.42_0.28_264/0.8)]"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Post</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading…</div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {scope === "following" ? "Follow people to see their posts here." : "Nothing here yet — tap Post to share a project."}
        </Card>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)
      )}

      {composerOpen && (
        <ComposerModal me={me} onClose={() => setComposerOpen(false)} onPosted={() => { setComposerOpen(false); load(); }} />
      )}
    </div>
  );
}

function ComposerModal({ me, onClose, onPosted }: { me: any; onClose: () => void; onPosted: () => void }) {
  const [projects, setProjects] = useState<PostProject[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [shareFields, setShareFields] = useState<ShareFields>(DEFAULT_SHARE_FIELDS);

  useEffect(() => {
    fetchMyProjects().then((p) => { setProjects(p); setLoadingProjects(false); }).catch(() => setLoadingProjects(false));
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-card/95 backdrop-blur">
          <h2 className="font-display font-bold text-lg">New post</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Choose the project you want to share</div>
            {loadingProjects ? (
              <div className="text-sm text-muted-foreground">Loading your projects…</div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                You don't have a project yet.{" "}
                <Link to="/projects" className="text-primary font-medium">Create one →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const next = projectId === p.id ? null : p.id;
                      setProjectId(next);
                      if (next) setShareFields(normalizeShareFields(p.share_fields));
                    }}
                    className={`w-full text-left rounded-2xl border p-3 transition ${projectId === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold truncate">{p.title}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground shrink-0">{p.completion_percentage}%</span>
                    </div>
                    {p.description && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {projectId && (
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <div className="text-xs font-semibold">What should people see?</div>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">Anything you switch off stays private to you and your team.</p>
              <div className="grid gap-2">
                {SHARE_FIELD_LABELS.map(({ key, label, hint }) => (
                  <label key={key} className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareFields[key]}
                      onChange={(e) => setShareFields({ ...shareFields, [key]: e.target.checked })}
                      className="mt-0.5 h-4 w-4 accent-[oklch(0.42_0.28_264)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-tight">{label}</span>
                      <span className="block text-[11px] text-muted-foreground">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Composer
            me={me}
            projectId={projectId}
            requireProject
            beforeSubmit={async () => { if (projectId) await publishProject(projectId, shareFields); }}
            onPosted={onPosted}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

