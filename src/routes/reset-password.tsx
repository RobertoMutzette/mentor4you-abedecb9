import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight } from "lucide-react";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set a new password — Mentor4You" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash automatically.
    // We just need a session to call updateUser.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setInfo("Password updated. Redirecting…");
    setTimeout(() => navigate({ to: "/dashboard" }), 1200);
  };

  return <AuthShell title="Set a new password" subtitle="Choose a strong password you don't use elsewhere.">
    {!ready ? (
      <p className="text-sm text-muted-foreground">
        Open the reset link from your email. If you got here by mistake,{" "}
        <Link to="/forgot-password" className="text-primary font-medium">request a new link</Link>.
      </p>
    ) : (
      <form onSubmit={submit} className="space-y-3">
        <Field label="New password" type="password" value={password} onChange={setPassword} required placeholder="At least 8 characters" />
        <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} required />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {info && <p className="text-sm text-primary">{info}</p>}
        <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-50">
          {loading ? "Updating…" : "Update password"} <ArrowUpRight className="h-4 w-4" />
        </button>
      </form>
    )}
  </AuthShell>;
}
