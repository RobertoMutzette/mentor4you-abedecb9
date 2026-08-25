import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchPositions, togglePositionLike, togglePositionSave, isInstitutionOwner, type PositionWithInstitution } from "@/lib/institutions";
import { Heart, Bookmark, MapPin, ExternalLink, Calendar, Plus, GraduationCap, Building2 } from "lucide-react";
import { safeUrl } from "@/lib/safe-url";

export const Route = createFileRoute("/_authenticated/institutions")({
  head: () => ({ meta: [{ title: "Institutions — Mentor4You" }] }),
  component: InstitutionsFeed,
});

function InstitutionsFeed() {
  const [items, setItems] = useState<PositionWithInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownedInst, setOwnedInst] = useState<{ id: string } | null>(null);

  useEffect(() => {
    fetchPositions().then((d) => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
    isInstitutionOwner().then((i) => setOwnedInst(i));
  }, []);

  const onLike = async (id: string) => {
    const now = await togglePositionLike(id);
    setItems((xs) => xs.map((p) => p.id === id ? { ...p, liked_by_me: now, like_count: p.like_count + (now ? 1 : -1) } : p));
  };
  const onSave = async (id: string) => {
    const now = await togglePositionSave(id);
    setItems((xs) => xs.map((p) => p.id === id ? { ...p, saved_by_me: now } : p));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Institutions</h1>
          <p className="text-sm text-muted-foreground mt-1">Research positions, PhD, postdoc and internship openings.</p>
        </div>
        {ownedInst ? (
          <Link to="/institutions/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> Post
          </Link>
        ) : (
          <Link to="/institutions/join" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card text-sm font-medium hover:bg-secondary transition">
            <Building2 className="h-4 w-4" /> Register institution
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <article key={p.id} className="rounded-3xl border border-border bg-card overflow-hidden">
              {p.cover_url && <img src={p.cover_url} alt="" className="w-full h-40 object-cover" />}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  {p.institution?.logo_url ? (
                    <img src={p.institution.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-primary" /></div>
                  )}
                  <div className="min-w-0">
                    <Link to="/institution/$id" params={{ id: p.institution_id }} className="text-sm font-semibold hover:underline truncate block">
                      {p.institution?.name || "Institution"}
                      {p.institution?.verified && <span className="ml-1.5 inline-block text-primary" title="Verified">✓</span>}
                    </Link>
                    <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <Link to="/position/$id" params={{ id: p.id }} className="block">
                  <h2 className="font-display text-xl font-bold tracking-tight">{p.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><PositionBadge type={p.position_type} /></span>
                    {p.location_label && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location_label}{p.remote && " · Remote"}</span>}
                    {p.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Apply by {new Date(p.deadline).toLocaleDateString()}</span>}
                  </div>
                  <p className="mt-3 text-sm text-foreground/80 line-clamp-3 whitespace-pre-wrap">{p.description}</p>
                  {p.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tags.slice(0, 6).map((t) => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t}</span>)}
                    </div>
                  )}
                </Link>

                <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
                  <button onClick={() => onLike(p.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary transition text-sm ${p.liked_by_me ? "text-primary" : ""}`}>
                    <Heart className={`h-4 w-4 ${p.liked_by_me ? "fill-current" : ""}`} /> {p.like_count}
                  </button>
                  <button onClick={() => onSave(p.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-secondary transition text-sm ${p.saved_by_me ? "text-primary" : ""}`}>
                    <Bookmark className={`h-4 w-4 ${p.saved_by_me ? "fill-current" : ""}`} /> Save
                  </button>
                  {safeUrl(p.apply_url) && (
                    <a href={safeUrl(p.apply_url)} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                      Apply <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function PositionBadge({ type }: { type: string }) {
  const map: Record<string, string> = { research: "Research", phd: "PhD", postdoc: "Postdoc", internship: "Internship", fellowship: "Fellowship" };
  return <span className="uppercase tracking-widest text-[10px] font-bold text-primary">{map[type] || type}</span>;
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border p-10 text-center">
      <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground" />
      <h3 className="mt-3 font-display font-bold text-lg">No positions yet</h3>
      <p className="text-sm text-muted-foreground mt-1">Verified institutions post research opportunities here.</p>
      <Link to="/institutions/join" className="inline-block mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">Are you an institution?</Link>
    </div>
  );
}
