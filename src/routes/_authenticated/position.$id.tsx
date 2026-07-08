import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { togglePositionLike, togglePositionSave, type Position, type Institution } from "@/lib/institutions";
import { Heart, Bookmark, MapPin, Calendar, ExternalLink, Send } from "lucide-react";

const sb = supabase as any;

export const Route = createFileRoute("/_authenticated/position/$id")({
  component: PositionPage,
});

type Comment = { id: string; user_id: string; body: string; created_at: string; author?: { full_name: string; avatar_url: string } };

function PositionPage() {
  const { id } = Route.useParams();
  const [pos, setPos] = useState<(Position & { liked_by_me?: boolean; saved_by_me?: boolean }) | null>(null);
  const [inst, setInst] = useState<Institution | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("institution_positions").select("*").eq("id", id).maybeSingle();
      if (!data) return;
      setPos(data);
      const [{ data: i }, { data: cs }, { data: u }] = await Promise.all([
        sb.from("institutions").select("*").eq("id", data.institution_id).maybeSingle(),
        sb.from("position_comments").select("*").eq("position_id", id).order("created_at", { ascending: true }),
        supabase.auth.getUser(),
      ]);
      setInst(i);
      if (cs && cs.length) {
        const ids = [...new Set(cs.map((c: any) => c.user_id))];
        const { data: ps } = await sb.from("profiles").select("id, full_name, avatar_url").in("id", ids);
        const map = new Map((ps || []).map((p: any) => [p.id, p]));
        setComments(cs.map((c: any) => ({ ...c, author: map.get(c.user_id) })));
      }
      if (u.user) {
        const [{ data: like }, { data: save }] = await Promise.all([
          sb.from("position_reactions").select("id").eq("position_id", id).eq("user_id", u.user.id).eq("kind", "like").maybeSingle(),
          sb.from("position_saves").select("id").eq("position_id", id).eq("user_id", u.user.id).maybeSingle(),
        ]);
        setPos((p) => p ? { ...p, liked_by_me: !!like, saved_by_me: !!save } : p);
      }
    })();
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await sb.from("position_comments").insert({ position_id: id, user_id: u.user.id, body: text }).select("*").single();
    if (error) return;
    const { data: prof } = await sb.from("profiles").select("id, full_name, avatar_url").eq("id", u.user.id).maybeSingle();
    setComments((cs) => [...cs, { ...data, author: prof || undefined }]);
    setText("");
  };

  if (!pos) return <div className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      {inst && (
        <Link to="/institution/$id" params={{ id: inst.id }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          {inst.logo_url ? <img src={inst.logo_url} className="h-6 w-6 rounded-lg object-cover" alt="" /> : null}
          {inst.name} {inst.verified && <span className="text-primary">✓</span>}
        </Link>
      )}
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{pos.title}</h1>
      <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="uppercase tracking-widest text-[10px] font-bold text-primary">{pos.position_type}</span>
        {pos.location_label && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{pos.location_label}{pos.remote && " · Remote"}</span>}
        {pos.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Apply by {new Date(pos.deadline).toLocaleDateString()}</span>}
      </div>

      {pos.cover_url && <img src={pos.cover_url} alt="" className="mt-6 w-full max-h-80 object-cover rounded-3xl border border-border" />}

      <div className="mt-6 whitespace-pre-wrap text-sm text-foreground/85">{pos.description}</div>

      {pos.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {pos.tags.map((t) => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary">{t}</span>)}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 border-y border-border py-3">
        <button
          onClick={async () => { const now = await togglePositionLike(pos.id); setPos((p) => p ? { ...p, liked_by_me: now, like_count: p.like_count + (now ? 1 : -1) } : p); }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary text-sm ${pos.liked_by_me ? "text-primary" : ""}`}
        >
          <Heart className={`h-4 w-4 ${pos.liked_by_me ? "fill-current" : ""}`} /> {pos.like_count}
        </button>
        <button
          onClick={async () => { const now = await togglePositionSave(pos.id); setPos((p) => p ? { ...p, saved_by_me: now } : p); }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary text-sm ${pos.saved_by_me ? "text-primary" : ""}`}
        >
          <Bookmark className={`h-4 w-4 ${pos.saved_by_me ? "fill-current" : ""}`} /> Save
        </button>
        {pos.apply_url && (
          <a href={pos.apply_url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            Apply <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <h3 className="mt-6 font-display text-lg font-bold">Discussion</h3>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question…" className="flex-1 px-4 py-2 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        <button className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm"><Send className="h-4 w-4" /></button>
      </form>
      <div className="mt-4 space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {(c.author?.full_name || "?").slice(0, 1)}
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold">{c.author?.full_name || "User"}</div>
              <div className="text-sm">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
