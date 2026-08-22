import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  submitInstitutionApplication, myInstitutionApplication, myOrgMembership,
  type InstitutionApplication,
} from "@/lib/institutions";
import { uploadInstitutionDocument } from "@/lib/storage";
import { Building2, ShieldCheck, Clock, CheckCircle2, XCircle, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/institutions_/apply")({
  head: () => ({
    meta: [
      { title: "Request institutional partnership — Mentor4You" },
      { name: "description", content: "Apply for a verified institutional workspace: submit your official domain, registration ID and documentation for review." },
      { property: "og:title", content: "Request institutional partnership — Mentor4You" },
      { property: "og:description", content: "Strict vetting for universities, research centers and academic institutions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplyPage,
});

const TYPES = [
  { value: "university", label: "University" },
  { value: "research_center", label: "Research center" },
  { value: "academic_center", label: "Academic center" },
  { value: "institute", label: "Institute / Lab" },
  { value: "foundation", label: "Foundation" },
];

function ApplyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<InstitutionApplication | null>(null);
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [f, setF] = useState({
    institution_name: "", institution_type: "university", email_domain: "", registration_id: "",
    website: "", contact_email: "", contact_name: "", contact_role: "", contact_phone: "", description: "",
  });

  useEffect(() => {
    (async () => {
      const [{ data: u }, app, org] = await Promise.all([
        supabase.auth.getUser(), myInstitutionApplication(), myOrgMembership(),
      ]);
      if (u.user?.email) setF((p) => ({ ...p, contact_email: u.user!.email! }));
      setExisting(app);
      setHasWorkspace(!!org);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Shell><p className="text-sm text-muted-foreground">Loading…</p></Shell>;

  if (hasWorkspace) {
    return (
      <Shell>
        <StatusCard Icon={CheckCircle2} tone="primary" title="You already have a workspace"
          body="Your institution is verified. Manage opportunities, funders and your team from the institutional dashboard." />
        <Link to="/institutions/dashboard" className="mt-4 inline-block rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground">Open institutional dashboard</Link>
      </Shell>
    );
  }

  if (submitted || existing?.status === "pending") {
    return (
      <Shell>
        <StatusCard Icon={Clock} tone="primary" title="Pending verification"
          body={`We received the partnership request for ${existing?.institution_name || f.institution_name}. Our team validates the institution, the official domain and your authority to represent it. Access stays locked until approval — you'll be notified here.`} />
        <Link to="/institutions" className="mt-4 inline-block rounded-full border border-border bg-card px-5 py-3 font-medium">Browse opportunities meanwhile</Link>
      </Shell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = f.email_domain.trim().replace(/^@/, "").toLowerCase();
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) { toast.error("Enter a valid institutional email domain, e.g. yale.edu"); return; }
    setBusy(true);
    try {
      let document_path = "";
      if (file) document_path = await uploadInstitutionDocument(file);
      await submitInstitutionApplication({ ...f, email_domain: domain, document_path });
      setSubmitted(true);
      toast.success("Application submitted for review");
    } catch (err: any) {
      toast.error(err.message || "Could not submit application");
    } finally { setBusy(false); }
  };

  return (
    <Shell>
      {existing?.status === "rejected" && (
        <StatusCard Icon={XCircle} tone="destructive" title="Previous request declined"
          body="Your earlier request wasn't approved. You can reapply with complete documentation." />
      )}

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">
          Only official representatives may apply. Submitted documents are stored privately and are
          readable solely by our verification team.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <Section title="Institution">
          <Row label="Official institution name" required>
            <input required className={input} value={f.institution_name} onChange={(e) => setF({ ...f, institution_name: e.target.value })} placeholder="Yale University" />
          </Row>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Institution type" required>
              <select className={input} value={f.institution_type} onChange={(e) => setF({ ...f, institution_type: e.target.value })}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Row>
            <Row label="Official email domain" required>
              <input required className={input} value={f.email_domain} onChange={(e) => setF({ ...f, email_domain: e.target.value })} placeholder="yale.edu" />
            </Row>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Official website" required>
              <input required type="url" className={input} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://yale.edu" />
            </Row>
            <Row label="Registration / Tax ID" required>
              <input required className={input} value={f.registration_id} onChange={(e) => setF({ ...f, registration_id: e.target.value })} placeholder="e.g. VAT / EIN / register number" />
            </Row>
          </div>
          <Row label="Supporting documentation (PDF or image, max 10MB)">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-background px-3 py-3 text-sm hover:bg-secondary/50">
              <Upload className="h-4 w-4 text-primary" />
              <span className="truncate">{file ? file.name : "Upload accreditation or registration document"}</span>
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </Row>
        </Section>

        <Section title="Primary contact">
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Full name" required>
              <input required className={input} value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} />
            </Row>
            <Row label="Role / title" required>
              <input required className={input} value={f.contact_role} onChange={(e) => setF({ ...f, contact_role: e.target.value })} placeholder="Head of Research Office" />
            </Row>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Institutional email" required>
              <input required type="email" className={input} value={f.contact_email} onChange={(e) => setF({ ...f, contact_email: e.target.value })} />
            </Row>
            <Row label="Phone">
              <input className={input} value={f.contact_phone} onChange={(e) => setF({ ...f, contact_phone: e.target.value })} />
            </Row>
          </div>
        </Section>

        <Section title="About the institution">
          <Row label="What will you publish on Mentor4You?" required>
            <textarea required rows={5} className={input} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
              placeholder="Research positions, innovation challenges, incubator programmes…" />
          </Row>
        </Section>

        <button disabled={busy} className="w-full rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50">
          {busy ? "Submitting…" : "Submit for verification"}
        </button>
        <button type="button" onClick={() => navigate({ to: "/institutions" })} className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm font-medium">
          Cancel
        </button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Institutional partnership</div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Request verified access</h1>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function StatusCard({ Icon, title, body, tone }: { Icon: any; title: string; body: string; tone: "primary" | "destructive" }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${tone === "primary" ? "border-primary/20 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone === "primary" ? "text-primary" : "text-destructive"}`} />
      <div>
        <div className="font-semibold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-3xl border border-border bg-card p-5">
      <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
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
