import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2, ShieldCheck, Users, Banknote, FileCheck2, Globe2, ArrowRight, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/institutions/join")({
  head: () => ({
    meta: [
      { title: "Institutional Partnership — Mentor4You for universities" },
      { name: "description", content: "Universities, research centers and academic institutions: publish opportunities, run innovation challenges and connect with institutional funders on a verified workspace." },
      { property: "og:title", content: "Institutional Partnership — Mentor4You" },
      { property: "og:description", content: "A verified workspace for universities and research centers: opportunities, teams and direct funder connections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InstitutionsJoinPage,
});

function InstitutionsJoinPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified institutional access
          </div>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
            The institutional portal for universities and research centers
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Present research positions, grants, innovation challenges and incubator programmes to a
            community of builders — and connect directly with institutional funders. One verified
            workspace, your whole team.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/institutions/apply" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90 transition">
              Request institutional partnership <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/institutions" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-medium hover:bg-secondary transition">
              Browse live opportunities
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Every institution is manually vetted. Applications are reviewed by our team before any content goes live.
          </p>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl font-bold tracking-tight">Built for institutional teams</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card Icon={Globe2} title="Publish opportunities"
            body="Research positions, PhD and postdoc calls, internships, grants, innovation challenges and incubator programmes — published under your verified institutional identity." />
          <Card Icon={Banknote} title="Direct funder connect"
            body="Browse a curated directory of institutional-grade funders, foundations and venture partners, and send structured pitches from your workspace." />
          <Card Icon={Users} title="Multi-agent workspace"
            body="Invite colleagues with secure invite links. Org admins manage the team and all postings; org members publish and follow funder conversations." />
          <Card Icon={ShieldCheck} title="Strict vetting"
            body="Official email domain, registration or tax ID and supporting documentation are verified before your workspace is activated." />
          <Card Icon={FileCheck2} title="Audit-ready records"
            body="Every posting, invite and pitch is attributed to a named agent of your institution, with clear status tracking." />
          <Card Icon={Building2} title="Institutional profile"
            body="A public institution page with your logo, description, location and all live opportunities in one place." />
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl font-bold tracking-tight">How verification works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-4">
            {[
              ["Submit", "Provide institution details, official domain, registration ID and documentation."],
              ["Review", "Our team validates your institution and your authority to represent it."],
              ["Activate", "Your workspace unlocks: publish opportunities and access funders."],
              ["Scale", "Invite colleagues as org admins or members under the same institution."],
            ].map(([title, body], i) => (
              <li key={title} className="rounded-2xl border border-border bg-background p-5">
                <div className="text-[11px] font-bold uppercase tracking-widest text-primary">Step {i + 1}</div>
                <div className="mt-1 font-semibold">{title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Requirements */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl font-bold tracking-tight">What you'll need</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Official institution name and type",
              "Official institutional email domain (e.g. @yale.edu)",
              "Registration or tax identification number",
              "Accreditation or registration document (PDF or image)",
              "Primary contact name, role and phone",
              "A personal Mentor4You account to apply from",
            ].map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {r}
              </li>
            ))}
          </ul>
          <Link to="/institutions/apply" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90 transition">
            Start your application <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Card({ Icon, title, body }: { Icon: any; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
