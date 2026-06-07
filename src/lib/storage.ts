import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const cache = new Map<string, { url: string; expires: number }>();

type Bucket = "avatars" | "covers" | "post-media";

/**
 * For private buckets we store the storage path and resolve to a signed URL
 * on demand. http(s) URLs are returned unchanged.
 */
export async function resolveImage(bucket: Bucket, pathOrUrl: string): Promise<string | null> {
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

export function useSignedImage(bucket: Bucket, pathOrUrl: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!pathOrUrl) { setUrl(null); return; }
    resolveImage(bucket, pathOrUrl).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [bucket, pathOrUrl]);
  return url;
}

export function useSignedImages(bucket: Bucket, paths: string[]) {
  const [urls, setUrls] = useState<string[]>([]);
  const key = paths.join("|");
  useEffect(() => {
    let cancelled = false;
    Promise.all(paths.map((p) => resolveImage(bucket, p))).then((res) => {
      if (!cancelled) setUrls(res.filter(Boolean) as string[]);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, key]);
  return urls;
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

export async function uploadPostMedia(file: File): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("post-media").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

/** Server-enforced per-hour rate limiter via SECURITY DEFINER function. */
export async function checkRateLimit(action: string, max: number): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)("check_and_increment_rate_limit", {
    _action: action, _limit: max,
  });
  if (error) return false;
  return !!data;
}
