import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchFeed, createPost, toggleReaction, fetchComments, postComment, type PostWithAuthor } from "@/lib/social";
import { uploadPostMedia, useSignedImage, resolveImage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, Image as ImageIcon, X, Send, Globe2, Users2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/feed")({ component: FeedPage });

function FeedPage() {
  const [scope, setScope] = useState<"for-you" | "following">("for-you");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; full_name: string; avatar_url: string } | null>(null);

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
      </div>

      <Composer me={me} onPosted={load} />

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading…</div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {scope === "following" ? "Follow people to see their posts here." : "Be the first to post something."}
        </Card>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)
      )}
    </div>
  );
}

function Composer({ me, onPosted, repostOf }: { me: any; onPosted: () => void; repostOf?: string }) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<"public" | "followers">("public");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatar = useSignedImage("avatars", me?.avatar_url);

  const submit = async () => {
    if (!body.trim() && files.length === 0 && !repostOf) return;
    setBusy(true);
    try {
      const media_urls: string[] = [];
      for (const f of files) media_urls.push(await uploadPostMedia(f));
      await createPost({ body: body.trim(), media_urls, visibility, repost_of: repostOf });
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
          <Textarea value={body} onChange={(e)=>setBody(e.target.value)}
            placeholder={repostOf ? "Add a comment to your repost…" : "What's on your mind? Use #tags and @mentions."}
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
              <button onClick={() => setVisibility(visibility === "public" ? "followers" : "public")}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium hover:bg-secondary text-muted-foreground">
                {visibility === "public" ? <><Globe2 className="h-3 w-3"/>Public</> : <><Users2 className="h-3 w-3"/>Followers</>}
              </button>
            </div>
            <Button size="sm" disabled={busy || (!body.trim() && files.length===0 && !repostOf)} onClick={submit}>
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
