import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPeople, type DiscoverConfig } from "@/components/DiscoverPeople";

export const Route = createFileRoute("/_authenticated/mentors")({
  head: () => ({
    meta: [
      { title: "Find a Mentor — Mentor4You" },
      { name: "description", content: "Get matched with mentors who fit your goals and field — ranked by compatibility and explorable on a map." },
      { property: "og:title", content: "Find a Mentor — Mentor4You" },
      { property: "og:description", content: "Experienced guides ready to help you move your project forward." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MentorsPage,
});

const config: DiscoverConfig = {
  kind: "mentors",
  eyebrow: "Learn faster",
  title: "Find your guide",
  subtitle:
    "Experienced mentors matched to your goals, field and working style. Reach out — get unstuck in days, not months.",
  scoreLabel: "Match",
  searchPlaceholder: "Search name, expertise, field…",
  emptyLabel: "No matches yet — check back soon, or widen your search radius.",
  filter: (me, p) => (me.role === "mentor" ? p.role === "mentee" : p.role === "mentor"),
};

function MentorsPage() {
  return <DiscoverPeople config={config} />;
}
