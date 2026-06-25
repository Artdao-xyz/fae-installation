const DERIVATIVE_PREFIX =
  /^(?:(?:small|medium|large|xlarge|thumbnail)(?:_webp)?_)/i;

/** Basename from a Strapi / Cloudinary URL (no query string). */
export function basenameFromRemoteMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  } catch {
    const noQuery = trimmed.split(/[?#]/)[0] ?? trimmed;
    const parts = noQuery.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? noQuery;
  }
}

/** `small_Foo_hash.jpg` → `Foo_hash.jpg` (original on disk). */
export function originalMediaBasename(filename: string): string {
  const base = filename.trim();
  if (!base) return "";
  return base.replace(DERIVATIVE_PREFIX, "");
}

export function localMediaPathFromRemoteUrl(url: string): string {
  const basename = originalMediaBasename(basenameFromRemoteMediaUrl(url));
  if (!basename) return "";
  return `/api/media/${encodeURIComponent(basename).replace(/%2F/g, "/")}`;
}

export function rewriteRemoteMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/api/media/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes("strapiapp.com")) {
    return localMediaPathFromRemoteUrl(trimmed) || trimmed;
  }
  return trimmed;
}

export function rewriteMediaObject(
  media: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!media || typeof media !== "object") return null;
  const out: Record<string, unknown> = { ...media };
  if (typeof out.url === "string") {
    out.url = rewriteRemoteMediaUrl(out.url);
  }
  if (out.formats && typeof out.formats === "object") {
    const formats: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      out.formats as Record<string, unknown>,
    )) {
      if (value && typeof value === "object") {
        const f = { ...(value as Record<string, unknown>) };
        if (typeof f.url === "string") {
          f.url = rewriteRemoteMediaUrl(f.url);
        }
        formats[key] = f;
      } else {
        formats[key] = value;
      }
    }
    out.formats = formats;
  }
  return out;
}
