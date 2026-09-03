import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPeople, type DiscoverConfig } from "@/components/DiscoverPeople";

export const Route = createFileRoute("/_authenticated/partners")({
  head: () => ({
    meta: [
      { title: "Find a Partner — Mentor4You" },
      { name: "description", content: "Find collaborators to build your project with — ranked by shared skills, interests and goals, and explorable on a map." },
      { property: "og:title", content: "Find a Partner — Mentor4You" },
      { property: "og:description", content: "Discover innovators open to collaboration near you and worldwide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartnersPage,
});

const config: DiscoverConfig = {
  kind: "partners",
  eyebrow: "Build together",
  title: "Find your build partner",
  subtitle:
    "Innovators open to collaboration, ranked by how well your skills, interests and goals align. Send a request — start shipping this week.",
  scoreLabel: "Fit",
  searchPlaceholder: "Search name, skill, interest…",
  emptyLabel: "No partners match those filters yet. Try clearing them, or invite friends to join.",
  filter: (_me, p) =>
    (p.role === "mentee" && p.looking_for_partners) || (p.role === "mentor" && p.open_to_collab),
};

function PartnersPage() {
  return <DiscoverPeople config={config} />;
}
