/**
 * Optional Strapi bypass: `FAE_USE_STRAPI_FIXTURE=1` → bundled fixture; `0` or unset → live Strapi.
 *
 * ---------------------------------------------------------------------------
 * To remove this feature entirely:
 * 1. Delete the folder `src/lib/strapi/offline-fixture/`.
 * 2. In `fetch-outputs-list.ts`, delete the `strapi-offline-fixture` import and every
 *    `offlineFixture*` / `offlineFixtureDetailIfEnabled` block (search the filename).
 * 3. Remove `FAE_USE_STRAPI_FIXTURE` from `.env.example` (and your `.env.local` if set).
 * 4. Optionally delete `toSlimCatalogRow`, `getContentFixtureCatalogRows`,
 *    `getContentFixtureDetailByDocumentId` from `src/data/content-fixture.ts` if nothing
 *    else imports them, and strip offline-related comments there.
 * ---------------------------------------------------------------------------
 */

import type { ContentRow } from "@/data/content-types";
import {
  CONTENT_FIXTURE_ROWS,
  getContentFixtureCatalogRows,
  getContentFixtureDetailByDocumentId,
} from "@/data/content-fixture";
import {
  filterMergedOptionLabelsToCatalogUsed,
  mergeCmsAndCatalogOptionLabels,
  uniqueSortedLabelsFromCatalog,
} from "@/lib/content-catalog-filter-options";
import {
  ACTIVITY_TYPE_LABELS,
  ARTIST_LABELS,
  FOCUS_AREA_LABELS,
  FORMAT_LABELS,
  NETWORK_LABELS,
} from "@/data/content-taxonomy";

/** `1` / `true` / `yes` = test fixture; `0` / `false` / `no` / unset / anything else = hit Strapi. */
export function offlineFixtureEnabled(): boolean {
  const raw = process.env.FAE_USE_STRAPI_FIXTURE?.trim() ?? "";
  const v = raw.toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export type OfflineFixtureCatalogResult = {
  rows: ContentRow[];
  total: number;
  durationMs: number;
};

export function offlineFixtureCatalogOrNull(): OfflineFixtureCatalogResult | null {
  if (!offlineFixtureEnabled()) return null;
  const rows = getContentFixtureCatalogRows();
  return { rows, total: rows.length, durationMs: 0 };
}

export type OfflineFixtureTaxonomyLabels = {
  focusOptionLabels: string[];
  activityOptionLabels: string[];
  formatOptionLabels: string[];
  networkOptionLabels: string[];
  artistOptionLabels: string[];
};

export function offlineFixtureTaxonomyOrNull(): OfflineFixtureTaxonomyLabels | null {
  if (!offlineFixtureEnabled()) return null;
  const rows = CONTENT_FIXTURE_ROWS;
  const focusUsed = uniqueSortedLabelsFromCatalog(rows, "focusAreas");
  const activityUsed = uniqueSortedLabelsFromCatalog(rows, "activityTypes");
  const formatsUsed = uniqueSortedLabelsFromCatalog(rows, "formats");
  const networksUsed = uniqueSortedLabelsFromCatalog(rows, "networks");
  const artistsUsed = uniqueSortedLabelsFromCatalog(rows, "artists");
  return {
    focusOptionLabels: filterMergedOptionLabelsToCatalogUsed(
      mergeCmsAndCatalogOptionLabels(FOCUS_AREA_LABELS, focusUsed),
      focusUsed,
    ),
    activityOptionLabels: filterMergedOptionLabelsToCatalogUsed(
      mergeCmsAndCatalogOptionLabels(ACTIVITY_TYPE_LABELS, activityUsed),
      activityUsed,
    ),
    formatOptionLabels: filterMergedOptionLabelsToCatalogUsed(
      mergeCmsAndCatalogOptionLabels(FORMAT_LABELS, formatsUsed),
      formatsUsed,
    ),
    networkOptionLabels: filterMergedOptionLabelsToCatalogUsed(
      mergeCmsAndCatalogOptionLabels(NETWORK_LABELS, networksUsed),
      networksUsed,
    ),
    artistOptionLabels: filterMergedOptionLabelsToCatalogUsed(
      mergeCmsAndCatalogOptionLabels(ARTIST_LABELS, artistsUsed),
      artistsUsed,
    ),
  };
}

/**
 * `undefined` → not using offline fixture (call Strapi).
 * `ContentRow | null` → fixture on; `null` means id not found.
 */
export function offlineFixtureDetailIfEnabled(
  documentId: string,
): ContentRow | null | undefined {
  if (!offlineFixtureEnabled()) return undefined;
  return getContentFixtureDetailByDocumentId(documentId);
}
