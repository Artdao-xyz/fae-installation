/**
 * Server-only Strapi `outputs` list fetch (Strapi v5).
 *
 * Data flow:
 * - **Catalog**: `FilterSelectionProvider` → one `GET /api/strapi/outputs` → mapped `ContentRow[]`.
 * - **Taxonomy chips**: parallel Strapi list fetches (`focus-options`, `activity-options`,
 *   `format-options`, `networks`, `artists`) with the same `status` as outputs; merged with row data client-side.
 *
 * Outputs use explicit `populate[Relation]=true` and no `fields` restriction so relations
 * like `Format` are not stripped by field selection. The Output→Artist link is optional:
 * set `STRAPI_OUTPUTS_ARTIST_RELATION` to that field’s exact name, or omit it if there is no relation.
 */

import {
  mapStrapiOutputsPayloadToContentRows,
  strapiDocumentDisplayName,
} from "@/lib/strapi/map-output-to-content-row";
import type { ContentRow } from "@/data/content-types";

const DEFAULT_PAGE_SIZE = 100;
const STRAPI_REVALIDATE_SECONDS = 300;

export type StrapiOutputsListUnknown = {
  data?: unknown;
  meta?: unknown;
  error?: unknown;
};

function strapiBaseUrl(): string {
  const raw = process.env.STRAPI_URL?.trim();
  if (!raw) throw new Error("STRAPI_URL is not set");
  return raw.replace(/\/$/, "");
}

/**
 * Strapi 5 Content API defaults to `published` only. Draft rows need `status=draft`.
 * @see https://docs.strapi.io/cms/api/rest/status
 */
function strapiOutputsListStatus(): "draft" | "published" {
  const raw = process.env.STRAPI_OUTPUTS_STATUS?.trim().toLowerCase();
  return raw === "published" ? "published" : "draft";
}

function outputsPageSearchParams(page: number, pageSize: number): string {
  const params = new URLSearchParams();
  params.append("status", strapiOutputsListStatus());
  params.append("pagination[page]", String(page));
  params.append("pagination[pageSize]", String(pageSize));
  params.append("sort[0]", "Index:asc");

  params.append("populate[Image]", "true");
  params.append("populate[Thumbnail]", "true");
  params.append("populate[Focus]", "true");
  params.append("populate[Activity]", "true");
  params.append("populate[Network]", "true");
  params.append("populate[Format]", "true");

  /** Must match the **attribute name** on the Output type in Strapi (Content-Type Builder). */
  const outputArtistRelation = process.env.STRAPI_OUTPUTS_ARTIST_RELATION?.trim();
  if (outputArtistRelation) {
    params.append(`populate[${outputArtistRelation}]`, "true");
  }

  return params.toString();
}

async function fetchStrapiOutputsPageJson(
  page: number,
  pageSize: number,
): Promise<StrapiOutputsListUnknown> {
  const base = strapiBaseUrl();
  const token = process.env.STRAPI_API_TOKEN?.trim();

  const url = `${base}/api/outputs?${outputsPageSearchParams(page, pageSize)}`;
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

    const out: string[] = [];
    for (const item of data) {
      const name = strapiDocumentDisplayName(item);
      if (name) out.push(name);
    }
    return out;
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

/**
 * Fetches every outputs page plus taxonomy option lists (parallel where possible).
 * Cached per-request via `next.revalidate` on each upstream `fetch`.
 */
export async function fetchStrapiOutputsAllMapped(options?: {
  pageSize?: number;
}): Promise<{
  rows: ContentRow[];
  total: number;
  durationMs: number;
  focusOptionLabels: string[];
  activityOptionLabels: string[];
  formatOptionLabels: string[];
  networkOptionLabels: string[];
  artistOptionLabels: string[];
}> {
  const started = performance.now();
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  const [
    first,
    focusOptionLabels,
    activityOptionLabels,
    formatOptionLabels,
    networkOptionLabels,
    artistOptionLabels,
  ] = await Promise.all([
    fetchStrapiOutputsPageJson(1, pageSize),
    fetchStrapiSortedOptionLabels("focus-options"),
    fetchStrapiSortedOptionLabels("activity-options"),
    fetchStrapiSortedOptionLabels("format-options"),
    fetchStrapiSortedOptionLabels("networks"),
    fetchStrapiSortedOptionLabels("artists"),
  ]);

  const { pageCount, total } = readPagination(first);

  const pagePayloads: StrapiOutputsListUnknown[] = [first];
  if (pageCount > 1) {
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, i) =>
        fetchStrapiOutputsPageJson(i + 2, pageSize),
      ),
    );
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
    focusOptionLabels,
    activityOptionLabels,
    formatOptionLabels,
    networkOptionLabels,
    artistOptionLabels,
  };
}
