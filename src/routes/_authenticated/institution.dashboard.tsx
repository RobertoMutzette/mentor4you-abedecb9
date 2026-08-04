import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  createPosition, deletePosition, isInstitutionOwner, myInstitutionApplication, updateInstitution,
  type Institution, type Position, type InstitutionApplication,
} from "@/lib/institutions";
import { Building2, Plus, Trash2, Clock, XCircle, Settings2, Briefcase } from "lucide-react";
import { toast } from "sonner";

const sb = supabase as any;

export const Route = createFileRoute("/_authenticated/institution/dashboard")({
  head: () => ({
    meta: [
      { title: "Institution portal — Mentor4You" },
      { name: "description", content: "Manage your verified institution profile and publish research, PhD and internship positions." },
      { property: "og:title", content: "Institution portal — Mentor4You" },
      { property: "og:description", content: "Publish and manage research opportunities for your organisation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstitutionDashboard,
});

function InstitutionDashboard() {
  const [loading, setLoading] = useState(true);
  const [inst, setInst] = useState<Institution | null>(null);
  const [application, setApplication] = useState<InstitutionApplication | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tab, setTab] = useState<"positions" | "profile">("positions");
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ title: "", field: "", description: "", position_type: "research", location_label: "", remote: false, deadline: "", apply_url: "", tags: "", cover_url: "" });
  const [busy, setBusy] = useState(false);

  const loadPositions = async (id: string) => {
    const { data } = await sb.from("institution_positions").select("*").eq("institution_id", id).order("created_at", { ascending: false });
    setPositions(data || []);
  };

  useEffect(() => {
    (async () => {
      const i = await isInstitutionOwner();
      setInst(i);
      if (i) await loadPositions(i.id);
      else setApplication(await myInstitutionApplication());
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted-foreground">Loading…</div>;

  if (!inst) return <NoInstitution application={application} />;

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
      await loadPositions(inst.id);
      setShowForm(false);
      setF({ title: "", field: "", description: "", position_type: "research", location_label: "", remote: false, deadline: "", apply_url: "", tags: "", cover_url: "" });
      toast.success("Position published");
    } catch (err: any) {
      toast.error(err.message || "Could not publish");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await deletePosition(id); await loadPositions(inst.id); toast.success("Position removed"); }
    catch (err: any) { toast.error(err.message || "Could not remove"); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-center gap-3">
          {inst.logo_url ? <img src={inst.logo_url} className="h-14 w-14 rounded-2xl object-cover border border-border" alt="" />
            : <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-primary" /></div>}
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Institution portal</div>
            <h1 className="font-display text-2xl font-bold tracking-tight truncate">{inst.name}</h1>
            <div className="text-xs text-muted-foreground">Verified · {positions.length} open position{positions.length === 1 ? "" : "s"}</div>
          </div>
          <Link to="/institution/$id" params={{ id: inst.id }} className="ml-auto text-sm text-primary font-medium shrink-0">Public page →</Link>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <TabBtn active={tab === "positions"} onClick={() => setTab("positions")} Icon={Briefcase} label="Positions" />
        <TabBtn active={tab === "profile"} onClick={() => setTab("profile")} Icon={Settings2} label="Institution profile" />
        {tab === "positions" && (
          <button onClick={() => setShowForm(!showForm)} className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
            <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "New position"}
          </button>
        )}
      </div>

      {tab === "profile" ? (
        <InstitutionProfileForm inst={inst} onSaved={(next) => setInst(next)} />
      ) : (
        <>
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
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary transition">
                  <Link to="/position/$id" params={{ id: p.id }} className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.position_type} · {new Date(p.created_at).toLocaleDateString()}</div>
                  </Link>
                  <button onClick={() => remove(p.id)} aria-label="Delete position" className="p-2 rounded-full hover:bg-destructive/10 text-destructive shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function NoInstitution({ application }: { application: InstitutionApplication | null }) {
  if (application?.status === "pending") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Clock className="h-10 w-10 text-primary mx-auto" />
        <h1 className="mt-3 font-display text-xl font-bold">Request under review</h1>
        <p className="text-sm text-muted-foreground mt-2">
          We received your request for <span className="font-medium text-foreground">{application.institution_name}</span>.
          An administrator will verify it — you'll get a notification as soon as it's approved.
        </p>
      </div>
    );
  }
  if (application?.status === "rejected") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <XCircle className="h-10 w-10 text-destructive mx-auto" />
        <h1 className="mt-3 font-display text-xl font-bold">Request declined</h1>
        <p className="text-sm text-muted-foreground mt-2">Your request for {application.institution_name} wasn't approved. You can apply again with more detail.</p>
        <Link to="/signup/institution" className="mt-4 inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">Apply again</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
      <h1 className="mt-3 font-display text-xl font-bold">No verified institution yet</h1>
      <p className="text-sm text-muted-foreground mt-2">Institutions are verified manually before they can publish positions.</p>
      <Link to="/signup/institution" className="mt-4 inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">Request access</Link>
    </div>
  );
}

function InstitutionProfileForm({ inst, onSaved }: { inst: Institution; onSaved: (i: Institution) => void }) {
  const [f, setF] = useState({
    name: inst.name, website: inst.website, contact_email: inst.contact_email,
    description: inst.description, location_label: inst.location_label,
    logo_url: inst.logo_url, cover_url: inst.cover_url,
  });
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateInstitution(inst.id, f);
      onSaved({ ...inst, ...f });
      toast.success("Institution profile updated");
    } catch (err: any) { toast.error(err.message || "Could not save"); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="mt-6 rounded-3xl border border-border bg-card p-5 space-y-3">
      <FormRow label="Name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></FormRow>
      <div className="grid sm:grid-cols-2 gap-3">
        <FormRow label="Website"><input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} className={inputCls} placeholder="https://" /></FormRow>
        <FormRow label="Contact email"><input type="email" value={f.contact_email} onChange={(e) => setF({ ...f, contact_email: e.target.value })} className={inputCls} /></FormRow>
      </div>
      <FormRow label="Location"><input value={f.location_label} onChange={(e) => setF({ ...f, location_label: e.target.value })} className={inputCls} /></FormRow>
      <FormRow label="About"><textarea rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} /></FormRow>
      <div className="grid sm:grid-cols-2 gap-3">
        <FormRow label="Logo URL"><input value={f.logo_url} onChange={(e) => setF({ ...f, logo_url: e.target.value })} className={inputCls} /></FormRow>
        <FormRow label="Cover URL"><input value={f.cover_url} onChange={(e) => setF({ ...f, cover_url: e.target.value })} className={inputCls} /></FormRow>
      </div>
      <button disabled={busy} className="w-full px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium disabled:opacity-50">
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function TabBtn({ active, onClick, Icon, label }: { active: boolean; onClick: () => void; Icon: any; label: string }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-secondary"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm";
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
