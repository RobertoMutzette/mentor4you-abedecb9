import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Institution, Position } from "@/lib/institutions";
import { LocationMap } from "@/components/LocationMap";
import { Globe, Mail, MapPin, GraduationCap, ExternalLink } from "lucide-react";
import { safeUrl } from "@/lib/safe-url";

const sb = supabase as any;

export const Route = createFileRoute("/_authenticated/institution/$id")({
  component: InstitutionPage,
});

function InstitutionPage() {
  const { id } = Route.useParams();
  const [inst, setInst] = useState<Institution | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("institutions").select("*").eq("id", id).maybeSingle();
      setInst(data);
      const { data: ps } = await sb.from("institution_positions").select("*").eq("institution_id", id).order("created_at", { ascending: false });
      setPositions(ps || []);
    })();
  }, [id]);

  if (!inst) return <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      {inst.cover_url && <img src={inst.cover_url} alt="" className="w-full h-48 object-cover rounded-3xl border border-border" />}
      <div className="mt-6 flex items-start gap-4">
        {inst.logo_url ? (
          <img src={inst.logo_url} alt="" className="h-20 w-20 rounded-2xl object-cover border border-border" />
        ) : (
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center"><GraduationCap className="h-8 w-8 text-primary" /></div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {inst.name} {inst.verified && <span className="text-primary text-lg align-middle">✓</span>}
          </h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {inst.location_label && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{inst.location_label}</span>}
            {safeUrl(inst.website) && <a href={safeUrl(inst.website)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary"><Globe className="h-3.5 w-3.5" />Website</a>}
            {inst.contact_email && <a href={`mailto:${inst.contact_email}`} className="inline-flex items-center gap-1 hover:text-primary"><Mail className="h-3.5 w-3.5" />Contact</a>}
          </div>
        </div>
      </div>

      {inst.description && <p className="mt-6 text-sm text-foreground/80 whitespace-pre-wrap">{inst.description}</p>}

      {inst.latitude && inst.longitude && (
        <div className="mt-6">
          <LocationMap height={260} markers={[{ id: inst.id, latitude: inst.latitude, longitude: inst.longitude, title: inst.name, subtitle: inst.location_label }]} />
        </div>
      )}

      <h2 className="mt-10 font-display text-xl font-bold">Open positions</h2>
      <div className="mt-4 space-y-3">
        {positions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No open positions right now.</div>
        ) : positions.map((p) => (
          <Link key={p.id} to="/position/$id" params={{ id: p.id }} className="block rounded-2xl border border-border bg-card p-4 hover:border-primary transition">
            <div className="text-sm font-semibold">{p.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{p.position_type} · {p.location_label}{p.remote && " · Remote"}</div>
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <Link to="/institutions" className="text-sm text-primary font-medium inline-flex items-center gap-1">← Back to institutions <ExternalLink className="h-3 w-3" /></Link>
      </div>
    </div>
  );
}
