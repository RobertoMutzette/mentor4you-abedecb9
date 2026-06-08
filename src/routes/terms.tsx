import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Terms of Service — Mentor4You" },
    { name: "description", content: "The rules and conditions for using Mentor4You." },
  ] }),
  component: TermsPage,
});

function TermsPage() {
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
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-muted-foreground">Effective date: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <Section title="1. Acceptance of terms">
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using Mentor4You, you agree to be bound by these Terms of Service and our Community Guidelines. If you do not agree, do not use the platform. We may update these terms at any time; continued use constitutes acceptance of changes.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p className="text-muted-foreground leading-relaxed">
            You must be at least 13 years old to use Mentor4You. If you are under 18, you represent that you have parental or guardian consent. You must provide accurate, current, and complete information when creating an account.
          </p>
        </Section>

        <Section title="3. Your account">
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </Section>

        <Section title="4. User conduct">
          <p className="text-muted-foreground leading-relaxed">
            You agree not to:
          </p>
          <ul className="mt-2 list-disc list-inside text-muted-foreground leading-relaxed space-y-1">
            <li>Impersonate any person or misrepresent your identity or qualifications</li>
            <li>Harass, abuse, or discriminate against other users</li>
            <li>Post illegal, harmful, defamatory, or sexually explicit content</li>
            <li>Engage in spam, scams, phishing, or unauthorized commercial solicitation</li>
            <li>Attempt to access accounts, data, or systems you are not authorized to use</li>
            <li>Use automated means (bots, scrapers) to access the platform without permission</li>
          </ul>
        </Section>

        <Section title="5. Content you post">
          <p className="text-muted-foreground leading-relaxed">
            You retain ownership of content you post. By posting, you grant Mentor4You a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on the platform for the purpose of operating and improving the service. You represent that you have the right to share any content you post.
          </p>
        </Section>

        <Section title="6. Mentorship disclaimer">
          <p className="text-muted-foreground leading-relaxed">
            Mentor4You is a connection platform, not a professional services firm. We do not guarantee outcomes from mentorship relationships. Mentors are not employees or agents of Mentor4You. Use your own judgment and conduct appropriate due diligence before entering any paid or high-stakes arrangement.
          </p>
        </Section>

        <Section title="7. Termination">
          <p className="text-muted-foreground leading-relaxed">
            You may delete your account at any time through your settings. We may suspend or terminate your access if you violate these terms, with or without notice. Upon termination, your license to use the platform ends, and we may delete your data in accordance with our Privacy Policy.
          </p>
        </Section>

        <Section title="8. Limitation of liability">
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, Mentor4You and its affiliates are not liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the platform. Our total liability for any claim is limited to the amount you paid us in the 12 months preceding the claim, or $100 if you paid nothing.
          </p>
        </Section>

        <Section title="9. Governing law">
          <p className="text-muted-foreground leading-relaxed">
            These terms are governed by the laws of the jurisdiction in which Mentor4You is registered, without regard to conflict of law principles. Disputes will be resolved through binding arbitration, except where prohibited by law.
          </p>
        </Section>

        <Section title="10. Contact us">
          <p className="text-muted-foreground leading-relaxed">
            For questions about these terms, contact <a className="text-primary font-medium" href="mailto:legal@mentor4you.app">legal@mentor4you.app</a>.
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
          <Link to="/gdpr" className="hover:text-foreground transition">GDPR</Link>
          <Link to="/ip-info" className="hover:text-foreground transition">IP</Link>
          <Link to="/guidelines" className="hover:text-foreground transition">Guidelines</Link>
        </div>
        <div>© {new Date().getFullYear()} Mentor4You</div>
      </div>
    </footer>
  );
}
