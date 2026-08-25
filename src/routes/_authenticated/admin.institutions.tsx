import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  isAdmin, listInstitutionApplications, approveInstitutionApplication,
  rejectInstitutionApplication, type InstitutionApplication,
} from "@/lib/institutions";
import { ShieldCheck, Check, X, Globe, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/institutions")({
  head: () => ({
    meta: [
      { title: "Institution review — Mentor4You" },
      { name: "description", content: "Admin review queue for institution registration requests." },
      { property: "og:title", content: "Institution review — Mentor4You" },
      { property: "og:description", content: "Approve or decline institution registration requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminInstitutions,
});

function AdminInstitutions() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [apps, setApps] = useState<InstitutionApplication[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => setApps(await listInstitutionApplications());

  useEffect(() => {
    isAdmin().then(async (ok) => {
      setAdmin(ok);
      if (ok) await load().catch(() => {});
    });
  }, []);

  if (admin === null) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  }
  if (!admin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground" />
        <h1 className="mt-3 font-display text-xl font-bold">Admins only</h1>
        <p className="text-sm text-muted-foreground mt-2">You don't have access to the institution review queue.</p>
      </div>
    );
  }

  const act = async (id: string, approve: boolean) => {
    setBusyId(id);
    try {
      if (approve) await approveInstitutionApplication(id);
      else await rejectInstitutionApplication(id);
      toast.success(approve ? "Institution approved" : "Request declined");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally { setBusyId(null); }
  };

  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Institution review</h1>
          <p className="text-sm text-muted-foreground">Approve organisations before they can publish positions.</p>
        </div>
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">Pending ({pending.length})</h2>
      <div className="mt-3 space-y-3">
        {pending.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No pending requests.</div>
        ) : pending.map((a) => (
          <article key={a.id} className="rounded-3xl border border-border bg-card p-5">
            <div className="font-display font-bold">{a.institution_name}</div>
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {safeUrl(a.website) && <a href={safeUrl(a.website)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary"><Globe className="h-3 w-3" />{a.website}</a>}
              {a.contact_email && <a href={`mailto:${a.contact_email}`} className="inline-flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" />{a.contact_email}</a>}
              <span>{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
            <dl className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
              <Detail label="Type" value={a.institution_type} />
              <Detail label="Official domain" value={a.email_domain ? `@${a.email_domain}` : ""} />
              <Detail label="Registration / Tax ID" value={a.registration_id} />
              <Detail label="Primary contact" value={[a.contact_name, a.contact_role].filter(Boolean).join(" · ")} />
              <Detail label="Phone" value={a.contact_phone} />
            </dl>
            {a.document_path && <DocumentLink path={a.document_path} />}
            {a.description && <p className="mt-3 text-sm text-foreground/80 whitespace-pre-wrap">{a.description}</p>}

            <div className="mt-4 flex gap-2">
              <button disabled={busyId === a.id} onClick={() => act(a.id, true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                <Check className="h-4 w-4" /> Approve
              </button>
              <button disabled={busyId === a.id} onClick={() => act(a.id, false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-secondary disabled:opacity-50">
                <X className="h-4 w-4" /> Decline
              </button>
            </div>
          </article>
        ))}
      </div>

      {reviewed.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-lg font-bold">Reviewed</h2>
          <div className="mt-3 space-y-2">
            {reviewed.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3">
                <span className="text-sm font-medium truncate">{a.institution_name}</span>
                <span className={`ml-auto text-[11px] uppercase tracking-widest font-bold ${a.status === "approved" ? "text-primary" : "text-muted-foreground"}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
