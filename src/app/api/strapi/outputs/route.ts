import { NextResponse } from "next/server";
import { fetchStrapiOutputsCatalogOnly } from "@/lib/strapi/fetch-outputs-list";

/** Always merge fresh pages from Strapi — avoid caching a truncated first page. */
export const dynamic = "force-dynamic";

/**
 * Returns mapped `ContentRow[]` for the whole Strapi catalog (all pages merged server-side).
 * Taxonomy option lists are served from `GET /api/strapi/taxonomy-options` so the client can
 * paint particles first, then hydrate filters without one oversized payload.
 */
export async function GET() {
  try {
    const { rows, total, durationMs } = await fetchStrapiOutputsCatalogOnly();

    return NextResponse.json({ rows, total, durationMs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
