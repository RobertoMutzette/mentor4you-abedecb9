import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { acceptOrgInvite } from "@/lib/institutions";
import { Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/institutions_/invite/$token")({
  head: () => ({
    meta: [
      { title: "Join an institutional workspace — Mentor4You" },
      { name: "description", content: "Accept your secure invitation to join your institution's verified workspace on Mentor4You." },
      { property: "og:title", content: "Join an institutional workspace — Mentor4You" },
      { property: "og:description", content: "Accept a secure invitation to collaborate under your institution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = useParams({ from: "/_authenticated/institutions_/invite/$token" });
  const navigate = useNavigate();
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    acceptOrgInvite(token)
      .then(() => { setState("ok"); setTimeout(() => navigate({ to: "/institutions/dashboard" }), 1500); })
      .catch((err: any) => { setState("error"); setMessage(err.message || "This invitation could not be accepted."); });
  }, [token, navigate]);

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <Building2 className="h-6 w-6 text-primary" />
      </div>
      {state === "working" && (
        <>
          <h1 className="mt-4 font-display text-xl font-bold">Verifying your invitation…</h1>
          <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-muted-foreground" />
        </>
      )}
      {state === "ok" && (
        <>
          <CheckCircle2 className="mx-auto mt-4 h-8 w-8 text-primary" />
          <h1 className="mt-3 font-display text-xl font-bold">You're in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Taking you to the institutional workspace…</p>
        </>
      )}
      {state === "error" && (
        <>
          <XCircle className="mx-auto mt-4 h-8 w-8 text-destructive" />
          <h1 className="mt-3 font-display text-xl font-bold">Invitation not valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Link to="/institutions" className="mt-5 inline-block rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium">Back to Institutions</Link>
        </>
      )}
    </div>
  );
}
