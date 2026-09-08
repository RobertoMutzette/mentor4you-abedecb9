import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export type PostKind = "update" | "question" | "video" | "milestone" | "launch";

export const POST_KINDS: { key: PostKind; label: string; hint: string }[] = [
  { key: "update", label: "Update", hint: "Progress, news, what changed" },
  { key: "video", label: "Video", hint: "Present yourself or the idea on camera" },
  { key: "question", label: "Ask", hint: "Get suggestions or feedback" },
  { key: "milestone", label: "Milestone", hint: "Something big you reached" },
  { key: "launch", label: "Launch", hint: "You're going live" },
];

export type Post = {
  id: string;
  author_id: string;
  body: string;
  media_urls: string[];
  media_types: string[];
  post_kind: PostKind;
  repost_of: string | null;
  project_id: string | null;
  mention_user_ids: string[];
  hashtags: string[];
  reaction_count: number;
  comment_count: number;
  repost_count: number;
  created_at: string;
};

export type PostProject = {
  id: string;
  title: string;
  description: string;
  status: string;
  completion_percentage: number;
  tags: string[];
  cover_image_url: string;
  pitch: string;
  funding_goal: number;
  funding_raised: number;
  milestones: any;
  github_url: string;
  demo_url: string;
  location_label: string;
  skills_needed: string[];
  visibility: string;
  share_fields: any;
};

export const PROJECT_SELECT =
  "id, title, description, status, completion_percentage, tags, cover_image_url, pitch, funding_goal, funding_raised, milestones, github_url, demo_url, location_label, skills_needed, visibility, share_fields";

export type PostWithAuthor = Post & {
  author: { id: string; full_name: string; avatar_url: string; headline: string } | null;
  repost?: PostWithAuthor | null;
  project?: PostProject | null;
  liked_by_me?: boolean;
};

