import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Who we are — Mentor4You" },
      {
        name: "description",
        content:
          "Mentor4You exists so brilliant minds anywhere — especially in the most disadvantaged places — can find the partner, mentor, visibility or funding their idea needs.",
      },
      { property: "og:title", content: "Who we are — Mentor4You" },
      {
        property: "og:description",
        content:
          "Innovation should happen wherever it is capable of happening, not only where the resources already are.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-7 w-7" />
            <span className="font-display font-bold tracking-tight">
              Mentor<span className="text-primary">4</span>You
            </span>
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium">Who we are</p>
        <h1 className="mt-3 font-display font-bold text-[clamp(2rem,5vw,3.25rem)] leading-[1.1] tracking-tight text-balance">
          Talent is everywhere. Opportunity is not.
        </h1>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-foreground/90">
          <p>
            All over the world there are extremely capable kids who never get the chance to develop
            their potential — not because their idea isn't good enough, but because they lack the
            skills, knowledge, partnership or mentorship to take it anywhere.
          </p>
          <p>
            Somewhere out there might be a kid who has already thought his way toward a cure for
            cancer, but he needs a mentor, a partner, visibility or funding — and none of that is
            reachable from where he's standing.
          </p>
          <p>
            This isn't a platform for young entrepreneurs only. It's especially for the ones coming
            from the most disadvantaged places, who have nothing but their mind and a brilliant
            idea.
          </p>
          <p className="font-display font-semibold text-foreground">
            The goal underneath it isn't to create businesses. It's to create innovation and
            technological advancement wherever it's capable of happening — not just where the
            resources already are.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Find a partner", d: "Build with someone whose skills complete yours." },
            { t: "Find a mentor", d: "Borrow the experience you don't have yet." },
            { t: "Get seen", d: "Share your project with institutions and funders." },
          ].map((c) => (
            <div key={c.t} className="rounded-3xl border border-border p-5">
              <div className="font-display font-bold">{c.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Join Mentor4You
          </Link>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 rounded-full border border-border font-medium hover:bg-secondary transition"
          >
            Back home
          </Link>
        </div>
      </main>
    </div>
  );
}
