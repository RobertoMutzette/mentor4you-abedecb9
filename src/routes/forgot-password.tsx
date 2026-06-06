import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight } from "lucide-react";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Mentor4You" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) setError(error.message);
    else setInfo("If that email is registered, a reset link is on its way.");
  };

  return <AuthShell title="Forgot your password?" subtitle="We'll email you a link to set a new one.">
    <form onSubmit={submit} className="space-y-3">
      <Field label="Email" type="email" value={email} onChange={setEmail} required />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {info && <p className="text-sm text-primary">{info}</p>}
      <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Sending…" : "Send reset link"} <ArrowUpRight className="h-4 w-4" />
      </button>
    </form>
    <p className="text-sm text-center text-muted-foreground mt-6">
      Remembered it? <Link to="/login" className="text-primary font-medium">Back to sign in</Link>
    </p>
  </AuthShell>;
}
