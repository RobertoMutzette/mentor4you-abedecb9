import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/ip-info")({
  head: () => ({ meta: [
    { title: "Intellectual Property — Mentor4You" },
    { name: "description", content: "How Mentor4You handles copyright, trademarks, and intellectual property." },
  ] }),
  component: IpInfoPage,
});

function IpInfoPage() {
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
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Intellectual Property</h1>
        <p className="mt-3 text-muted-foreground">How we handle copyrights, trademarks, and user-generated content.</p>

        <Section title="1. Mentor4You ownership">
          <p className="text-muted-foreground leading-relaxed">
            The Mentor4You name, logo, brand assets, platform code, design, and all original content created by Mentor4You are the property of Mentor4You and protected by copyright, trademark, and other intellectual property laws. You may not use our brand assets without prior written permission.
          </p>
        </Section>

        <Section title="2. User-generated content">
          <p className="text-muted-foreground leading-relaxed">
            You retain ownership of the content you create and post on Mentor4You, including profile information, posts, comments, messages, and project contributions. By posting content, you grant Mentor4You a limited license to host, display, and distribute that content solely for the purpose of operating and improving the platform.
          </p>
        </Section>

        <Section title="3. Copyright policy & DMCA">
          <p className="text-muted-foreground leading-relaxed">
            We respect the intellectual property rights of others. If you believe content on Mentor4You infringes your copyright, you may submit a DMCA takedown notice to <a className="text-primary font-medium" href="mailto:mentor4you.startup@gmail.com">mentor4you.startup@gmail.com</a>. Your notice must include:
          </p>
          <ul className="mt-2 list-disc list-inside text-muted-foreground leading-relaxed space-y-1">
            <li>A physical or electronic signature of the copyright owner or authorized agent</li>
            <li>Identification of the copyrighted work claimed to be infringed</li>
            <li>Identification of the infringing material and its location on the platform</li>
            <li>Your contact information (address, phone, email)</li>
            <li>A statement that you have a good-faith belief the use is not authorized</li>
            <li>A statement that the information is accurate, under penalty of perjury</li>
          </ul>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We will respond to valid notices promptly and may terminate repeat infringers.
          </p>
        </Section>

        <Section title="4. Trademark policy">
          <p className="text-muted-foreground leading-relaxed">
            Mentor4You, the Mentor4You logo, and related marks are trademarks of Mentor4You. Other trademarks displayed on the platform belong to their respective owners. Use of any trademark without permission is prohibited.
          </p>
        </Section>

        <Section title="5. Licenses & open source">
          <p className="text-muted-foreground leading-relaxed">
            Mentor4You may use open-source software and libraries licensed under terms such as MIT, Apache 2.0, or similar. Such third-party software remains subject to its original license terms. Mentor4You's own platform code and proprietary content are not open source unless explicitly stated.
          </p>
        </Section>

        <Section title="6. Project IP & collaboration">
          <p className="text-muted-foreground leading-relaxed">
            When users collaborate on projects through Mentor4You, intellectual property ownership is determined by the collaborators. Mentor4You does not claim ownership of project ideas, code, designs, or outputs created by users. We recommend collaborators agree on IP ownership, licensing, and revenue sharing before beginning work together.
          </p>
        </Section>

        <Section title="7. Counter-notices">
          <p className="text-muted-foreground leading-relaxed">
            If your content was removed due to a copyright complaint and you believe it was a mistake or misidentification, you may submit a counter-notice to <a className="text-primary font-medium" href="mailto:mentor4you.startup@gmail.com">mentor4you.startup@gmail.com</a> with the required statutory information.
          </p>
        </Section>

        <Section title="8. Contact">
          <p className="text-muted-foreground leading-relaxed">
            For IP-related questions, contact <a className="text-primary font-medium" href="mailto:mentor4you.startup@gmail.com">mentor4you.startup@gmail.com</a>.
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
          <Link to="/terms" className="hover:text-foreground transition">Terms</Link>
          <Link to="/gdpr" className="hover:text-foreground transition">GDPR</Link>
          <Link to="/guidelines" className="hover:text-foreground transition">Guidelines</Link>
        </div>
        <div>© {new Date().getFullYear()} Mentor4You</div>
      </div>
    </footer>
  );
}
