export type ProfileLite = {
  id: string;
  full_name: string;
  role: "mentor" | "mentee" | null;
  bio: string;
  location: string;
  experience_level: string;
  hours_per_week: number;
  skills: string[];
  interests: string[];
  goals: string[];
  looking_for_partners: boolean;
  open_to_collab: boolean;
};

const LEVELS = ["beginner", "intermediate", "advanced", "expert"];
const levelIdx = (l: string) => Math.max(0, LEVELS.indexOf((l || "").toLowerCase()));

export type Scored<T extends ProfileLite> = T & {
  score: number; // 0..100
  reasons: string[];
  overlap: { skills: string[]; interests: string[]; goals: string[]; complementary: string[] };
};

/**
 * 0-100 compatibility score considering:
 *  - shared interests (strongest signal of fit)
 *  - shared goals
 *  - complementary skills (mentor has what mentee wants to learn — interests overlap)
 *  - shared skills (great for partners, neutral for mentor↔mentee)
 *  - experience gap (mentor should be ≥1 level higher than mentee)
 *  - availability overlap
 *  - shared location
 */
export function score<T extends ProfileLite>(me: ProfileLite, other: T): Scored<T> {
  const inter = (a: string[], b: string[]) => a.filter((x) => b.includes(x));
  const skills = inter(me.skills, other.skills);
  const interests = inter(me.interests, other.interests);
  const goals = inter(me.goals, other.goals);

  // complementary: things the *other* can teach me (their skills overlapping my interests/goals)
  const complementary = Array.from(new Set([
    ...inter(me.interests, other.skills),
    ...inter(me.goals, other.skills),
  ]));

  let raw = 0;
  const reasons: string[] = [];

  if (interests.length) { raw += interests.length * 8; reasons.push(`${interests.length} shared interest${interests.length > 1 ? "s" : ""}`); }
  if (goals.length)     { raw += goals.length * 7;     reasons.push(`${goals.length} aligned goal${goals.length > 1 ? "s" : ""}`); }
  if (complementary.length) { raw += complementary.length * 9; reasons.push(`Can teach you ${complementary.slice(0, 2).join(", ")}`); }
  if (skills.length)    { raw += skills.length * 4; }

  // experience gap (only meaningful mentor↔mentee)
  if (me.role && other.role && me.role !== other.role) {
    const mentor = me.role === "mentor" ? me : other;
    const mentee = me.role === "mentee" ? me : other;
    const gap = levelIdx(mentor.experience_level) - levelIdx(mentee.experience_level);
    if (gap >= 1) { raw += 10; reasons.push("Right experience gap"); }
    else if (gap < 0) { raw -= 8; }
  }

  // availability overlap (both have at least a few hrs)
  if (me.hours_per_week > 0 && other.hours_per_week > 0) {
    raw += Math.min(8, Math.min(me.hours_per_week, other.hours_per_week));
    reasons.push(`~${Math.min(me.hours_per_week, other.hours_per_week)}h/week available`);
  }

  // location
  if (me.location && other.location && me.location.toLowerCase() === other.location.toLowerCase()) {
    raw += 6; reasons.push("Same city");
  }

  // baseline so even fresh matches show >0
  const score = Math.max(2, Math.min(100, Math.round(20 + raw)));
  return { ...other, score, reasons, overlap: { skills, interests, goals, complementary } };
}

export function rankMatches<T extends ProfileLite>(me: ProfileLite, others: T[], limit = 12): Scored<T>[] {
  return others.map((o) => score(me, o)).sort((a, b) => b.score - a.score).slice(0, limit);
}
