/**
 * Server-only Strapi `outputs` list fetch (Strapi v5).
 *
 * **List (catalog):** slim fields — no `Text` / `Resources`, minimal media + relation fields (Focus, …, `Links`, `Artists`, …).
 * Merges every page until Strapi returns a short/empty page — not limited by
 * `NEXT_PUBLIC_IMAGE_FETCH_LIMIT` (that only caps the client particle layer).
 * **Detail (preview):** full document for body, resources, and image fallbacks.
 *
 * Taxonomy option lists: `GET /api/strapi/taxonomy-options`.
 *
 * Optional offline data: `offline-fixture` import + `offlineFixture*` calls below — removable as a unit
 * (see `src/lib/strapi/offline-fixture/index.ts`).
 */

import type { ContentRow } from "@/data/content-types";
import {
  mapStrapiOutputToContentRow,
  mapStrapiOutputsPayloadToContentRows,
  strapiDocumentDisplayName,
  strapiOutputEntryToFlatRecord,
} from "@/lib/strapi/map-output-to-content-row";
import {
  offlineFixtureCatalogOrNull,
  offlineFixtureDetailIfEnabled,
  offlineFixtureTaxonomyOrNull,
} from "@/lib/strapi/offline-fixture";

/**
 * Strapi often enforces a max `pageSize` (commonly 100). Asking for 200 can make page ≥2 return
 * empty `data` while `meta.pagination.total` still reflects the full collection.
 */
const CATALOG_PAGE_SIZE = 100;
/**
 * Max catalog list pages (page size {@link CATALOG_PAGE_SIZE}). Raise if the collection can exceed
 * this many pages (e.g. 1000 pages × 100 = 100k rows).
 */
const OUTPUT_LIST_MAX_PAGES = 1000;
const STRAPI_REVALIDATE_SECONDS = 300;

export type StrapiOutputsListUnknown = {
  data?: unknown;
  meta?: unknown;
  error?: unknown;
};

export type StrapiTaxonomyOptionLabels = {
  focusOptionLabels: string[];
  activityOptionLabels: string[];
  formatOptionLabels: string[];
  networkOptionLabels: string[];
  artistOptionLabels: string[];
};

function strapiBaseUrl(): string {
  const raw = process.env.STRAPI_URL?.trim();
  if (!raw) throw new Error("STRAPI_URL is not set");
  return raw.replace(/\/$/, "");
}

function strapiOutputsListStatus(): "draft" | "published" {
  const raw = process.env.STRAPI_OUTPUTS_STATUS?.trim().toLowerCase();
  return raw === "published" ? "published" : "draft";
}

/** Strapi `output` type: relation to `artist` entries (field API id in Content-Type Builder). */
const OUTPUT_ARTIST_RELATION = "Artists";

function appendOutputsDetailPopulate(
  params: URLSearchParams,
  options: { includeSources: boolean },
): void {
  params.append("populate[Thumbnail][fields][0]", "url");
  params.append("populate[Thumbnail][fields][1]", "formats");
  params.append("populate[Thumbnail][fields][2]", "width");
  params.append("populate[Thumbnail][fields][3]", "height");
  params.append("populate[Thumbnail][fields][4]", "size");
  /** Repeatable `Image` — request url + formats for each entry (carousel in preview). */
  params.append("populate[Image][fields][0]", "url");
  params.append("populate[Image][fields][1]", "formats");
  params.append("populate[Image][fields][2]", "width");
  params.append("populate[Image][fields][3]", "height");
  params.append("populate[Image][fields][4]", "size");
  params.append("populate[Focus]", "true");
  params.append("populate[Activity]", "true");
  params.append("populate[Network]", "true");
  params.append("populate[Format]", "true");
  /** Other outputs linked to this one — same as other relations; needs populate for payload. */
  params.append("populate[Links]", "true");
  /**
   * Repeatable `Source` on output (CTB API id `Source`); nest `links` for relations on each entry.
   * Omitted when `includeSources: false` (e.g. retry after a failed request with `Source` populate).
   */
  if (options.includeSources) {
    params.append("populate[Source][populate][links]", "true");
  }
  params.append(`populate[${OUTPUT_ARTIST_RELATION}]`, "true");
}

/**
 * Catalog list: only scalars needed for tiles + taxonomy; omit heavy `Text` and `Resources`.
 * Search uses title, shortTitle, tags, year, etc. — not full body until preview loads detail.
 */
