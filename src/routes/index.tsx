import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mentor4You — Find your build partner" },
      { name: "description", content: "Find a partner to build with, join a project, and ship your first real thing. Mentorship optional, momentum guaranteed." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav />
      <Hero />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-full hover:bg-secondary transition">
            Sign in
          </Link>
          <Link to="/signup" className="inline-flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grain opacity-40" />
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/8 blur-3xl" />

      <div className="flex flex-col items-center">
        <div className="h-32 w-32 md:h-40 md:w-40 mb-8 animate-fade-in">
          <img src={logo} alt="Mentor4You" className="h-full w-full object-contain" />
        </div>

        <h1 className="font-display font-bold text-[clamp(2.5rem,6vw,4.5rem)] tracking-tight leading-[1.1] text-balance">
          Mentor4You
        </h1>

        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-lg text-balance">
          Find a build partner who complements your skills — then ship real projects together. Mentors welcome too.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm sm:max-w-none">
          <Link
            to="/signup"
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:shadow-glow transition-all"
          >
            Find a partner
          </Link>
          <Link
            to="/signup"
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-ink text-cream font-medium text-lg hover:opacity-90 transition"
          >
            I want to mentor
          </Link>
        </div>

        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>Free to join — start in under a minute</span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-5 w-5" />
          <span className="font-display font-semibold text-foreground">Mentor4You</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-foreground transition">Privacy</Link>
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
