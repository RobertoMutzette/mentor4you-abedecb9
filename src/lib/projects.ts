import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "./notifications";

export async function inviteToProject(projectId: string, toUser: string, message = "") {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase.from("project_invites").insert({
    project_id: projectId, from_user: u.user.id, to_user: toUser, message,
  });
  if (error && !/duplicate/i.test(error.message)) throw error;
  await createNotification({
    user_id: toUser, type: "project_invite",
    title: "You've been invited to a project",
    body: message || "Open to view the invitation.",
    link: `/project/${projectId}`,
    data: { project_id: projectId },
  });
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  const { data: invite } = await supabase.from("project_invites").select("*").eq("id", inviteId).maybeSingle();
  if (!invite) throw new Error("Invite not found");
  await supabase.from("project_invites").update({ status: accept ? "accepted" : "declined", updated_at: new Date().toISOString() }).eq("id", inviteId);
  if (accept) {
    await supabase.from("project_members").insert({ project_id: invite.project_id, user_id: invite.to_user, role: "member" });
    await createNotification({
      user_id: invite.from_user, type: "invite_accepted",
      title: "Your project invite was accepted",
      link: `/project/${invite.project_id}`,
      data: { project_id: invite.project_id },
    });
  }
}

export async function leaveProject(projectId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", u.user.id);
}

export async function postComment(projectId: string, body: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase.from("project_comments").insert({ project_id: projectId, user_id: u.user.id, body });
  if (error) throw error;
}

export async function postUpdate(projectId: string, title: string, body: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase.from("project_updates").insert({ project_id: projectId, user_id: u.user.id, title, body });
  if (error) throw error;
}