function appendOutputsListSlimQuery(params: URLSearchParams): void {
  const fields = [
    "documentId",
    "Content_Title",
    "Short_Title",
    "Date",
    "updatedAt",
    "createdAt",
  ];
  fields.forEach((f, i) => params.append(`fields[${i}]`, f));

  params.append("populate[Thumbnail][fields][0]", "url");
  params.append("populate[Thumbnail][fields][1]", "formats");
  params.append("populate[Thumbnail][fields][2]", "width");
  params.append("populate[Thumbnail][fields][3]", "height");
  params.append("populate[Thumbnail][fields][4]", "size");
  params.append("populate[Image][fields][0]", "url");
  params.append("populate[Image][fields][1]", "formats");
  params.append("populate[Image][fields][2]", "width");
  params.append("populate[Image][fields][3]", "height");
  params.append("populate[Image][fields][4]", "size");

  /** Related types use `Name` (not all define `Title`; Strapi rejects invalid populate keys). */
  for (const key of ["Focus", "Activity", "Network", "Format"] as const) {
    params.append(`populate[${key}][fields][0]`, "Name");
  }

  /**
   * `Links` is a relation to other `output` entries; titles come from `Short_Title` / `Content_Title`
   * (not `Name` like Focus/Network).
   */
  params.append("populate[Links][fields][0]", "Short_Title");
  params.append("populate[Links][fields][1]", "Content_Title");

  params.append(`populate[${OUTPUT_ARTIST_RELATION}]`, "true");
}

function outputsListPageParams(page: number, pageSize: number): string {
  const params = new URLSearchParams();
  params.append("status", strapiOutputsListStatus());
  params.append("pagination[page]", String(page));
  params.append("pagination[pageSize]", String(pageSize));
  /** Ensures `meta.pagination.total` reflects the filtered query (Strapi v5). */
  params.append("pagination[withCount]", "true");
  params.append("sort[0]", "Index:asc");
  appendOutputsListSlimQuery(params);
  return params.toString();
}

async function fetchStrapiOutputsPageJson(
  page: number,
  pageSize: number,
  /** Use for catalog merge — avoids Next fetch cache reusing one page's body for every `page` param. */
  catalogListFetch?: boolean,
): Promise<StrapiOutputsListUnknown> {
  const base = strapiBaseUrl();
  const token = process.env.STRAPI_API_TOKEN?.trim();

  const url = `${base}/api/outputs?${outputsListPageParams(page, pageSize)}`;
  const headers: HeadersInit = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    headers,
    ...(catalogListFetch
      ? { cache: "no-store" as const }
      : { next: { revalidate: STRAPI_REVALIDATE_SECONDS } }),
  });

  const body = (await res.json()) as StrapiOutputsListUnknown;

  if (!res.ok) {
    const message =
      typeof body.error === "object" &&
      body.error !== null &&
      "message" in body.error
        ? String((body.error as { message?: unknown }).message)
        : JSON.stringify(body).slice(0, 400);
    throw new Error(`Strapi outputs list failed (${res.status}): ${message}`);
  }

  return body;
}

/** Strapi collection REST id (e.g. `format-options`, `artists`). */
async function fetchStrapiSortedOptionLabels(
  collectionPath: string,
): Promise<string[]> {
  try {
    const base = strapiBaseUrl();
    const token = process.env.STRAPI_API_TOKEN?.trim();
    const params = new URLSearchParams();
    params.append("status", strapiOutputsListStatus());
    params.append("pagination[page]", "1");
    params.append("pagination[pageSize]", "500");
    params.append("sort[0]", "Index:asc");

    const url = `${base}/api/${collectionPath.replace(/^\//, "")}?${params.toString()}`;
    const headers: HeadersInit = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      headers,
      next: { revalidate: STRAPI_REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];

    const body = (await res.json()) as { data?: unknown };
    const data = body.data;
    if (!Array.isArray(data)) return [];

    const labels: string[] = [];
    for (const item of data) {
      const name = strapiDocumentDisplayName(item);
      if (name) labels.push(name);
    }
    return labels;
  } catch {
    return [];
  }
}

