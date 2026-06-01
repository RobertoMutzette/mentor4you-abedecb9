import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { ArrowUpRight, Compass, Sparkles, Users2, Rocket, MessageSquare, Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mentor4You — Where mentorship meets momentum" },
      { name: "description", content: "Find a mentor, join a project, and ship your first real thing. Mentor4You is the platform for ambitious young builders." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Marquee />
      <How />
      <Pillars />
      <Projects />
      <Opportunities />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Mentor4You" className="h-8 w-8" />
          <span className="font-display font-bold text-lg tracking-tight">Mentor4You</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#pillars" className="hover:text-foreground transition">Platform</a>
          <a href="#projects" className="hover:text-foreground transition">Projects</a>
          <a href="#opportunities" className="hover:text-foreground transition">Opportunities</a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-full hover:bg-secondary transition">
            Sign in
          </button>
          <button className="inline-flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
            Get started <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grain opacity-40" />
      <div className="absolute -z-10 top-20 -right-32 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -z-10 -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-32 md:pb-32 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Now matching the class of 2026
          </div>
          <h1 className="mt-6 font-display font-bold text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-tight text-balance">
            Where mentorship<br />
            meets <span className="text-primary italic">momentum</span>.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl text-balance">
            Mentor4You pairs ambitious young people with mentors who've done it, and teammates who want to build it. From raw idea to shipped project — in one place.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-medium hover:shadow-glow transition-all">
              I'm a mentee
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-ink text-cream font-medium hover:opacity-90 transition" style={{ backgroundColor: "var(--ink)", color: "var(--cream)" }}>
              I want to mentor
            </button>
          </div>
          <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {["#0000FF", "#1a1a1a", "#f5e6c8", "#0000FF"].map((c, i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-background" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>2,400+ builders already onboarded</span>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="relative aspect-square max-w-md mx-auto">
            <div className="absolute inset-0 rounded-3xl bg-primary/5 border border-border float-slow" />
            <div className="absolute top-6 right-6 w-56 rounded-2xl bg-card border border-border p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">New match</div>
                  <div className="text-sm font-semibold">Léa · Product designer</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">95% interest overlap · Paris</div>
            </div>
            <div className="absolute bottom-10 left-4 w-64 rounded-2xl bg-ink p-5 shadow-card" style={{ backgroundColor: "var(--ink)" }}>
              <div className="text-xs text-cream/60" style={{ color: "color-mix(in oklab, var(--cream) 60%, transparent)" }}>Project</div>
              <div className="mt-1 font-display font-semibold text-cream" style={{ color: "var(--cream)" }}>Climate-tech weekend build</div>
              <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "color-mix(in oklab, var(--cream) 70%, transparent)" }}>
                <Users2 className="h-3.5 w-3.5" /> 4 of 6 spots filled
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-primary flex items-center justify-center shadow-glow">
              <img src={logo} alt="" className="h-16 w-16 brightness-0 invert" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Product design", "Climate tech", "AI research", "Startup founding", "Finance", "Robotics", "Music tech", "Biotech", "Policy", "Game dev"];
  return (
    <div className="border-y border-border bg-cream overflow-hidden py-5" style={{ backgroundColor: "var(--cream)" }}>
      <div className="flex marquee whitespace-nowrap">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="mx-8 font-display text-2xl md:text-3xl font-medium text-ink/80" style={{ color: "color-mix(in oklab, var(--ink) 80%, transparent)" }}>
            {t} <span className="text-primary mx-2">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function How() {
  const steps = [
    { n: "01", title: "Tell us who you are", body: "Mentee or mentor — share your goals, skills, and the fields you want to grow in." },
    { n: "02", title: "Get matched", body: "Our matching engine finds mentors and collaborators aligned with your ambition." },
    { n: "03", title: "Build something real", body: "Spin up a project, invite teammates, and move from idea to launch with structure." },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
        <div>
          <div className="text-sm font-medium text-primary">How it works</div>
          <h2 className="mt-2 font-display font-bold text-4xl md:text-6xl tracking-tight max-w-2xl text-balance">
            Three steps. From scattered ideas to shipping.
          </h2>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((s) => (
          <div key={s.n} className="group relative rounded-3xl bg-card border border-border p-8 hover:border-primary/40 hover:shadow-card transition-all">
            <div className="font-display text-7xl font-bold text-primary/15 group-hover:text-primary/30 transition">{s.n}</div>
            <h3 className="mt-4 font-display text-2xl font-semibold">{s.title}</h3>
            <p className="mt-3 text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pillars() {
  const items = [
    { icon: Compass, title: "Smart matchmaking", body: "Compatibility scores based on goals, fields, and stage — not just keywords." },
    { icon: MessageSquare, title: "Private mentor space", body: "Direct messaging with structured check-ins to keep momentum between sessions." },
    { icon: Rocket, title: "Project workspaces", body: "Public or private rooms with roles, milestones, and a member feed." },
    { icon: Search, title: "Discovery", body: "Filter mentors, mentees, and projects by interest, skill, location, or goal." },
  ];
  return (
    <section id="pillars" className="bg-secondary/40 border-y border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <div className="text-sm font-medium text-primary">The platform</div>
          <h2 className="mt-2 font-display font-bold text-4xl md:text-5xl tracking-tight text-balance">
            One ecosystem for the journey.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Everything mentees and mentors need — connection, collaboration, and a place to ship — without juggling six tools.
          </p>
        </div>
        <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl bg-card border border-border p-7 hover:-translate-y-1 transition-transform">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <it.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Projects() {
  const sample = [
    { tag: "Climate", title: "Urban heat mapping with cheap sensors", spots: "3 of 5", skills: ["Hardware", "Data viz", "Field research"] },
    { tag: "AI", title: "Studyflow — an AI study companion for teens", spots: "2 of 4", skills: ["React", "LLMs", "UX writing"] },
    { tag: "Social", title: "Mentor circles for first-gen students", spots: "5 of 8", skills: ["Community", "Ops", "Content"] },
  ];
  return (
    <section id="projects" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="flex items-end justify-between gap-6 mb-12">
        <div>
          <div className="text-sm font-medium text-primary">Live projects</div>
          <h2 className="mt-2 font-display font-bold text-4xl md:text-5xl tracking-tight">Join a build this weekend.</h2>
        </div>
        <button className="hidden md:inline-flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-full border border-border hover:bg-secondary transition">
          Browse all <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {sample.map((p, i) => (
          <article key={i} className="group rounded-3xl border border-border bg-card p-7 flex flex-col hover:border-primary/50 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider uppercase text-primary">{p.tag}</span>
              <span className="text-xs text-muted-foreground">{p.spots} spots</span>
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold leading-snug">{p.title}</h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{s}</span>
              ))}
            </div>
            <button className="mt-7 inline-flex items-center justify-between text-sm font-medium pt-5 border-t border-border group-hover:text-primary transition">
              Request to join <ArrowUpRight className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Opportunities() {
  return (
    <section id="opportunities" className="mx-auto max-w-7xl px-6 pb-24 md:pb-32">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink p-10 md:p-16" style={{ backgroundColor: "var(--ink)" }}>
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-sm font-medium text-primary">Opportunities</div>
            <h2 className="mt-2 font-display font-bold text-4xl md:text-5xl tracking-tight text-cream text-balance" style={{ color: "var(--cream)" }}>
              Internships, grants, hackathons — surfaced by people who care.
            </h2>
            <p className="mt-4 text-lg max-w-lg" style={{ color: "color-mix(in oklab, var(--cream) 75%, transparent)" }}>
              Universities, companies, and NGOs post real opportunities. Your match algorithm bubbles up the ones built for you.
            </p>
            <button className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
              Explore opportunities <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { org: "TUM Innovation Lab", role: "Spring research fellow", tag: "Fellowship" },
              { org: "Atlas Ventures", role: "Pre-seed scout (part-time)", tag: "Paid" },
              { org: "Open Climate NGO", role: "Volunteer data engineer", tag: "Volunteer" },
            ].map((o, i) => (
              <div key={i} className="rounded-2xl bg-cream/5 border border-cream/10 p-5 flex items-center justify-between hover:bg-cream/10 transition cursor-pointer" style={{ borderColor: "color-mix(in oklab, var(--cream) 10%, transparent)" }}>
                <div>
                  <div className="text-xs uppercase tracking-wider text-primary font-semibold">{o.tag}</div>
                  <div className="mt-1 font-display text-lg font-semibold" style={{ color: "var(--cream)" }}>{o.role}</div>
                  <div className="text-sm" style={{ color: "color-mix(in oklab, var(--cream) 60%, transparent)" }}>{o.org}</div>
                </div>
                <ArrowUpRight className="h-5 w-5" style={{ color: "var(--cream)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 md:pb-32">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="font-display font-bold text-5xl md:text-7xl tracking-tight text-balance">
          The hardest part is starting. <span className="text-primary italic">We make it easy.</span>
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:shadow-glow transition">
            Create your profile <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-7 w-7" />
          <span className="font-display font-semibold">Mentor4You</span>
        </div>
        <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} Mentor4You. Built for the next generation of builders.</div>
      </div>
    </footer>
  );
}
