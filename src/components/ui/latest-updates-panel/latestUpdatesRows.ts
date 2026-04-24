import type { ContentRow } from "@/data/content-types";

export const LATEST_UPDATES_PREVIEW_COUNT = 3;

function updatedAtSortKeyMs(row: ContentRow): number {
  const t = row.updatedAt?.trim();
  if (!t) return 0;
  const n = Date.parse(t);
  return Number.isFinite(n) ? n : 0;
}

/** Newest catalog rows for Latest Updates (desktop dock + mobile strip). */
export function selectLatestUpdatesRows(
  contentCatalog: readonly ContentRow[],
  contentCatalogStatus: "loading" | "success" | "error",
): ContentRow[] {
  if (contentCatalogStatus !== "success" || contentCatalog.length === 0) {
    return [];
  }
  return [...contentCatalog]
    .sort((a, b) => updatedAtSortKeyMs(b) - updatedAtSortKeyMs(a))
    .slice(0, LATEST_UPDATES_PREVIEW_COUNT);
}