export async function fetchStrapiTaxonomyOptionLabelsStaged(): Promise<StrapiTaxonomyOptionLabels> {
  const offline = offlineFixtureTaxonomyOrNull();
  if (offline) return offline;

  const [focusOptionLabels, activityOptionLabels, formatOptionLabels] =
    await Promise.all([
      fetchStrapiSortedOptionLabels("focus-options"),
      fetchStrapiSortedOptionLabels("activity-options"),
      fetchStrapiSortedOptionLabels("format-options"),
    ]);

  const [networkOptionLabels, artistOptionLabels] = await Promise.all([
    fetchStrapiSortedOptionLabels("networks"),
    fetchStrapiSortedOptionLabels("artists"),
  ]);

  return {
    focusOptionLabels,
    activityOptionLabels,
    formatOptionLabels,
    networkOptionLabels,
    artistOptionLabels,
  };
}

export async function fetchStrapiOutputsCatalogOnly(options?: {
  pageSize?: number;
}): Promise<{
  rows: ContentRow[];
  total: number;
  durationMs: number;
}> {
  const offline = offlineFixtureCatalogOrNull();
  if (offline) return offline;

  const started = performance.now();
  const pageSize = Math.min(
    options?.pageSize ?? CATALOG_PAGE_SIZE,
    CATALOG_PAGE_SIZE,
  );

  const mergedData: unknown[] = [];

  for (let page = 1; page <= OUTPUT_LIST_MAX_PAGES; page++) {
    const payload = await fetchStrapiOutputsPageJson(page, pageSize, true);
    const chunk = Array.isArray(payload.data) ? payload.data : [];
    if (chunk.length === 0) break;

    mergedData.push(...chunk);

    /**
     * Do not rely on `meta.pagination.total` to stop: it can under-report, and stopping at
     * `merged.length >= total` hides additional entries. Stop only when Strapi has no more rows
     * (empty page) or returns a partial page.
     */
    if (chunk.length < pageSize) break;
  }

  const rows = mapStrapiOutputsPayloadToContentRows(mergedData);

  return {
    rows,
    /** Rows actually merged — matches `rows.length` after mapping (minus null maps). */
    total: rows.length,
    durationMs: Math.round(performance.now() - started),
  };
}

/**
 * One output by `documentId`. `includeSources: true` (default) loads `Text` and `Source` in one
 * query; set `includeSources: false` only to retry without the `Source` populate if Strapi errors.
 */
export async function fetchStrapiOutputDetailByDocumentId(
  documentId: string,
  options?: { includeSources?: boolean },
): Promise<ContentRow | null> {
  const trimmed = documentId.trim();
  if (!trimmed) return null;
  const includeSources = options?.includeSources !== false;

  const offlineRow = offlineFixtureDetailIfEnabled(trimmed);
  if (offlineRow !== undefined) {
    if (!includeSources) {
      return { ...offlineRow, resources: [] } as ContentRow;
    }
    return offlineRow;
  }

  const base = strapiBaseUrl();
  const token = process.env.STRAPI_API_TOKEN?.trim();

  const queryStrapiOutputDetail = async (
    withSources: boolean,
  ): Promise<ContentRow | null> => {
    const params = new URLSearchParams();
    params.append("status", strapiOutputsListStatus());
    params.append("pagination[pageSize]", "1");
    params.append("filters[documentId][$eq]", trimmed);
    appendOutputsDetailPopulate(params, { includeSources: withSources });

    const url = `${base}/api/outputs?${params.toString()}`;
    const headers: HeadersInit = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      headers,
      next: { revalidate: STRAPI_REVALIDATE_SECONDS },
    });

    const body = (await res.json()) as StrapiOutputsListUnknown;

    if (!res.ok) {
      return null;
    }

    const data = body.data;
    if (!Array.isArray(data) || data.length === 0) return null;
    const flat = strapiOutputEntryToFlatRecord(data[0]);
    if (!flat) return null;
    return mapStrapiOutputToContentRow(flat);
  };

  const wantSourcesFirst = includeSources;
  let usedSources = wantSourcesFirst;
  let row = await queryStrapiOutputDetail(usedSources);
  if (!row && wantSourcesFirst) {
    usedSources = false;
    row = await queryStrapiOutputDetail(false);
  }

  const rowOut: ContentRow | null =
    row && !usedSources
      ? ({ ...row, resources: [] } as ContentRow)
      : row;

  return rowOut;
}
