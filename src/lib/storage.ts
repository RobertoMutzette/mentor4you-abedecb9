import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const cache = new Map<string, { url: string; expires: number }>();

/**
 * For private buckets (`avatars`, `covers`) we store the storage path
 * (e.g. `<uid>/avatar-123.png`) in `avatar_url` / `cover_url` and
 * resolve it to a signed URL on demand.
 *
 * If a value already looks like an http(s) URL we return it as-is so
 * legacy/external links keep working.
 */
export async function resolveImage(bucket: "avatars" | "covers", pathOrUrl: string): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;

  const key = `${bucket}:${pathOrUrl}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.url;

  const { data } = await supabase.storage.from(bucket).createSignedUrl(pathOrUrl, 3600);
  if (!data?.signedUrl) return null;
  cache.set(key, { url: data.signedUrl, expires: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}

export function useSignedImage(bucket: "avatars" | "covers", pathOrUrl: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!pathOrUrl) { setUrl(null); return; }
    resolveImage(bucket, pathOrUrl).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [bucket, pathOrUrl]);
  return url;
}

export async function uploadProfileImage(
  bucket: "avatars" | "covers",
  file: File,
): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${u.user.id}/${bucket}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

/** Ad-hoc per-hour rate limiter. Returns true if allowed. */
export async function checkRateLimit(action: string, max: number): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);

  const { data: row } = await supabase
    .from("rate_limits")
    .select("count")
    .eq("user_id", u.user.id)
    .eq("action", action)
    .eq("window_start", windowStart.toISOString())
    .maybeSingle();

  const current = row?.count ?? 0;
  if (current >= max) return false;

  await supabase.from("rate_limits").upsert({
    user_id: u.user.id,
    action,
    window_start: windowStart.toISOString(),
    count: current + 1,
  }, { onConflict: "user_id,action,window_start" });
  return true;
}
