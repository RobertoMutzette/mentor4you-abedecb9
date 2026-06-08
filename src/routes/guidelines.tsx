import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/guidelines")({
  head: () => ({ meta: [
    { title: "Community Guidelines — Mentor4You" },
    { name: "description", content: "How we keep Mentor4You safe, respectful, and useful for everyone." },
  ] }),
  component: GuidelinesPage,
});

function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-8 w-8" />
            <span className="font-display font-bold text-lg">Mentor4You</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Community Guidelines</h1>
        <p className="mt-3 text-muted-foreground">A simple set of rules to keep Mentor4You a place where people actually want to show up.</p>

        <Block n="1" title="Be real">
          Use your real name, a real photo, and an accurate bio. No fake profiles, no impersonation, no recruiter spam disguised as mentorship.
        </Block>
        <Block n="2" title="Be kind">
          Disagreement is fine. Personal attacks, harassment, slurs, sexual content directed at others, and discrimination of any kind are not.
        </Block>
        <Block n="3" title="Mentor with intent">
          Mentorship is a relationship. Show up when you commit, communicate clearly, and respect each other's time and goals.
        </Block>
        <Block n="4" title="Don't sell, don't scam">
          No cold sales, MLM pitches, paid course funnels, investment scams, or asking for money. Legitimate paid services should be disclosed up front and never pushed.
        </Block>
        <Block n="5" title="Keep it lawful">
          Don't post or share anything illegal, doxxing, leaked credentials, malware, or content involving minors that isn't unambiguously safe.
        </Block>
        <Block n="6" title="Respect privacy">
          Don't share private conversations, contact info, or personal details about others without consent.
        </Block>
        <Block n="7" title="Use the tools">
          If something feels off, block the user and report them. We review every report and act on violations.
        </Block>

        <section className="mt-12 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Enforcement</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Violations can result in content removal, account suspension, or a permanent ban. Severe violations (illegal content, threats, child safety) are escalated immediately and may be reported to authorities.
          </p>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          Questions or appeals: <a className="text-primary font-medium" href="mailto:safety@mentor4you.app">safety@mentor4you.app</a>
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition">Terms of Service</Link>
          <Link to="/gdpr" className="hover:text-foreground transition">GDPR</Link>
          <Link to="/ip-info" className="hover:text-foreground transition">IP</Link>
        </div>
      </main>
    </div>
  );
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="text-xs text-primary font-bold uppercase tracking-widest">Rule {n}</div>
      <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-muted-foreground leading-relaxed">{children}</p>
    </section>
  );
}
