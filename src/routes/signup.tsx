import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ArrowUpRight } from "lucide-react";
import { AuthShell, Field, Divider } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Mentor4You" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/onboarding" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/onboarding",
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (!data.session) setInfo("Check your email to confirm your account, then sign in.");
  };

  const handleGoogle = async () => {
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/onboarding" });
    if (result.error) setError(result.error.message ?? "Google sign-in failed");
  };

  return <AuthShell title="Join Mentor4You" subtitle="Create your account, then we'll match you in minutes.">
    <button onClick={handleGoogle} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-border bg-card hover:bg-secondary transition font-medium">
      Continue with Google
    </button>
    <Divider />
    <form onSubmit={handleSignup} className="space-y-3">
      <Field label="Full name" value={fullName} onChange={setFullName} required />
      <Field label="Email" type="email" value={email} onChange={setEmail} required />
      <Field label="Password" type="password" value={password} onChange={setPassword} required placeholder="At least 6 characters" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {info && <p className="text-sm text-primary">{info}</p>}
      <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Creating account…" : "Create account"} <ArrowUpRight className="h-4 w-4" />
      </button>
    </form>
    <p className="text-sm text-center text-muted-foreground mt-6">
      Already have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link>
    </p>
  </AuthShell>;
}
