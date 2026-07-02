import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/gdpr")({
  head: () => ({ meta: [
    { title: "GDPR & Data Compliance — Mentor4You" },
    { name: "description", content: "Your data rights under GDPR and how Mentor4You handles compliance." },
  ] }),
  component: GdprPage,
});

function GdprPage() {
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
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">GDPR & Data Compliance</h1>
        <p className="mt-3 text-muted-foreground">
          Mentor4You is committed to protecting your personal data and respecting your rights under the General Data Protection Regulation (GDPR) and other applicable privacy laws.
        </p>

        <Section title="1. Data Controller">
          <p className="text-muted-foreground leading-relaxed">
            Mentor4You operates as the data controller for personal data collected through the platform. For questions about data processing, contact our Data Protection Officer at <a className="text-primary font-medium" href="mailto:mentor4you.startup@gmail.com">mentor4you.startup@gmail.com</a>.
          </p>
        </Section>

        <Section title="2. Legal basis for processing">
          <p className="text-muted-foreground leading-relaxed">
            We process your personal data based on one or more of the following legal grounds:
          </p>
          <ul className="mt-2 list-disc list-inside text-muted-foreground leading-relaxed space-y-1">
            <li><strong>Performance of a contract</strong> — to provide you with mentorship matching, messaging, and project collaboration</li>
            <li><strong>Consent</strong> — for marketing emails, optional analytics cookies, and optional profile features</li>
            <li><strong>Legitimate interests</strong> — for platform security, fraud prevention, and service improvement</li>
            <li><strong>Legal obligation</strong> — to comply with tax, safety, or regulatory requirements</li>
          </ul>
        </Section>

        <Section title="3. Your rights">
          <p className="text-muted-foreground leading-relaxed">
            Under GDPR, you have the following rights regarding your personal data:
          </p>
          <div className="mt-3 grid gap-3">
            <RightCard title="Right to access" desc="You can request a copy of all personal data we hold about you." />
            <RightCard title="Right to rectification" desc="You can update or correct inaccurate information in your profile settings." />
            <RightCard title="Right to erasure ('right to be forgotten')" desc="You can delete your account, and we will erase your data within 30 days unless legally required to retain it." />
            <RightCard title="Right to restrict processing" desc="You can ask us to limit how we use your data in certain circumstances." />
            <RightCard title="Right to data portability" desc="You can request your data in a structured, commonly used format." />
            <RightCard title="Right to object" desc="You can object to processing based on legitimate interests or direct marketing." />
            <RightCard title="Right to withdraw consent" desc="Where we rely on consent, you can withdraw it at any time without affecting lawful processing before withdrawal." />
          </div>
        </Section>

        <Section title="4. How to exercise your rights">
          <p className="text-muted-foreground leading-relaxed">
            You can exercise most rights directly in your <Link to="/settings" className="text-primary font-medium">account settings</Link>. For data export, erasure requests, or questions about your rights, email us at <a className="text-primary font-medium" href="mailto:mentor4you.startup@gmail.com">mentor4you.startup@gmail.com</a>. We respond to all requests within 30 days.
          </p>
        </Section>

        <Section title="5. Data transfers">
          <p className="text-muted-foreground leading-relaxed">
            Mentor4You may use service providers located outside the European Economic Area (EEA). When we transfer data internationally, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by the European Commission.
          </p>
        </Section>

        <Section title="6. Data retention">
          <p className="text-muted-foreground leading-relaxed">
            We retain your personal data only as long as necessary for the purposes outlined in our Privacy Policy, or as required by law. Inactive accounts may be anonymized or deleted after a period of inactivity.
          </p>
        </Section>

        <Section title="7. Cookies & tracking technologies">
          <p className="text-muted-foreground leading-relaxed">
            We use essential cookies for platform functionality. Where we use non-essential analytics or preference cookies, we will ask for your consent before placing them. You can manage cookie preferences at any time through your browser settings.
          </p>
        </Section>

        <Section title="8. Complaints">
          <p className="text-muted-foreground leading-relaxed">
            If you believe we have violated your data protection rights, you have the right to lodge a complaint with your local data protection authority.
          </p>
        </Section>

        <Section title="9. Changes to this notice">
          <p className="text-muted-foreground leading-relaxed">
            We may update this compliance notice to reflect changes in our practices or legal requirements. We will notify you of material changes via email or on the platform.
          </p>
        </Section>

        <Section title="10. Contact">
          <p className="text-muted-foreground leading-relaxed">
            Data Protection Officer: <a className="text-primary font-medium" href="mailto:mentor4you.startup@gmail.com">mentor4you.startup@gmail.com</a>
          </p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function RightCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-5 w-5" />
          <span className="font-display font-semibold text-foreground">Mentor4You</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-foreground transition">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition">Terms</Link>
          <Link to="/ip-info" className="hover:text-foreground transition">IP</Link>
          <Link to="/guidelines" className="hover:text-foreground transition">Guidelines</Link>
        </div>
        <div>© {new Date().getFullYear()} Mentor4You</div>
      </div>
    </footer>
  );
}
