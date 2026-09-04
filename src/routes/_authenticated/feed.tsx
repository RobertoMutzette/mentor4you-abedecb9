import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchFeed, createPost, toggleReaction, fetchComments, postComment,
  fetchMyProjects, type PostWithAuthor, type PostProject,
} from "@/lib/social";
import { uploadPostMedia, useSignedImage, resolveImage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, Image as ImageIcon, X, Send, Plus, Rocket, Lock } from "lucide-react";
import { SHARE_FIELD_LABELS, DEFAULT_SHARE_FIELDS, normalizeShareFields, publishProject, type ShareFields } from "@/lib/project-visibility";
import { toast } from "sonner";

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

function Composer({ me, onPosted, repostOf, projectId, autoFocus, requireProject, beforeSubmit }: { me: any; onPosted: () => void; repostOf?: string; projectId?: string | null; autoFocus?: boolean; requireProject?: boolean; beforeSubmit?: () => Promise<void> }) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatar = useSignedImage("avatars", me?.avatar_url);

  const canSubmit = requireProject ? !!projectId : (!!body.trim() || files.length > 0 || !!repostOf);

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      if (beforeSubmit) await beforeSubmit();
      const media_urls: string[] = [];
      for (const f of files) media_urls.push(await uploadPostMedia(f));
      await createPost({ body: body.trim(), media_urls, repost_of: repostOf, project_id: projectId ?? null });
      setBody(""); setFiles([]);
      toast.success(repostOf ? "Reshared" : "Posted");
      onPosted();
    } catch (e: any) { toast.error(e.message || "Failed to post"); }
    finally { setBusy(false); }
  };

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          {avatar && <AvatarImage src={avatar} />}
          <AvatarFallback>{(me?.full_name || "?").slice(0,1)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea value={body} onChange={(e)=>setBody(e.target.value)} autoFocus={autoFocus}
            placeholder={repostOf ? "Add a comment to your repost…" : requireProject ? "Say something about this project… #tags @mentions" : "What are you building? Use #tags and @mentions."}
            className="min-h-[80px] border-0 focus-visible:ring-0 px-0 resize-none text-base" />
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setFiles(files.filter((_,j)=>j!==i))}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
            <div className="flex items-center gap-1">
              <button onClick={() => fileRef.current?.click()} className="p-2 rounded-full hover:bg-secondary text-muted-foreground" aria-label="Add photo">
                <ImageIcon className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden
                onChange={(e)=>{const arr=Array.from(e.target.files||[]).slice(0,4-files.length); setFiles([...files, ...arr]);}} />
            </div>
            <Button size="sm" disabled={busy || !canSubmit} onClick={submit}>
              {busy ? "…" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PostCard({ post, onChange }: { post: PostWithAuthor; onChange: () => void }) {
  const [liked, setLiked] = useState(!!post.liked_by_me);
  const [count, setCount] = useState(post.reaction_count);
  const [showComments, setShowComments] = useState(false);
  const [showRepost, setShowRepost] = useState(false);
  const avatar = useSignedImage("avatars", post.author?.avatar_url);

  const onLike = async () => {
    const next = !liked;
    setLiked(next); setCount(count + (next ? 1 : -1));
    try { await toggleReaction(post.id); } catch { setLiked(!next); setCount(count); }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Link to="/u/$id" params={{ id: post.author_id }}>
          <Avatar className="h-10 w-10">
            {avatar && <AvatarImage src={avatar} />}
            <AvatarFallback>{(post.author?.full_name || "?").slice(0,1)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/u/$id" params={{ id: post.author_id }} className="font-semibold hover:underline truncate">
              {post.author?.full_name || "Unknown"}
            </Link>
            <span className="text-muted-foreground text-xs">· {new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          {post.author?.headline && <div className="text-xs text-muted-foreground truncate">{post.author.headline}</div>}
        </div>
      </div>

      {post.body && <PostBody body={post.body} />}

      {post.project && (
        <Link to="/project/$id" params={{ id: post.project.id }} className="block rounded-2xl border border-border hover:border-primary transition overflow-hidden">
          {post.project.cover_image_url && (
            <img src={post.project.cover_image_url} alt="" className="w-full h-36 object-cover" loading="lazy" />
          )}
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="font-display font-bold text-sm truncate">{post.project.title}</span>
              <span className="ml-auto text-[11px] uppercase tracking-widest text-muted-foreground">{post.project.status}</span>
            </div>
            {post.project.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{post.project.description}</p>}
            <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${post.project.completion_percentage}%` }} />
            </div>
          </div>
        </Link>
      )}

      {post.media_urls.length > 0 && <MediaGrid paths={post.media_urls} />}

      {post.repost && (
        <Card className="p-3 bg-secondary/30">
          <div className="text-xs text-muted-foreground mb-1">
            Reposted from <Link to="/u/$id" params={{ id: post.repost.author_id }} className="font-medium hover:underline">{post.repost.author?.full_name}</Link>
          </div>
          <PostBody body={post.repost.body} />
          {post.repost.media_urls.length > 0 && <div className="mt-2"><MediaGrid paths={post.repost.media_urls} /></div>}
        </Card>
      )}

      <div className="flex items-center gap-1 pt-2 border-t border-border text-muted-foreground">
        <button onClick={onLike} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary text-sm ${liked ? "text-primary" : ""}`}>
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {count > 0 && count}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary text-sm">
          <MessageCircle className="h-4 w-4" /> {post.comment_count > 0 && post.comment_count}
        </button>
        <button onClick={() => setShowRepost(!showRepost)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary text-sm">
          <Repeat2 className="h-4 w-4" /> {post.repost_count > 0 && post.repost_count}
        </button>
      </div>

      {showRepost && (
        <div className="pt-2">
          <Composer me={null} onPosted={() => { setShowRepost(false); onChange(); }} repostOf={post.id} />
        </div>
      )}

      {showComments && <Comments postId={post.id} />}
    </Card>
  );
}

function PostBody({ body }: { body: string }) {
  // Render #hashtags and @mentions as highlights
  const parts = body.split(/(\s+)/).map((tok, i) => {
    if (/^#[a-zA-Z0-9_]{2,30}$/.test(tok)) return <span key={i} className="text-primary font-medium">{tok}</span>;
    if (/^@[a-zA-Z0-9_]{2,40}$/.test(tok)) return <span key={i} className="text-primary font-medium">{tok}</span>;
    return <span key={i}>{tok}</span>;
  });
  return <div className="text-sm whitespace-pre-wrap break-words">{parts}</div>;
}

function MediaGrid({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(paths.map((p) => resolveImage("post-media", p))).then((res) => {
      if (!cancelled) setUrls(res.filter(Boolean) as string[]);
    });
    return () => { cancelled = true; };
  }, [paths.join("|")]);
  if (urls.length === 0) return null;
  const cols = urls.length === 1 ? "grid-cols-1" : "grid-cols-2";
  return (
    <div className={`grid ${cols} gap-2 rounded-xl overflow-hidden`}>
      {urls.map((u, i) => (
        <img key={i} src={u} alt="" className={`w-full object-cover ${urls.length===1?"max-h-[500px]":"aspect-square"}`} loading="lazy" />
      ))}
    </div>
  );
}

function Comments({ postId }: { postId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => fetchComments(postId).then(setItems);
  useEffect(() => { load(); }, [postId]);
  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try { await postComment(postId, body.trim()); setBody(""); load(); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <div className="flex gap-2">
        <Textarea value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Write a comment…" className="min-h-[40px] text-sm" />
        <Button size="sm" disabled={busy || !body.trim()} onClick={submit}><Send className="h-4 w-4"/></Button>
      </div>
      {items.map((c) => (
        <div key={c.id} className="flex gap-2 items-start text-sm">
          <Avatar className="h-7 w-7"><AvatarFallback>{(c.author?.full_name||"?").slice(0,1)}</AvatarFallback></Avatar>
          <div className="flex-1 bg-secondary rounded-2xl px-3 py-2">
            <div className="font-medium text-xs">{c.author?.full_name || "Unknown"}</div>
            <div className="whitespace-pre-wrap break-words">{c.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
