import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { submitInstitutionApplication } from "@/lib/institutions";
import { AuthShell, Field } from "./login";
import { Building2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/signup/institution")({
  head: () => ({ meta: [{ title: "Register your institution — Mentor4You" }] }),
  component: InstitutionSignupPage,
});

function InstitutionSignupPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      if (data.user?.email) setEmail(data.user.email);
      setChecking(false);
    });
  }, []);

  if (checking) return null;
  if (!signedIn) {
    return (
      <AuthShell title="Institution registration" subtitle="You need a personal account first — then apply on behalf of your institution.">
        <div className="flex gap-2">
          <Link to="/login" className="flex-1 text-center px-4 py-3 rounded-full border border-border bg-card font-medium">Sign in</Link>
          <Link to="/signup" className="flex-1 text-center px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium">Create account</Link>
        </div>
      </AuthShell>
    );
  }

  if (submitted) {
    return (
      <AuthShell title="Application received" subtitle="Our team will review your institution and get back to you within 3 business days.">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p>We've noted your request for <strong>{name}</strong>.</p>
            <p className="text-muted-foreground mt-1">Once verified, you'll be able to publish research and position openings.</p>
          </div>
        </div>
        <button onClick={() => navigate({ to: "/institutions" })} className="w-full px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium">Back to Institutions</button>
      </AuthShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await submitInstitutionApplication({ institution_name: name, website, contact_email: email, description });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Register your institution" subtitle="Apply for a verified institution account to post research and open positions.">
      <div className="flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/20 p-4">
        <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">Institution accounts are granted after review. Only official representatives should apply.</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Institution name" value={name} onChange={setName} required placeholder="ETH Zürich" />
        <Field label="Official website" type="url" value={website} onChange={setWebsite} required placeholder="https://ethz.ch" />
        <Field label="Contact email (institutional)" type="email" value={email} onChange={setEmail} required />
        <label className="block">
          <span className="text-sm font-medium">Tell us about your institution</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
            className="mt-1.5 w-full px-4 py-3 rounded-2xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="w-full px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium disabled:opacity-50">
          {busy ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </AuthShell>
  );
}
