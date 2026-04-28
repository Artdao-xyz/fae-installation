import type { ContentRow } from "@/data/content-types";

const cache = new Map<string, ContentRow>();
const inFlight = new Map<string, Promise<ContentRow | null>>();

export function getCachedPreviewDetailRow(id: string): ContentRow | undefined {
  return cache.get(id);
}

/**
 * Merges Strapi detail into the row already shown (catalog slice or prior merge).
 * Preserves existing `resources` when the API returns an empty list (partial responses / edge cases).
 */
export function mergePreviewRowWithDetail(
  prev: ContentRow,
  detail: ContentRow,
): ContentRow {
  return {
    ...prev,
    ...detail,
    resources:
      detail.resources.length > 0 ? detail.resources : prev.resources,
  };
}

/**
 * Full Strapi `output` for an opened preview (Text, `Source` → `resources`, media, …). Cached.
 * Hover prefetch uses {@link fetchPreviewBodyOnHover}, which shares this cache and in-flight
 * deduplication so a click right after hover does not duplicate the network request.
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
 * Prefetches the same document as {@link fetchPreviewOutputDetail} (e.g. tile hover before share sheet).
 * Results are cached; overlapping click uses the same in-flight request.
 */
export function fetchPreviewBodyOnHover(
  id: string,
): Promise<ContentRow | null> {
  return fetchPreviewOutputDetail(id);
}
