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

const ALLOWED_IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};
const ALLOWED_MIME_SET = new Set(Object.values(ALLOWED_IMAGE_MIME));
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

function validateImageFile(file: File): { ext: string; contentType: string } {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File too large (max 10MB)");
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const extMime = ALLOWED_IMAGE_MIME[ext];
  if (!extMime) {
    throw new Error("Unsupported file type. Use JPG, PNG, GIF or WebP.");
  }
  // Reject if browser-reported MIME isn't in the allowlist or doesn't match ext
  if (!ALLOWED_MIME_SET.has(file.type) || file.type !== extMime) {
    throw new Error("File type does not match its extension.");
  }
  return { ext, contentType: extMime };
}

export async function uploadProfileImage(
  bucket: "avatars" | "covers",
  file: File,
): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { ext, contentType } = validateImageFile(file);
  const path = `${u.user.id}/${bucket}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType,
  });
  if (error) throw error;
  return path;
}

const ALLOWED_VIDEO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

export type MediaKind = "image" | "video";

/** Validate a post attachment (photo or video) before upload. */
function validateMediaFile(file: File): { ext: string; contentType: string; kind: MediaKind } {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const videoMime = ALLOWED_VIDEO_MIME[ext];
  if (videoMime) {
    if (file.size > MAX_VIDEO_BYTES) throw new Error("Video too large (max 200MB)");
    if (file.type && file.type !== videoMime) throw new Error("File type does not match its extension.");
    return { ext, contentType: videoMime, kind: "video" };
  }
  const img = validateImageFile(file);
  return { ...img, kind: "image" };
}

export function mediaKindOf(file: File): MediaKind {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return ALLOWED_VIDEO_MIME[ext] ? "video" : "image";
}

export function mediaKindOfPath(path: string): MediaKind {
  const ext = (path.split(".").pop() || "").toLowerCase();
  return ALLOWED_VIDEO_MIME[ext] ? "video" : "image";
}

export async function uploadPostMedia(file: File): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { ext, contentType } = validateMediaFile(file);
  const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("post-media").upload(path, file, {
    upsert: false,
    contentType,
  });
  if (error) throw error;
  return path;
}

/** Signed URL for any private post attachment (photo or video). */
export async function resolveMedia(path: string) {
  return resolveImage("post-media", path);
}

/** Server-enforced per-hour rate limiter via SECURITY DEFINER function. */
export async function checkRateLimit(action: string, max: number): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)("check_and_increment_rate_limit", {
    _action: action, _limit: max,
  });
  if (error) return false;
  return !!data;
}

const ALLOWED_DOC_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** Private verification document upload (institution vetting). */
export async function uploadInstitutionDocument(file: File): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File too large (max 10MB)");
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const mime = ALLOWED_DOC_MIME[ext];
  if (!mime) throw new Error("Unsupported file type. Use PDF, JPG, PNG or WebP.");
  if (file.type && file.type !== mime) throw new Error("File type does not match its extension.");
  const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("institution-docs").upload(path, file, {
    upsert: false,
    contentType: mime,
  });
  if (error) throw error;
  return path;
}
