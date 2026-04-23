import type { ContentRow } from "@/data/content-types";

const cache = new Map<string, ContentRow>();
const inFlight = new Map<string, Promise<ContentRow | null>>();

export function getCachedPreviewDetailRow(id: string): ContentRow | undefined {
  return cache.get(id);
}

/**
 * Merges full Strapi output for preview. Dedupes concurrent requests; caches successful responses
 * (same `documentId` reuses without re-fetch: hover prefetch, click, Search, Latest updates).
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
