import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export type Post = {
  id: string;
  author_id: string;
  body: string;
  media_urls: string[];
  repost_of: string | null;
  visibility: string;
  mention_user_ids: string[];
  hashtags: string[];
  reaction_count: number;
  comment_count: number;
  repost_count: number;
  created_at: string;
};

export type PostWithAuthor = Post & {
  author: { id: string; full_name: string; avatar_url: string; headline: string } | null;
  repost?: PostWithAuthor | null;
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

export async function createPost(input: { body: string; media_urls?: string[]; repost_of?: string | null; visibility?: "public" | "followers"; }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const hashtags = extractHashtags(input.body);
  const handles = extractMentionHandles(input.body);
  const mention_user_ids = await resolveMentionUserIds(handles);
  const { data, error } = await sb.from("posts").insert({
    author_id: u.user.id,
    body: input.body,
    media_urls: input.media_urls ?? [],
    repost_of: input.repost_of ?? null,
    visibility: input.visibility ?? "public",
    hashtags, mention_user_ids,
  }).select("*").single();
  if (error) throw error;

  // Notify mentioned users (best-effort, via SECURITY DEFINER fn)
  await Promise.all(mention_user_ids.filter((id) => id !== u.user!.id).map((id) =>
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
  return data as Post;
}

export async function deletePost(id: string) {
  const { error } = await sb.from("posts").delete().eq("id", id);
  if (error) throw error;
}

async function attachAuthors(posts: Post[]): Promise<PostWithAuthor[]> {
  if (posts.length === 0) return [];
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const repostIds = posts.map((p) => p.repost_of).filter(Boolean) as string[];

  const { data: profiles } = await sb.from("profiles")
    .select("id, full_name, avatar_url, headline").in("id", authorIds);
  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

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
    liked_by_me: likedSet.has(p.id),
  }));
}

async function attachAuthorsLite(posts: Post[]): Promise<PostWithAuthor[]> {
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
    const { data: following } = await sb.from("follows").select("following_id").eq("follower_id", u.user.id);
    const ids = [...(following || []).map((f: any) => f.following_id), u.user.id];
    q = q.in("author_id", ids);
  }
  const { data, error } = await q;
  if (error) throw error;
  return attachAuthors((data || []) as Post[]);
}

export async function toggleReaction(postId: string): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { data: existing } = await sb.from("post_reactions").select("id")
    .eq("post_id", postId).eq("user_id", u.user.id).eq("kind", "like").maybeSingle();
  if (existing) {
    await sb.from("post_reactions").delete().eq("id", existing.id);
    return false;
  }
  await sb.from("post_reactions").insert({ post_id: postId, user_id: u.user.id, kind: "like" });
  // Notify author
  const { data: post } = await sb.from("posts").select("author_id").eq("id", postId).maybeSingle();
  if (post && post.author_id !== u.user.id) {
    await sb.rpc("create_notification", {
      _user_id: post.author_id, _type: "like", _title: "Someone liked your post",
      _body: "", _link: "/feed", _data: { post_id: postId },
    });
  }
  return true;
}

export async function fetchComments(postId: string) {
  const { data } = await sb.from("post_comments_social").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  if (!data || data.length === 0) return [];
  const userIds = [...new Set(data.map((c: any) => c.user_id))];
  const { data: profiles } = await sb.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
  const map = new Map((profiles || []).map((p: any) => [p.id, p]));
  return data.map((c: any) => ({ ...c, author: map.get(c.user_id) || null }));
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
  const { error } = await sb.from("follows").insert({ follower_id: u.user.id, following_id: userId });
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
  await sb.from("follows").delete().eq("follower_id", u.user.id).eq("following_id", userId);
}

export async function isFollowing(userId: string): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data } = await sb.from("follows").select("id")
    .eq("follower_id", u.user.id).eq("following_id", userId).maybeSingle();
  return !!data;
}

export async function followCounts(userId: string): Promise<{ followers: number; following: number }> {
  const [{ count: followers }, { count: following }] = await Promise.all([
    sb.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    sb.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}
