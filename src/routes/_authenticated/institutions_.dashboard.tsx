import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  myOrgMembership, myInstitutionApplication, listOrgMembers, listOrgInvites, createOrgInvite,
  revokeOrgInvite, updateOrgMemberRole, removeOrgMember, listFunders, listPitches, createPitch,
  createPosition, deletePosition, updateInstitution,
  type OrgMembership, type OrgMember, type OrgInvite, type Funder, type Pitch,
  type Position, type Institution, type InstitutionApplication,
} from "@/lib/institutions";
import { safeUrl } from "@/lib/safe-url";
import {
  Building2, Plus, Trash2, Clock, XCircle, Settings2, Briefcase, Users, Banknote,
  ShieldCheck, Copy, Mail, ExternalLink, Lock,
} from "lucide-react";
import { toast } from "sonner";

const sb = supabase as any;

export const Route = createFileRoute("/_authenticated/institutions/dashboard")({
  head: () => ({
    meta: [
      { title: "Institutional workspace — Mentor4You" },
      { name: "description", content: "Publish opportunities, manage your institutional team and connect with funders from one verified workspace." },
      { property: "og:title", content: "Institutional workspace — Mentor4You" },
      { property: "og:description", content: "Opportunities, team management and direct funder connections for verified institutions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstitutionWorkspace,
});

type Tab = "opportunities" | "funders" | "team" | "profile";

function InstitutionWorkspace() {
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<OrgMembership | null>(null);
  const [application, setApplication] = useState<InstitutionApplication | null>(null);
  const [tab, setTab] = useState<Tab>("opportunities");

  useEffect(() => {
    (async () => {
      const m = await myOrgMembership();
      setOrg(m);
      if (!m) setApplication(await myInstitutionApplication());
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="mx-auto max-w-2xl px-6 py-10 text-sm text-muted-foreground">Loading workspace…</div>;
  if (!org || !org.institution.verified) return <NoAccess application={application} unverified={!!org && !org.institution.verified} />;

  const inst = org.institution;
  const isAdmin = org.role === "org_admin";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <header className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-center gap-4">
          {inst.logo_url ? (
            <img src={inst.logo_url} className="h-14 w-14 rounded-2xl border border-border object-cover" alt="" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><Building2 className="h-6 w-6 text-primary" /></div>
          )}
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Institutional workspace</div>
            <h1 className="truncate font-display text-2xl font-bold tracking-tight">{inst.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <Badge tone="success"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
              <Badge tone="neutral">{isAdmin ? "Org admin" : "Org member"}</Badge>
              {inst.email_domain && <Badge tone="neutral">@{inst.email_domain}</Badge>}
            </div>
          </div>
          <Link to="/institution/$id" params={{ id: inst.id }} className="ml-auto shrink-0 text-sm font-medium text-primary">Public page →</Link>
        </div>
      </header>

      <nav className="mt-6 flex flex-wrap items-center gap-2">
        <TabBtn active={tab === "opportunities"} onClick={() => setTab("opportunities")} Icon={Briefcase} label="Opportunities" />
        <TabBtn active={tab === "funders"} onClick={() => setTab("funders")} Icon={Banknote} label="Funder connect" />
        <TabBtn active={tab === "team"} onClick={() => setTab("team")} Icon={Users} label="Team" />
        <TabBtn active={tab === "profile"} onClick={() => setTab("profile")} Icon={Settings2} label="Profile" />
      </nav>

      {tab === "opportunities" && <OpportunitiesTab inst={inst} />}
      {tab === "funders" && <FundersTab inst={inst} />}
      {tab === "team" && <TeamTab inst={inst} isAdmin={isAdmin} />}
      {tab === "profile" && <ProfileTab inst={inst} onSaved={(next) => setOrg({ ...org, institution: next })} />}
    </div>
  );
}

/* ------------------------------- Opportunities ------------------------------ */

const OPPORTUNITY_TYPES = [
  { value: "research", label: "Research position" },
  { value: "phd", label: "PhD" },
  { value: "postdoc", label: "Postdoc" },
  { value: "internship", label: "Internship" },
  { value: "fellowship", label: "Fellowship" },
  { value: "grant", label: "Grant" },
  { value: "challenge", label: "Innovation challenge" },
  { value: "incubator", label: "Incubator programme" },
];

const emptyPosition = {
  title: "", field: "", description: "", position_type: "research",
  location_label: "", remote: false, deadline: "", apply_url: "", tags: "", cover_url: "",
};

function OpportunitiesTab({ inst }: { inst: Institution }) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState(emptyPosition);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await sb.from("institution_positions").select("*").eq("institution_id", inst.id).order("created_at", { ascending: false });
    setPositions(data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [inst.id]);

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
      await load();
      setShowForm(false);
      setF(emptyPosition);
      toast.success("Opportunity published");
    } catch (err: any) { toast.error(err.message || "Could not publish"); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await deletePosition(id); await load(); toast.success("Opportunity removed"); }
    catch (err: any) { toast.error(err.message || "Could not remove"); }
  };

  return (
    <Panel>
      <PanelHead title="Opportunities" subtitle="Research positions, grants, challenges and incubator programmes published under your institution.">
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "New opportunity"}
        </button>
      </PanelHead>

      {showForm && (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl border border-border bg-background p-4">
          <Row label="Title" required><input required className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Row>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Type">
              <select className={input} value={f.position_type} onChange={(e) => setF({ ...f, position_type: e.target.value })}>
                {OPPORTUNITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Row>
            <Row label="Field"><input className={input} value={f.field} onChange={(e) => setF({ ...f, field: e.target.value })} placeholder="e.g. Bioinformatics" /></Row>
          </div>
          <Row label="Description" required><textarea required rows={6} className={input} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Row>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Location"><input className={input} value={f.location_label} onChange={(e) => setF({ ...f, location_label: e.target.value })} /></Row>
            <Row label="Deadline"><input type="date" className={input} value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Row>
          </div>
          <Row label="Application URL"><input type="url" className={input} value={f.apply_url} onChange={(e) => setF({ ...f, apply_url: e.target.value })} placeholder="https://" /></Row>
          <Row label="Tags (comma separated)"><input className={input} value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="ai, biology, europe" /></Row>
          <Row label="Cover image URL (optional)"><input className={input} value={f.cover_url} onChange={(e) => setF({ ...f, cover_url: e.target.value })} /></Row>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.remote} onChange={(e) => setF({ ...f, remote: e.target.checked })} /> Remote available</label>
          <button disabled={busy} className="w-full rounded-full bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50">
            {busy ? "Publishing…" : "Publish opportunity"}
          </button>
        </form>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/60 text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr><Th>Title</Th><Th>Type</Th><Th className="hidden sm:table-cell">Published</Th><Th className="w-10" /></tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No opportunities published yet.</td></tr>
            ) : positions.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">
                  <Link to="/position/$id" params={{ id: p.id }} className="font-medium hover:underline">{p.title}</Link>
                  {p.location_label && <div className="text-xs text-muted-foreground">{p.location_label}{p.remote && " · Remote"}</div>}
                </td>
                <td className="p-3"><Badge tone="neutral">{OPPORTUNITY_TYPES.find((t) => t.value === p.position_type)?.label || p.position_type}</Badge></td>
                <td className="hidden p-3 text-muted-foreground sm:table-cell">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <button onClick={() => remove(p.id)} aria-label={`Delete ${p.title}`} className="rounded-full p-2 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ---------------------------------- Funders --------------------------------- */

function FundersTab({ inst }: { inst: Institution }) {
  const [funders, setFunders] = useState<Funder[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [target, setTarget] = useState<Funder | null>(null);
  const [f, setF] = useState({ subject: "", body: "", amount_requested: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [fu, pi] = await Promise.all([listFunders(), listPitches(inst.id)]);
    setFunders(fu); setPitches(pi);
  };
  useEffect(() => { load().catch(() => {}); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [inst.id]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setBusy(true);
    try {
      await createPitch({
        institution_id: inst.id, funder_id: target.id, subject: f.subject, body: f.body,
        amount_requested: Number(f.amount_requested || 0),
      });
      setTarget(null); setF({ subject: "", body: "", amount_requested: "" });
      await load();
      toast.success("Pitch sent to the funder");
    } catch (err: any) { toast.error(err.message || "Could not send pitch"); }
    finally { setBusy(false); }
  };

  const pitchedIds = new Set(pitches.map((p) => p.funder_id));

  return (
    <Panel>
      <PanelHead title="Direct funder connect" subtitle="Institutional-grade funders, foundations and venture partners open to academic collaborations." />

      {target && (
        <form onSubmit={send} className="mt-4 space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-sm font-semibold">Pitch to {target.name}</div>
          <Row label="Subject" required><input required className={input} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Row>
          <Row label="Amount requested (optional)"><input type="number" min="0" className={input} value={f.amount_requested} onChange={(e) => setF({ ...f, amount_requested: e.target.value })} /></Row>
          <Row label="Your pitch" required><textarea required rows={5} className={input} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Programme, expected impact, why this funder…" /></Row>
          <div className="flex gap-2">
            <button disabled={busy} className="flex-1 rounded-full bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:opacity-50">{busy ? "Sending…" : "Send pitch"}</button>
            <button type="button" onClick={() => setTarget(null)} className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {funders.length === 0 && <p className="text-sm text-muted-foreground">No funders available yet.</p>}
        {funders.map((fu) => (
          <div key={fu.id} className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold">{fu.name}</div>
                <div className="text-xs text-muted-foreground">{fu.location_label}</div>
              </div>
              <Badge tone="neutral">{fu.funder_type.replace("_", " ")}</Badge>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{fu.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {fu.focus_areas.slice(0, 4).map((a) => <span key={a} className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">{a}</span>)}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Banknote className="h-3.5 w-3.5" /> {fu.ticket_range || "Ticket size on request"}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={() => setTarget(fu)} className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
                {pitchedIds.has(fu.id) ? "Pitch again" : "Pitch"}
              </button>
              {safeUrl(fu.website) && (
                <a href={safeUrl(fu.website)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary">
                  Website <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-8 font-display text-lg font-bold">Pitch history</h3>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/60 text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr><Th>Subject</Th><Th>Funder</Th><Th>Status</Th><Th className="hidden sm:table-cell">Sent</Th></tr>
          </thead>
          <tbody>
            {pitches.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No pitches sent yet.</td></tr>
            ) : pitches.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-medium">{p.subject}</td>
                <td className="p-3">{funders.find((x) => x.id === p.funder_id)?.name || "—"}</td>
                <td className="p-3"><Badge tone="success">{p.status}</Badge></td>
                <td className="hidden p-3 text-muted-foreground sm:table-cell">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ----------------------------------- Team ----------------------------------- */

function TeamTab({ inst, isAdmin }: { inst: Institution; isAdmin: boolean }) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"org_admin" | "org_member">("org_member");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [m, i] = await Promise.all([listOrgMembers(inst.id), isAdmin ? listOrgInvites(inst.id) : Promise.resolve([])]);
    setMembers(m); setInvites(i);
  };
  useEffect(() => { load().catch(() => {}); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [inst.id]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const inv = await createOrgInvite(inst.id, email, role);
      setEmail("");
      await load();
      await copyLink(inv.token);
      toast.success("Invite created — link copied to clipboard");
    } catch (err: any) { toast.error(err.message || "Could not create invite"); }
    finally { setBusy(false); }
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/institutions/invite/${token}`;
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard unavailable */ }
  };

  return (
    <Panel>
      <PanelHead title="Team management" subtitle="Everyone here acts on behalf of your institution. Org admins manage the team and all postings." />

      {isAdmin && (
        <form onSubmit={invite} className="mt-4 flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 sm:flex-row">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@yale.edu" className={`${input} flex-1`} />
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className={`${input} sm:w-40`}>
            <option value="org_member">Org member</option>
            <option value="org_admin">Org admin</option>
          </select>
          <button disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            <Mail className="h-4 w-4" /> Invite
          </button>
        </form>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/60 text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr><Th>Agent</Th><Th>Role</Th><Th className="hidden sm:table-cell">Joined</Th>{isAdmin && <Th className="w-10" />}</tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="p-3">
                  <Link to="/u/$id" params={{ id: m.user_id }} className="font-medium hover:underline">{m.profile?.full_name || "Member"}</Link>
                  {m.profile?.headline && <div className="text-xs text-muted-foreground">{m.profile.headline}</div>}
                </td>
                <td className="p-3">
                  {isAdmin ? (
                    <select value={m.role} className={`${input} py-1`} onChange={async (e) => {
                      try { await updateOrgMemberRole(m.id, e.target.value as any); await load(); toast.success("Role updated"); }
                      catch (err: any) { toast.error(err.message || "Could not update role"); }
                    }}>
                      <option value="org_member">Org member</option>
                      <option value="org_admin">Org admin</option>
                    </select>
                  ) : <Badge tone="neutral">{m.role === "org_admin" ? "Org admin" : "Org member"}</Badge>}
                </td>
                <td className="hidden p-3 text-muted-foreground sm:table-cell">{new Date(m.created_at).toLocaleDateString()}</td>
                {isAdmin && (
                  <td className="p-3">
                    {m.user_id !== inst.owner_id && (
                      <button aria-label="Revoke access" onClick={async () => {
                        try { await removeOrgMember(m.id); await load(); toast.success("Access revoked"); }
                        catch (err: any) { toast.error(err.message || "Could not revoke"); }
                      }} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <>
          <h3 className="mt-8 font-display text-lg font-bold">Pending invites</h3>
          <div className="mt-3 space-y-2">
            {invites.filter((i) => i.status === "pending").length === 0 && <p className="text-sm text-muted-foreground">No pending invites.</p>}
            {invites.filter((i) => i.status === "pending").map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background p-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{i.email}</span>
                <Badge tone="neutral">{i.role === "org_admin" ? "Org admin" : "Org member"}</Badge>
                <span className="text-xs text-muted-foreground">expires {new Date(i.expires_at).toLocaleDateString()}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => { copyLink(i.token); toast.success("Invite link copied"); }} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium">
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </button>
                  <button aria-label="Revoke invite" onClick={async () => {
                    try { await revokeOrgInvite(i.id); await load(); toast.success("Invite revoked"); }
                    catch (err: any) { toast.error(err.message || "Could not revoke"); }
                  }} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

/* ---------------------------------- Profile --------------------------------- */

function ProfileTab({ inst, onSaved }: { inst: Institution; onSaved: (i: Institution) => void }) {
  const [f, setF] = useState({
    name: inst.name, website: inst.website, contact_email: inst.contact_email,
    description: inst.description, location_label: inst.location_label,
    logo_url: inst.logo_url, cover_url: inst.cover_url,
  });
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await updateInstitution(inst.id, f); onSaved({ ...inst, ...f }); toast.success("Institution profile updated"); }
    catch (err: any) { toast.error(err.message || "Could not save"); }
    finally { setBusy(false); }
  };

  return (
    <Panel>
      <PanelHead title="Institution profile" subtitle="Shown on your public institution page and on every opportunity you publish." />
      <form onSubmit={save} className="mt-4 space-y-3">
        <Row label="Name" required><input required className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Row>
        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Website"><input className={input} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://" /></Row>
          <Row label="Contact email"><input type="email" className={input} value={f.contact_email} onChange={(e) => setF({ ...f, contact_email: e.target.value })} /></Row>
        </div>
        <Row label="Location"><input className={input} value={f.location_label} onChange={(e) => setF({ ...f, location_label: e.target.value })} /></Row>
        <Row label="About"><textarea rows={5} className={input} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Row>
        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Logo URL"><input className={input} value={f.logo_url} onChange={(e) => setF({ ...f, logo_url: e.target.value })} /></Row>
          <Row label="Cover URL"><input className={input} value={f.cover_url} onChange={(e) => setF({ ...f, cover_url: e.target.value })} /></Row>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4 text-xs text-muted-foreground">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground"><Lock className="h-3.5 w-3.5" /> Verification data (read only)</div>
          Type: {inst.institution_type || "—"} · Domain: {inst.email_domain ? `@${inst.email_domain}` : "—"} · Registration ID: {inst.registration_id || "—"}
        </div>
        <button disabled={busy} className="w-full rounded-full bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </Panel>
  );
}

/* ---------------------------------- Shared ---------------------------------- */

function NoAccess({ application, unverified }: { application: InstitutionApplication | null; unverified: boolean }) {
  if (unverified || application?.status === "pending") {
    return (
      <Center Icon={Clock} title="Pending verification"
        body="Your institution is awaiting review by a platform administrator. The workspace unlocks as soon as it is approved.">
        <Link to="/institutions" className="mt-4 inline-block rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium">Browse opportunities</Link>
      </Center>
    );
  }
  if (application?.status === "rejected") {
    return (
      <Center Icon={XCircle} title="Request declined"
        body="Your institutional partnership request wasn't approved. You can reapply with complete documentation.">
        <Link to="/institutions/apply" className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Apply again</Link>
      </Center>
    );
  }
  return (
    <Center Icon={Building2} title="No institutional workspace"
      body="This area is reserved for verified universities, research centers and academic institutions.">
      <Link to="/institutions/join" className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Request institutional partnership</Link>
    </Center>
  );
}

function Center({ Icon, title, body, children }: { Icon: any; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <Icon className="mx-auto h-10 w-10 text-primary" />
      <h1 className="mt-3 font-display text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="mt-5 rounded-3xl border border-border bg-card p-5">{children}</section>;
}

function PanelHead({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function TabBtn({ active, onClick, Icon, label }: { active: boolean; onClick: () => void; Icon: any; label: string }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "success" | "neutral" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone === "success" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
      {children}
    </span>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`p-3 font-semibold ${className}`}>{children}</th>;
}

const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}{required && <span className="text-destructive"> *</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
