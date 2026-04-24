import type { ContentRow } from "@/data/content-types";

const cache = new Map<string, ContentRow>();
const inFlight = new Map<string, Promise<ContentRow | null>>();

export function getCachedPreviewDetailRow(id: string): ContentRow | undefined {
  return cache.get(id);
}

const hoverInFlight = new Map<string, Promise<ContentRow | null>>();

/**
 * Full Strapi `output` for an opened preview (Text, `Source` → `resources`, media, …). Cached.
 * Hover uses {@link fetchPreviewBodyOnHover} (same `Source` + body in one request; not in this cache).
 */
export async function fetchPreviewOutputDetail(
  id: string,
): Promise<ContentRow | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const hit = cache.get(trimmed);
  if (hit) return hit;
  const pending = inFlight.get(trimmed);
  if (pending) return pending;

  const p = (async () => {
    try {
      const res = await fetch(
        `/api/strapi/outputs/${encodeURIComponent(trimmed)}`,
        { credentials: "same-origin" },
      );
      if (!res.ok) return null;
      const body: unknown = await res.json();
      if (!body || typeof body !== "object" || !("row" in body)) {
        return null;
      }
      const row = (body as { row: ContentRow }).row;
      cache.set(trimmed, row);
      return row;
    } catch {
      return null;
    } finally {
      inFlight.delete(trimmed);
    }
  })();
  inFlight.set(trimmed, p);
  return p;
}

/**
 * **Hover:** prefetches the same output detail (Text + `Source` + media + taxonomies) in one
 * request; **not** written to the full-detail cache — opening the preview still runs
 * {@link fetchPreviewOutputDetail} (so the full row is cached on click if needed).
 */
export async function fetchPreviewBodyOnHover(
  id: string,
): Promise<ContentRow | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const pending = hoverInFlight.get(trimmed);
  if (pending) return pending;

  const p = (async () => {
    try {
      const res = await fetch(
        `/api/strapi/outputs/${encodeURIComponent(trimmed)}`,
        { credentials: "same-origin" },
      );
      if (!res.ok) return null;
      const body: unknown = await res.json();
      if (!body || typeof body !== "object" || !("row" in body)) {
        return null;
      }
      return (body as { row: ContentRow }).row;
    } catch {
      return null;
    } finally {
      hoverInFlight.delete(trimmed);
    }
  })();
  hoverInFlight.set(trimmed, p);
  return p;
}
