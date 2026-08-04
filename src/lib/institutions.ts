import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export type Institution = {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  logo_url: string;
  cover_url: string;
  website: string;
  description: string;
  location_label: string;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  contact_email: string;
  created_at: string;
};

export type Position = {
  id: string;
  institution_id: string;
  title: string;
  field: string;
  description: string;
  position_type: string;
  location_label: string;
  remote: boolean;
  deadline: string | null;
  apply_url: string;
  tags: string[];
  cover_url: string;
  like_count: number;
  comment_count: number;
  created_at: string;
};

export type PositionWithInstitution = Position & { institution: Institution | null; liked_by_me?: boolean; saved_by_me?: boolean };

export async function fetchPositions(limit = 30): Promise<PositionWithInstitution[]> {
  const { data, error } = await sb.from("institution_positions").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  const positions = (data || []) as Position[];
  if (positions.length === 0) return [];
  const instIds = [...new Set(positions.map((p) => p.institution_id))];
  const { data: insts } = await sb.from("institutions").select("*").in("id", instIds);
  const map = new Map<string, Institution>((insts || []).map((i: any) => [i.id, i]));

  const { data: u } = await supabase.auth.getUser();
  let likedSet = new Set<string>(); let savedSet = new Set<string>();
  if (u.user) {
    const ids = positions.map((p) => p.id);
    const [{ data: likes }, { data: saves }] = await Promise.all([
      sb.from("position_reactions").select("position_id").eq("user_id", u.user.id).eq("kind", "like").in("position_id", ids),
      sb.from("position_saves").select("position_id").eq("user_id", u.user.id).in("position_id", ids),
    ]);
    likedSet = new Set((likes || []).map((r: any) => r.position_id));
    savedSet = new Set((saves || []).map((r: any) => r.position_id));
  }
  return positions.map((p) => ({
    ...p,
    institution: map.get(p.institution_id) || null,
    liked_by_me: likedSet.has(p.id),
    saved_by_me: savedSet.has(p.id),
  }));
}

export async function togglePositionLike(positionId: string): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { data: ex } = await sb.from("position_reactions").select("id").eq("position_id", positionId).eq("user_id", u.user.id).eq("kind", "like").maybeSingle();
  if (ex) { await sb.from("position_reactions").delete().eq("id", ex.id); await sb.rpc("increment_position_counter", { _id: positionId, _col: "like_count", _delta: -1 }).catch(() => {}); return false; }
  await sb.from("position_reactions").insert({ position_id: positionId, user_id: u.user.id, kind: "like" });
  return true;
}

export async function togglePositionSave(positionId: string): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { data: ex } = await sb.from("position_saves").select("id").eq("position_id", positionId).eq("user_id", u.user.id).maybeSingle();
  if (ex) { await sb.from("position_saves").delete().eq("id", ex.id); return false; }
  await sb.from("position_saves").insert({ position_id: positionId, user_id: u.user.id });
  return true;
}

export async function isInstitutionOwner(): Promise<Institution | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await sb.from("institutions").select("*").eq("owner_id", u.user.id).eq("verified", true).maybeSingle();
  return (data as Institution) || null;
}

export async function submitInstitutionApplication(input: { institution_name: string; website: string; contact_email: string; description: string; }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await sb.from("institution_applications").insert({ ...input, user_id: u.user.id });
  if (error) throw error;
}

export async function createPosition(input: { institution_id: string; title: string; field: string; description: string; position_type: string; location_label: string; remote: boolean; deadline: string | null; apply_url: string; tags: string[]; cover_url: string }) {
  const { error } = await sb.from("institution_positions").insert(input);
  if (error) throw error;
}

export async function deletePosition(id: string) {
  const { error } = await sb.from("institution_positions").delete().eq("id", id);
  if (error) throw error;
}

export async function updateInstitution(id: string, patch: Partial<Pick<Institution, "name" | "website" | "description" | "contact_email" | "location_label" | "logo_url" | "cover_url" | "latitude" | "longitude">>) {
  const { error } = await sb.from("institutions").update(patch).eq("id", id);
  if (error) throw error;
}

// ---- Roles / admin review ----

export type InstitutionApplication = {
  id: string;
  user_id: string;
  institution_name: string;
  website: string;
  contact_email: string;
  description: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};

export async function isAdmin(): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data } = await sb.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
  return !!data;
}

/** Application status for the signed-in user (so they can track their request). */
export async function myInstitutionApplication(): Promise<InstitutionApplication | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await sb.from("institution_applications").select("*")
    .eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data as InstitutionApplication) || null;
}

/** Admin only — RLS returns nothing for non-admins. */
export async function listInstitutionApplications(): Promise<InstitutionApplication[]> {
  const { data, error } = await sb.from("institution_applications").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as InstitutionApplication[];
}

export async function approveInstitutionApplication(appId: string) {
  const { error } = await sb.rpc("approve_institution_application", { _app_id: appId });
  if (error) throw error;
}

export async function rejectInstitutionApplication(appId: string) {
  const { error } = await sb.rpc("reject_institution_application", { _app_id: appId });
  if (error) throw error;
}