export function extractHashtags(body: string): string[] {
  const m = body.match(/(?:^|\s)#([a-zA-Z0-9_]{2,30})/g) || [];
  return [...new Set(m.map((s) => s.trim().slice(1).toLowerCase()))];
}

export function extractMentionHandles(body: string): string[] {
  const m = body.match(/(?:^|\s)@([a-zA-Z0-9_]{2,40})/g) || [];
  return [...new Set(m.map((s) => s.trim().slice(1).toLowerCase()))];
}

async function resolveMentionUserIds(handles: string[]): Promise<string[]> {
  if (handles.length === 0) return [];
  // Best-effort: match by lowercased full_name token. Schema has no username yet.
  const { data } = await sb.from("profiles").select("id, full_name").limit(500);
  if (!data) return [];
  const set = new Set(handles);
  return data
    .filter((p: any) => {
      const slug = (p.full_name || "").toLowerCase().replace(/\s+/g, "");
      return set.has(slug);
    })
    .map((p: any) => p.id);
}

/** Map a raw DB row onto the client-side Post shape. */
function normalize(row: any): Post {
  return {
    id: row.id,
    author_id: row.author_id,
    body: row.body ?? "",
    media_urls: row.media_paths ?? [],
    media_types: row.media_types ?? [],
    post_kind: (row.post_kind ?? "update") as PostKind,
    repost_of: row.repost_of ?? null,
    project_id: row.project_id ?? null,
    mention_user_ids: row.mentions ?? [],
    hashtags: row.hashtags ?? [],
    reaction_count: 0,
    comment_count: 0,
    repost_count: 0,
    created_at: row.created_at,
  };
}

export async function createPost(input: {
  body: string;
  media_urls?: string[];
  repost_of?: string | null;
  project_id?: string | null;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const hashtags = extractHashtags(input.body);
  const handles = extractMentionHandles(input.body);
  const mentions = await resolveMentionUserIds(handles);
  const { data, error } = await sb.from("posts").insert({
    author_id: u.user.id,
    body: input.body,
    media_paths: input.media_urls ?? [],
    repost_of: input.repost_of ?? null,
    project_id: input.project_id ?? null,
    hashtags,
    mentions,
  }).select("*").single();
  if (error) throw error;

  // Notify mentioned users (best-effort, via SECURITY DEFINER fn)
  await Promise.all(mentions.filter((id) => id !== u.user!.id).map((id) =>
    sb.rpc("create_notification", {
      _user_id: id, _type: "mention", _title: "You were mentioned",
      _body: input.body.slice(0, 140), _link: "/feed", _data: { post_id: data.id },
    })
  ));

  // Notify original author on repost
  if (input.repost_of) {
    const { data: orig } = await sb.from("posts").select("author_id").eq("id", input.repost_of).maybeSingle();
    if (orig && orig.author_id !== u.user.id) {
      await sb.rpc("create_notification", {
        _user_id: orig.author_id, _type: "repost", _title: "Your post was reshared",
        _body: input.body.slice(0, 140), _link: "/feed", _data: { post_id: data.id },
      });
    }
  }
  return normalize(data);
}

export async function deletePost(id: string) {
  const { error } = await sb.from("posts").delete().eq("id", id);
  if (error) throw error;
}

async function attachCounts(posts: Post[]): Promise<Post[]> {
  const ids = posts.map((p) => p.id);
  if (ids.length === 0) return posts;
  const [{ data: reactions }, { data: comments }, { data: reposts }] = await Promise.all([
    sb.from("post_reactions").select("post_id").in("post_id", ids),
    sb.from("post_comments_social").select("post_id").in("post_id", ids),
    sb.from("posts").select("repost_of").in("repost_of", ids),
  ]);
  const tally = (rows: any[] | null, key: string) => {
    const m = new Map<string, number>();
    for (const r of rows || []) m.set(r[key], (m.get(r[key]) ?? 0) + 1);
    return m;
  };
  const rc = tally(reactions, "post_id");
  const cc = tally(comments, "post_id");
  const pc = tally(reposts, "repost_of");
  return posts.map((p) => ({
    ...p,
    reaction_count: rc.get(p.id) ?? 0,
    comment_count: cc.get(p.id) ?? 0,
    repost_count: pc.get(p.id) ?? 0,
  }));
}

async function attachAuthors(rows: any[]): Promise<PostWithAuthor[]> {
  if (rows.length === 0) return [];
  const posts = await attachCounts(rows.map(normalize));
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const repostIds = posts.map((p) => p.repost_of).filter(Boolean) as string[];
  const projectIds = [...new Set(posts.map((p) => p.project_id).filter(Boolean))] as string[];

  const { data: profiles } = await sb.from("profiles")
    .select("id, full_name, avatar_url, headline").in("id", authorIds);
  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

  let projectMap = new Map<string, PostProject>();
  if (projectIds.length > 0) {
    const { data: projects } = await sb.from("projects")
      .select(PROJECT_SELECT)
      .in("id", projectIds);
    projectMap = new Map((projects || []).map((p: any) => [p.id, p as PostProject]));
  }

  let repostMap = new Map<string, PostWithAuthor>();
  if (repostIds.length > 0) {
    const { data: reposts } = await sb.from("posts").select("*").in("id", repostIds);
    if (reposts) {
      const inner = await attachAuthorsLite(reposts);
      repostMap = new Map(inner.map((p) => [p.id, p]));
    }
  }

  const { data: u } = await supabase.auth.getUser();
  let likedSet = new Set<string>();
  if (u.user) {
    const { data: likes } = await sb.from("post_reactions").select("post_id")
      .eq("user_id", u.user.id).in("post_id", posts.map((p) => p.id));
    likedSet = new Set((likes || []).map((l: any) => l.post_id));
  }

  return posts.map((p) => ({
    ...p,
    author: profileMap.get(p.author_id) || null,
    repost: p.repost_of ? repostMap.get(p.repost_of) || null : null,
    project: p.project_id ? projectMap.get(p.project_id) || null : null,
    liked_by_me: likedSet.has(p.id),
  }));
}

async function attachAuthorsLite(rows: any[]): Promise<PostWithAuthor[]> {
  const posts = rows.map(normalize);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const { data: profiles } = await sb.from("profiles")
    .select("id, full_name, avatar_url, headline").in("id", authorIds);
  const map = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
  return posts.map((p) => ({ ...p, author: map.get(p.author_id) || null }));
}

export async function fetchFeed(opts: { scope: "for-you" | "following" | "user"; userId?: string; limit?: number; before?: string }): Promise<PostWithAuthor[]> {
  const limit = opts.limit ?? 25;
  let q = sb.from("posts").select("*").order("created_at", { ascending: false }).limit(limit);
  if (opts.before) q = q.lt("created_at", opts.before);

  if (opts.scope === "user" && opts.userId) {
    q = q.eq("author_id", opts.userId);
  } else if (opts.scope === "following") {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [];
    const { data: following } = await sb.from("follows").select("followee_id").eq("follower_id", u.user.id);
    const ids = [...(following || []).map((f: any) => f.followee_id), u.user.id];
    q = q.in("author_id", ids);
  }
  const { data, error } = await q;
  if (error) throw error;
  return attachAuthors(data || []);
}

export async function toggleReaction(postId: string): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { data: existing } = await sb.from("post_reactions").select("id")
    .eq("post_id", postId).eq("user_id", u.user.id).maybeSingle();
  if (existing) {
    await sb.from("post_reactions").delete().eq("id", existing.id);
    return false;
  }
  await sb.from("post_reactions").insert({ post_id: postId, user_id: u.user.id, kind: "like" });
  const { data: post } = await sb.from("posts").select("author_id, body").eq("id", postId).maybeSingle();
  if (post && post.author_id !== u.user.id) {
    await sb.rpc("create_notification", {
      _user_id: post.author_id, _type: "like", _title: "Someone liked your post",
      _body: (post.body || "").slice(0, 140), _link: "/feed", _data: { post_id: postId },
    });
  }
  return true;
}

export async function fetchComments(postId: string) {
  const { data } = await sb.from("post_comments_social").select("*")
    .eq("post_id", postId).order("created_at", { ascending: true });
  const rows = data || [];
  const ids = [...new Set(rows.map((c: any) => c.user_id))];
  const { data: profiles } = await sb.from("profiles").select("id, full_name, avatar_url").in("id", ids);
  const map = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
  return rows.map((c: any) => ({ ...c, author: map.get(c.user_id) || null }));
}

export async function postComment(postId: string, body: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await sb.from("post_comments_social").insert({ post_id: postId, user_id: u.user.id, body });
  if (error) throw error;
  const { data: post } = await sb.from("posts").select("author_id").eq("id", postId).maybeSingle();
  if (post && post.author_id !== u.user.id) {
    await sb.rpc("create_notification", {
      _user_id: post.author_id, _type: "comment", _title: "New comment on your post",
      _body: body.slice(0, 140), _link: "/feed", _data: { post_id: postId },
    });
  }
}

// Follows
export async function followUser(userId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await sb.from("follows").insert({ follower_id: u.user.id, followee_id: userId });
  if (error && !/duplicate/i.test(error.message)) throw error;
  const { data: me } = await sb.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle();
  await sb.rpc("create_notification", {
    _user_id: userId, _type: "follow", _title: "New follower",
    _body: `${me?.full_name || "Someone"} started following you.`,
    _link: `/u/${u.user.id}`, _data: {},
  });
}

export async function unfollowUser(userId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await sb.from("follows").delete().eq("follower_id", u.user.id).eq("followee_id", userId);
}

export async function isFollowing(userId: string): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data } = await sb.from("follows").select("id")
    .eq("follower_id", u.user.id).eq("followee_id", userId).maybeSingle();
  return !!data;
}

export async function followCounts(userId: string): Promise<{ followers: number; following: number }> {
  const [{ count: followers }, { count: following }] = await Promise.all([
    sb.from("follows").select("id", { count: "exact", head: true }).eq("followee_id", userId),
    sb.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

/** Projects owned by the current user — used by the "share a project" composer. */
export async function fetchMyProjects(): Promise<PostProject[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await sb.from("projects")
    .select(PROJECT_SELECT)
    .eq("owner_id", u.user.id)
    .order("created_at", { ascending: false });
  return (data || []) as PostProject[];
}
