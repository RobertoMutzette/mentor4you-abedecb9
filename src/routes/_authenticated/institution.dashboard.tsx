import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createPosition, isInstitutionOwner, type Institution, type Position } from "@/lib/institutions";
import { Building2, Plus } from "lucide-react";

const sb = supabase as any;

export const Route = createFileRoute("/_authenticated/institution/dashboard")({
  component: InstitutionDashboard,
});

function InstitutionDashboard() {
  const [inst, setInst] = useState<Institution | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ title: "", field: "", description: "", position_type: "research", location_label: "", remote: false, deadline: "", apply_url: "", tags: "", cover_url: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isInstitutionOwner().then(async (i) => {
      setInst(i);
      if (i) {
        const { data } = await sb.from("institution_positions").select("*").eq("institution_id", i.id).order("created_at", { ascending: false });
        setPositions(data || []);
      }
    });
  }, []);

  if (inst === null) return <div className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted-foreground">Loading…</div>;
  if (!inst) return (
    <div className="mx-auto max-w-2xl px-6 py-10 text-center">
      <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
      <h1 className="mt-3 font-display text-xl font-bold">No verified institution found</h1>
      <p className="text-sm text-muted-foreground mt-2">Your account isn't linked to a verified institution yet.</p>
      <Link to="/signup/institution" className="mt-4 inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">Apply now</Link>
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createPosition({
        institution_id: inst.id,
        title: f.title, field: f.field, description: f.description,
        position_type: f.position_type, location_label: f.location_label, remote: f.remote,
        deadline: f.deadline || null, apply_url: f.apply_url,
        tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean),
        cover_url: f.cover_url,
      });
      const { data } = await sb.from("institution_positions").select("*").eq("institution_id", inst.id).order("created_at", { ascending: false });
      setPositions(data || []);
      setShowForm(false);
      setF({ title: "", field: "", description: "", position_type: "research", location_label: "", remote: false, deadline: "", apply_url: "", tags: "", cover_url: "" });
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3">
        {inst.logo_url ? <img src={inst.logo_url} className="h-12 w-12 rounded-2xl object-cover border border-border" alt="" />
          : <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-primary" /></div>}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{inst.name}</h1>
          <div className="text-xs text-muted-foreground">Verified institution</div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "New position"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-6 rounded-3xl border border-border bg-card p-5 space-y-3">
          <FormRow label="Title"><input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} /></FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Type">
              <select value={f.position_type} onChange={(e) => setF({ ...f, position_type: e.target.value })} className={inputCls}>
                <option value="research">Research</option><option value="phd">PhD</option>
                <option value="postdoc">Postdoc</option><option value="internship">Internship</option>
                <option value="fellowship">Fellowship</option>
              </select>
            </FormRow>
            <FormRow label="Field"><input value={f.field} onChange={(e) => setF({ ...f, field: e.target.value })} className={inputCls} placeholder="e.g. Bioinformatics" /></FormRow>
          </div>
          <FormRow label="Description">
            <textarea required rows={6} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} />
          </FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Location"><input value={f.location_label} onChange={(e) => setF({ ...f, location_label: e.target.value })} className={inputCls} /></FormRow>
            <FormRow label="Deadline"><input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} className={inputCls} /></FormRow>
          </div>
          <FormRow label="Application URL"><input type="url" value={f.apply_url} onChange={(e) => setF({ ...f, apply_url: e.target.value })} className={inputCls} placeholder="https://" /></FormRow>
          <FormRow label="Tags (comma separated)"><input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} className={inputCls} placeholder="ai, biology, europe" /></FormRow>
          <FormRow label="Cover image URL (optional)"><input value={f.cover_url} onChange={(e) => setF({ ...f, cover_url: e.target.value })} className={inputCls} /></FormRow>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.remote} onChange={(e) => setF({ ...f, remote: e.target.checked })} /> Remote available</label>
          <button disabled={busy} className="w-full px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium disabled:opacity-50">
            {busy ? "Publishing…" : "Publish position"}
          </button>
        </form>
      )}

      <h2 className="mt-8 font-display text-lg font-bold">Your open positions</h2>
      <div className="mt-3 space-y-2">
        {positions.length === 0 ? <div className="text-sm text-muted-foreground">Nothing published yet.</div> :
          positions.map((p) => (
            <Link key={p.id} to="/position/$id" params={{ id: p.id }} className="block rounded-2xl border border-border bg-card p-4 hover:border-primary transition">
              <div className="font-semibold text-sm">{p.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{p.position_type} · {new Date(p.created_at).toLocaleDateString()}</div>
            </Link>
          ))}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
