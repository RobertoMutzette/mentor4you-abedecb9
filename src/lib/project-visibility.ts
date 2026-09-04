import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export type ShareField =
  | "description"
  | "pitch"
  | "tags"
  | "progress"
  | "funding"
  | "milestones"
  | "links"
  | "location";

export type ShareFields = Record<ShareField, boolean>;

export const SHARE_FIELD_LABELS: { key: ShareField; label: string; hint: string }[] = [
  { key: "description", label: "Description", hint: "What the project is about" },
  { key: "pitch", label: "Pitch", hint: "Your short pitch to partners and funders" },
  { key: "tags", label: "Tags & skills", hint: "Fields, skills you're looking for" },
  { key: "progress", label: "Progress", hint: "Completion percentage and status" },
  { key: "funding", label: "Funding", hint: "Goal and amount raised" },
  { key: "milestones", label: "Milestones", hint: "Roadmap items" },
  { key: "links", label: "Links", hint: "Code and demo links" },
  { key: "location", label: "Location", hint: "Where the project is based" },
];

export const DEFAULT_SHARE_FIELDS: ShareFields = {
  description: true,
  pitch: true,
  tags: true,
  progress: true,
  funding: false,
  milestones: false,
  links: true,
  location: true,
};

export function normalizeShareFields(raw: any): ShareFields {
  const out = { ...DEFAULT_SHARE_FIELDS };
  if (raw && typeof raw === "object") {
    for (const { key } of SHARE_FIELD_LABELS) {
      if (typeof raw[key] === "boolean") out[key] = raw[key];
    }
  }
  return out;
}

export async function publishProject(id: string, shareFields: ShareFields) {
  const { error } = await sb
    .from("projects")
    .update({ visibility: "public", share_fields: shareFields, published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function unpublishProject(id: string) {
  const { error } = await sb.from("projects").update({ visibility: "private" }).eq("id", id);
  if (error) throw error;
}

export async function updateShareFields(id: string, shareFields: ShareFields) {
  const { error } = await sb.from("projects").update({ share_fields: shareFields }).eq("id", id);
  if (error) throw error;
}
