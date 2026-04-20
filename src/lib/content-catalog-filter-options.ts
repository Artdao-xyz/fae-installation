import type { ContentRow } from "@/data/content-types";

type TaxonomyKey =
  | "focusAreas"
  | "activityTypes"
  | "formats"
  | "networks"
  | "artists";

/** Unique non-empty labels from the catalog, sorted for stable UI. */
export function uniqueSortedLabelsFromCatalog(
  rows: readonly ContentRow[],
  key: TaxonomyKey,
): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const raw of row[key]) {
      const s = typeof raw === "string" ? raw.trim() : "";
      if (s.length > 0) seen.add(s);
    }
  }
  return [...seen].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

/**
 * CMS order first (collection list sorted by `Index`), then any labels only present on rows.
 */
export function mergeCmsAndCatalogOptionLabels(
  cmsOrderedLabels: readonly string[],
  fromCatalogRows: readonly string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of cmsOrderedLabels) {
    const s = typeof raw === "string" ? raw.trim() : "";
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  const extras = fromCatalogRows
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !seen.has(s))
    .sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  out.push(...extras);
  return out;
}

/** @deprecated Use {@link mergeCmsAndCatalogOptionLabels}. */
export const mergeFormatFilterLabels = mergeCmsAndCatalogOptionLabels;
