export type ProfileLite = {
  id: string;
  full_name: string;
  role: "mentor" | "mentee" | null;
  bio: string;
  headline?: string;
  avatar_url?: string;
  location: string;
  experience_level: string;
  hours_per_week: number;
  skills: string[];
  interests: string[];
  goals: string[];
  industries?: string[];
  project_preferences?: string[];
  looking_for_partners: boolean;
  open_to_collab: boolean;
  // v2
  age_range?: string;
  communication_style?: string;
  personality?: string[];
  meeting_frequency?: string;
  learning_style?: string;
  response_time?: string;
  timezone?: string;
};

const LEVELS = ["student", "early career (0–3 yrs)", "mid-career (3–8 yrs)", "senior (8+ yrs)"];
const levelIdx = (l: string) => Math.max(0, LEVELS.indexOf((l || "").toLowerCase()));

export type Scored<T extends ProfileLite> = T & {
  score: number;
  reasons: string[];
  overlap: { skills: string[]; interests: string[]; goals: string[]; industries: string[]; complementary: string[] };
};

const inter = (a: string[] = [], b: string[] = []) => a.filter((x) => b.includes(x));
const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

export function score<T extends ProfileLite>(me: ProfileLite, other: T): Scored<T> {
  const skills = inter(me.skills, other.skills);
  const interests = inter(me.interests, other.interests);
  const goals = inter(me.goals, other.goals);
  const industries = inter(me.industries, other.industries);
  const prefs = inter(me.project_preferences, other.project_preferences);
  const personality = inter(me.personality, other.personality);

  const complementary = Array.from(new Set([
    ...inter(me.interests, other.skills),
    ...inter(me.goals, other.skills),
  ]));

  let raw = 0;
  const reasons: string[] = [];

  if (interests.length)    { raw += interests.length * 7;    reasons.push(`${interests.length} shared interest${interests.length > 1 ? "s" : ""}`); }
  if (industries.length)   { raw += industries.length * 8;   reasons.push(`Both into ${industries.slice(0, 2).join(", ")}`); }
  if (goals.length)        { raw += goals.length * 6;        reasons.push(`${goals.length} aligned goal${goals.length > 1 ? "s" : ""}`); }
  if (complementary.length){ raw += complementary.length * 9; reasons.push(`Can teach you ${complementary.slice(0, 2).join(", ")}`); }
  if (prefs.length)        { raw += prefs.length * 5;        reasons.push(`Same project style`); }
  if (skills.length)       { raw += skills.length * 3; }
  if (personality.length)  { raw += personality.length * 4;  reasons.push(`Similar working style`); }

  if (same(me.communication_style, other.communication_style)) { raw += 5; reasons.push("Matching communication style"); }
  if (same(me.meeting_frequency, other.meeting_frequency))     { raw += 4; reasons.push("Same meeting rhythm"); }
  if (same(me.timezone, other.timezone))                       { raw += 4; reasons.push("Same timezone"); }
  if (same(me.response_time, other.response_time))             { raw += 2; }

  if (me.role && other.role && me.role !== other.role) {
    const mentor = me.role === "mentor" ? me : other;
    const mentee = me.role === "mentee" ? me : other;
    const gap = levelIdx(mentor.experience_level) - levelIdx(mentee.experience_level);
    if (gap >= 1) { raw += 10; reasons.push("Right experience gap"); }
    else if (gap < 0) { raw -= 8; }
  }

  if (me.hours_per_week > 0 && other.hours_per_week > 0) {
    raw += Math.min(8, Math.min(me.hours_per_week, other.hours_per_week));
  }

  if (me.location && other.location && me.location.toLowerCase() === other.location.toLowerCase()) {
    raw += 6; reasons.push("Same city");
  }

  const finalScore = Math.max(2, Math.min(100, Math.round(20 + raw)));
  return { ...other, score: finalScore, reasons, overlap: { skills, interests, goals, industries, complementary } };
}

export function rankMatches<T extends ProfileLite>(me: ProfileLite, others: T[], limit = 12): Scored<T>[] {
  return others.map((o) => score(me, o)).sort((a, b) => b.score - a.score).slice(0, limit);
}
