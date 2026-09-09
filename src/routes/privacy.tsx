import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy — Mentor4You" },
    { name: "description", content: "How Mentor4You collects, uses, and protects your personal data." },
  ] }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-muted-foreground">Effective date: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <Section title="1. What we collect">
          <p className="text-muted-foreground leading-relaxed">
            We collect information you provide directly: name, email, profile details, bio, education, experience, mentorship topics, social links, and the media you upload — profile photos, cover images, project images and videos, and verification documents. Uploaded files are stored in private storage and served through short-lived signed links; files may carry technical metadata (size, format, duration) that we retain with the file. We also collect usage data such as log-ins, feature usage, connection requests, messages, posts, and project interactions to improve the platform. We do not use face recognition on your photos or videos, and we do not use your media to train AI models.
          </p>
        </Section>

        <Section title="2. How we use your data">
          <ul className="mt-2 list-disc list-inside text-muted-foreground leading-relaxed space-y-1">
            <li>To match you with mentors, mentees, and collaborators</li>
            <li>To enable messaging, posts, comments, and project collaboration</li>
            <li>To send notifications and relevant updates</li>
            <li>To maintain trust and safety (spam detection, abuse prevention)</li>
            <li>To improve features and fix bugs</li>
          </ul>
        </Section>

        <Section title="3. Data sharing">
          <p className="text-muted-foreground leading-relaxed">
            We do not sell your personal data. Your profile is visible to other members according to your privacy settings. We share data only with service providers who help us operate the platform (hosting, analytics, email delivery) under strict confidentiality agreements. We may disclose data if required by law.
          </p>
        </Section>

        <Section title="4. Cookies & tracking">
          <p className="text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and session management. We may use analytics cookies to understand how the platform is used. You can control non-essential cookies through your browser settings.
          </p>
        </Section>

        <Section title="5. Data retention">
          <p className="text-muted-foreground leading-relaxed">
            We keep your data as long as your account is active. If you delete your account, we remove your profile and content within 30 days, except where we are legally required to retain data (e.g., for safety or tax records).
          </p>
        </Section>

        <Section title="6. Security">
          <p className="text-muted-foreground leading-relaxed">
            We use industry-standard security measures including encryption in transit (TLS), encrypted passwords, row-level security on our database, and regular security reviews. No system is 100% secure, and we encourage you to use strong, unique passwords.
          </p>
        </Section>

        <Section title="7. Children's privacy">
          <p className="text-muted-foreground leading-relaxed">
            Mentor4You is not directed at children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal data, contact us immediately.
          </p>
        </Section>

        <Section title="8. Changes to this policy">
          <p className="text-muted-foreground leading-relaxed">
            We may update this policy from time to time. We will notify you of significant changes via email or a notice on the platform. Continued use after changes means you accept the updated policy.
          </p>
        </Section>

        <Section title="9. Contact us">
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy or your data rights, contact us at <a className="text-primary font-medium" href="mailto:mentor4you.startup@gmail.com">mentor4you.startup@gmail.com</a>.
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
          <Link to="/terms" className="hover:text-foreground transition">Terms</Link>
          <Link to="/gdpr" className="hover:text-foreground transition">GDPR</Link>
          <Link to="/ip-info" className="hover:text-foreground transition">IP</Link>
          <Link to="/guidelines" className="hover:text-foreground transition">Guidelines</Link>
        </div>
        <div>© {new Date().getFullYear()} Mentor4You</div>
      </div>
    </footer>
  );
}
