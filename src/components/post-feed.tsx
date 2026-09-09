import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  createPost, toggleReaction, fetchComments, postComment, deletePost,
  POST_KINDS, type PostKind, type PostWithAuthor, type PostProject,
} from "@/lib/social";
import { uploadPostMedia, useSignedImage, resolveImage, mediaKindOf, mediaKindOfPath } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, Image as ImageIcon, Video, X, Send, Rocket, Trash2 } from "lucide-react";
import { normalizeShareFields } from "@/lib/project-visibility";
import { toast } from "sonner";
import { safeUrl } from "@/lib/safe-url";
import { timeAgo } from "@/lib/time";

export function Composer({
  me, onPosted, repostOf, projectId, autoFocus, requireProject, beforeSubmit, showKinds = true,
}: {
  me: any; onPosted: () => void; repostOf?: string; projectId?: string | null;
  autoFocus?: boolean; requireProject?: boolean; beforeSubmit?: () => Promise<void>; showKinds?: boolean;
}) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [kind, setKind] = useState<PostKind>("update");
  const [busy, setBusy] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const avatar = useSignedImage("avatars", me?.avatar_url);

  const canSubmit = requireProject ? !!projectId : (!!body.trim() || files.length > 0 || !!repostOf);

  const addFiles = (list: FileList | null, max: number) => {
    const arr = Array.from(list || []).slice(0, max - files.length);
    if (arr.length) setFiles([...files, ...arr]);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      if (beforeSubmit) await beforeSubmit();
      const media_urls: string[] = [];
      const media_types: string[] = [];
      for (const f of files) {
        media_urls.push(await uploadPostMedia(f));
        media_types.push(mediaKindOf(f));
      }
      const hasVideo = media_types.includes("video");
      await createPost({
        body: body.trim(), media_urls, media_types,
        post_kind: hasVideo && kind === "update" ? "video" : kind,
        repost_of: repostOf, project_id: projectId ?? null,
      });
      setBody(""); setFiles([]); setKind("update");
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
          <AvatarFallback>{(me?.full_name || "?").slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          {showKinds && !repostOf && (
            <div className="flex flex-wrap gap-1.5">
              {POST_KINDS.map((k) => (
                <button key={k.key} type="button" onClick={() => setKind(k.key)} title={k.hint}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${kind === k.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {k.label}
                </button>
              ))}
            </div>
          )}
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} autoFocus={autoFocus}
            placeholder={repostOf ? "Add a comment to your repost…" : requireProject ? "Say something about this project… #tags @mentions" : "What are you building? Use #tags and @mentions."}
            className="min-h-[80px] border-0 focus-visible:ring-0 px-0 resize-none text-base" />
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                  {mediaKindOf(f) === "video"
                    ? <video src={URL.createObjectURL(f)} className="h-full w-full object-cover" muted playsInline />
                    : <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />}
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
            <div className="flex items-center gap-1">
              <button onClick={() => photoRef.current?.click()} className="p-2 rounded-full hover:bg-secondary text-muted-foreground" aria-label="Add photo">
                <ImageIcon className="h-4 w-4" />
              </button>
              <button onClick={() => videoRef.current?.click()} className="p-2 rounded-full hover:bg-secondary text-muted-foreground" aria-label="Add video">
                <Video className="h-4 w-4" />
              </button>
              <input ref={photoRef} type="file" accept="image/*" multiple hidden
                onChange={(e) => addFiles(e.target.files, 4)} />
              <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden
                onChange={(e) => addFiles(e.target.files, 4)} />
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

export function PostCard({ post, onChange }: { post: PostWithAuthor; onChange: () => void }) {
  const [liked, setLiked] = useState(!!post.liked_by_me);
  const [count, setCount] = useState(post.reaction_count);
  const [showComments, setShowComments] = useState(false);
  const [showRepost, setShowRepost] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const avatar = useSignedImage("avatars", post.author?.avatar_url);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null)); }, []);

  const onLike = async () => {
    const next = !liked;
    setLiked(next); setCount(count + (next ? 1 : -1));
    try { await toggleReaction(post.id); } catch { setLiked(!next); setCount(count); }
  };

  const onDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try { await deletePost(post.id); toast.success("Post deleted"); onChange(); }
    catch (e: any) { toast.error(e.message || "Could not delete post"); }
  };

  const kindLabel = POST_KINDS.find((k) => k.key === post.post_kind)?.label;

  return (
    <Card className="p-4 space-y-3 rounded-3xl sm:rounded-3xl transition hover:shadow-[0_20px_50px_-30px_oklch(0_0_0/0.35)]">
      <div className="flex items-start gap-3">
        <Link to="/u/$id" params={{ id: post.author_id }}>
          <Avatar className="h-10 w-10">
            {avatar && <AvatarImage src={avatar} />}
            <AvatarFallback>{(post.author?.full_name || "?").slice(0, 1)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/u/$id" params={{ id: post.author_id }} className="font-semibold hover:underline truncate">
              {post.author?.full_name || "Unknown"}
            </Link>
            <span className="text-muted-foreground text-xs">· {new Date(post.created_at).toLocaleDateString()}</span>
            {kindLabel && post.post_kind !== "update" && (
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{kindLabel}</span>
            )}
          </div>
          {post.author?.headline && <div className="text-xs text-muted-foreground truncate">{post.author.headline}</div>}
        </div>
        {myId === post.author_id && (
          <button onClick={onDelete} aria-label="Delete post"
            className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-secondary">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {post.body && <PostBody body={post.body} />}

      {post.project && <ProjectPostCard project={post.project} />}

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

export function PostBody({ body }: { body: string }) {
  const parts = body.split(/(\s+)/).map((tok, i) => {
    if (/^#[a-zA-Z0-9_]{2,30}$/.test(tok)) return <span key={i} className="text-primary font-medium">{tok}</span>;
    if (/^@[a-zA-Z0-9_]{2,40}$/.test(tok)) return <span key={i} className="text-primary font-medium">{tok}</span>;
    return <span key={i}>{tok}</span>;
  });
  return <div className="text-sm whitespace-pre-wrap break-words">{parts}</div>;
}

export function MediaGrid({ paths }: { paths: string[] }) {
  const [items, setItems] = useState<{ url: string; kind: "image" | "video" }[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(paths.map(async (p) => {
      const url = await resolveImage("post-media", p);
      return url ? { url, kind: mediaKindOfPath(p) } : null;
    })).then((res) => {
      if (!cancelled) setItems(res.filter(Boolean) as { url: string; kind: "image" | "video" }[]);
    });
    return () => { cancelled = true; };
  }, [paths.join("|")]);
  if (items.length === 0) return null;
  const cols = items.length === 1 ? "grid-cols-1" : "grid-cols-2";
  const size = items.length === 1 ? "max-h-[500px]" : "aspect-square";
  return (
    <div className={`grid ${cols} gap-2 rounded-xl overflow-hidden`}>
      {items.map((m, i) => m.kind === "video" ? (
        <video key={i} src={m.url} controls playsInline preload="metadata" className={`w-full bg-black object-cover ${size}`} />
      ) : (
        <img key={i} src={m.url} alt="" className={`w-full object-cover ${size}`} loading="lazy" />
      ))}
    </div>
  );
}

export function Comments({ postId }: { postId: string }) {
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
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment…" className="min-h-[40px] text-sm" />
        <Button size="sm" disabled={busy || !body.trim()} onClick={submit}><Send className="h-4 w-4" /></Button>
      </div>
      {items.map((c) => (
        <div key={c.id} className="flex gap-2 items-start text-sm">
          <Avatar className="h-7 w-7"><AvatarFallback>{(c.author?.full_name || "?").slice(0, 1)}</AvatarFallback></Avatar>
          <div className="flex-1 bg-secondary rounded-2xl px-3 py-2">
            <div className="font-medium text-xs">{c.author?.full_name || "Unknown"}</div>
            <div className="whitespace-pre-wrap break-words">{c.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectPostCard({ project }: { project: PostProject }) {
  const sf = normalizeShareFields(project.share_fields);
  const funding = Number(project.funding_goal || 0);
  const raised = Number(project.funding_raised || 0);
  const milestones = Array.isArray(project.milestones) ? project.milestones : [];
  return (
    <Link to="/project/$id" params={{ id: project.id }} className="block rounded-2xl border border-border hover:border-primary transition overflow-hidden">
      {project.cover_image_url && (
        <img src={project.cover_image_url} alt={project.title} className="w-full h-36 object-cover" loading="lazy" />
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary shrink-0" />
          <span className="font-display font-bold text-sm truncate">{project.title}</span>
          {sf.progress && <span className="ml-auto text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">{project.status}</span>}
        </div>

        {sf.description && project.description && (
          <p className="text-xs text-muted-foreground line-clamp-3">{project.description}</p>
        )}
        {sf.pitch && project.pitch && (
          <p className="text-xs italic text-foreground/80 line-clamp-3">"{project.pitch}"</p>
        )}
        {sf.location && project.location_label && (
          <div className="text-[11px] text-muted-foreground">{project.location_label}</div>
        )}

        {sf.tags && (project.tags?.length || project.skills_needed?.length) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {[...(project.tags || []), ...(project.skills_needed || [])].slice(0, 6).map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
            ))}
          </div>
        )}

        {sf.progress && (
          <div className="pt-1">
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${project.completion_percentage}%` }} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">{project.completion_percentage}% complete</div>
          </div>
        )}

        {sf.funding && funding > 0 && (
          <div className="text-[11px] text-muted-foreground">
            Funding: {raised.toLocaleString()} / {funding.toLocaleString()}
          </div>
        )}

        {sf.milestones && milestones.length > 0 && (
          <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
            {milestones.slice(0, 3).map((m: any, i: number) => (
              <li key={i}>{typeof m === "string" ? m : m?.title || m?.name}</li>
            ))}
          </ul>
        )}

        {sf.links && (safeUrl(project.github_url) || safeUrl(project.demo_url)) && (
          <div className="flex gap-3 text-[11px] font-medium text-primary pt-1">
            {safeUrl(project.github_url) && <span>Code</span>}
            {safeUrl(project.demo_url) && <span>Demo</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
