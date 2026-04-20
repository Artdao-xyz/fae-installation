/**
 * Server-only Strapi `outputs` list fetch (Strapi v5).
 *
 * **List (catalog):** slim fields — no `Text` / `Resources`, minimal media + relation name fields.
 * **Detail (preview):** full document for body, resources, and image fallbacks.
 *
 * Taxonomy option lists: `GET /api/strapi/taxonomy-options`.
 */

import {
  mapStrapiOutputToContentRow,
  mapStrapiOutputsPayloadToContentRows,
  strapiDocumentDisplayName,
} from "@/lib/strapi/map-output-to-content-row";
import type { ContentRow } from "@/data/content-types";

/** Larger pages = fewer Strapi round-trips; balance with response size. */
const DEFAULT_PAGE_SIZE = 200;
/** Fetch pages 2…N in parallel batches to beat sequential latency without bursting Strapi. */
const OUTPUT_PAGE_FETCH_CONCURRENCY = 3;
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

function appendOutputsDetailPopulate(params: URLSearchParams): void {
  params.append("populate[Image]", "true");
  params.append("populate[Thumbnail]", "true");
  params.append("populate[Focus]", "true");
  params.append("populate[Activity]", "true");
  params.append("populate[Network]", "true");
  params.append("populate[Format]", "true");

  const outputArtistRelation = process.env.STRAPI_OUTPUTS_ARTIST_RELATION?.trim();
  if (outputArtistRelation) {
    params.append(`populate[${outputArtistRelation}]`, "true");
  }
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
  ];
  fields.forEach((f, i) => params.append(`fields[${i}]`, f));

  params.append("populate[Thumbnail][fields][0]", "url");
  params.append("populate[Thumbnail][fields][1]", "formats");
  params.append("populate[Image][fields][0]", "url");
  params.append("populate[Image][fields][1]", "formats");

  /** Related types use `Name` (not all define `Title`; Strapi rejects invalid populate keys). */
  for (const key of ["Focus", "Activity", "Network", "Format"] as const) {
    params.append(`populate[${key}][fields][0]`, "Name");
  }

  const outputArtistRelation = process.env.STRAPI_OUTPUTS_ARTIST_RELATION?.trim();
  if (outputArtistRelation) {
    params.append(`populate[${outputArtistRelation}][fields][0]`, "Name");
  }
}

function outputsListPageParams(page: number, pageSize: number): string {
  const params = new URLSearchParams();
  params.append("status", strapiOutputsListStatus());
  params.append("pagination[page]", String(page));
  params.append("pagination[pageSize]", String(pageSize));
  params.append("sort[0]", "Index:asc");
  appendOutputsListSlimQuery(params);
  return params.toString();
}

async function fetchStrapiOutputsPageJson(
  page: number,
  pageSize: number,
): Promise<StrapiOutputsListUnknown> {
  const base = strapiBaseUrl();
  const token = process.env.STRAPI_API_TOKEN?.trim();

  const url = `${base}/api/outputs?${outputsListPageParams(page, pageSize)}`;
  const headers: HeadersInit = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    headers,
    next: { revalidate: STRAPI_REVALIDATE_SECONDS },
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

async function fetchStrapiOutputPagesBatched(
  pages: readonly number[],
  pageSize: number,
): Promise<StrapiOutputsListUnknown[]> {
  const out: StrapiOutputsListUnknown[] = [];
  for (let i = 0; i < pages.length; i += OUTPUT_PAGE_FETCH_CONCURRENCY) {
    const chunk = pages.slice(i, i + OUTPUT_PAGE_FETCH_CONCURRENCY);
    const batch = await Promise.all(
      chunk.map((p) => fetchStrapiOutputsPageJson(p, pageSize)),
    );
    out.push(...batch);
  }
  return out;
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

function readPagination(
  payload: StrapiOutputsListUnknown,
): { pageCount: number; total: number } {
  const meta = payload.meta;
  if (!meta || typeof meta !== "object" || !("pagination" in meta)) {
    return { pageCount: 1, total: Array.isArray(payload.data) ? payload.data.length : 0 };
  }
  const p = (meta as { pagination?: unknown }).pagination;
  if (!p || typeof p !== "object") {
    return { pageCount: 1, total: Array.isArray(payload.data) ? payload.data.length : 0 };
  }
  const pg = p as { pageCount?: unknown; total?: unknown };
  const pageCount =
    typeof pg.pageCount === "number" && pg.pageCount >= 1 ? pg.pageCount : 1;
  const total = typeof pg.total === "number" ? pg.total : 0;
  return { pageCount, total };
}

export async function fetchStrapiTaxonomyOptionLabelsStaged(): Promise<StrapiTaxonomyOptionLabels> {
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
  const started = performance.now();
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  const first = await fetchStrapiOutputsPageJson(1, pageSize);
  const { pageCount, total } = readPagination(first);

  const pagePayloads: StrapiOutputsListUnknown[] = [first];
  if (pageCount > 1) {
    const restPages = Array.from(
      { length: pageCount - 1 },
      (_, i) => i + 2,
    );
    const rest = await fetchStrapiOutputPagesBatched(restPages, pageSize);
    pagePayloads.push(...rest);
  }

  const mergedData: unknown[] = [];
  for (const payload of pagePayloads) {
    if (Array.isArray(payload.data)) mergedData.push(...payload.data);
  }

  const rows = mapStrapiOutputsPayloadToContentRows(mergedData);

  return {
    rows,
    total: total > 0 ? total : rows.length,
    durationMs: Math.round(performance.now() - started),
  };
}

/**
 * One output by `documentId` — full populate for preview (body, resources, media).
 */
export async function fetchStrapiOutputDetailByDocumentId(
  documentId: string,
): Promise<ContentRow | null> {
  const trimmed = documentId.trim();
  if (!trimmed) return null;

  const base = strapiBaseUrl();
  const token = process.env.STRAPI_API_TOKEN?.trim();

  const params = new URLSearchParams();
  params.append("status", strapiOutputsListStatus());
  params.append("pagination[pageSize]", "1");
  params.append("filters[documentId][$eq]", trimmed);
  appendOutputsDetailPopulate(params);

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
  const first = data[0];
  if (!first || typeof first !== "object") return null;

  return mapStrapiOutputToContentRow(first as Record<string, unknown>);
}
