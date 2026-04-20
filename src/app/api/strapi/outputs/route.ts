import { NextResponse } from "next/server";
import { fetchStrapiOutputsCatalogOnly } from "@/lib/strapi/fetch-outputs-list";

/**
 * Returns mapped `ContentRow[]` for the whole Strapi catalog (all pages merged server-side).
 * Taxonomy option lists are served from `GET /api/strapi/taxonomy-options` so the client can
 * paint particles first, then hydrate filters without one oversized payload.
 */
export async function GET() {
  try {
    const { rows, total, durationMs } = await fetchStrapiOutputsCatalogOnly();

    if (process.env.NODE_ENV === "development") {
      const resolvedStatus =
        process.env.STRAPI_OUTPUTS_STATUS?.trim().toLowerCase() === "published"
          ? "published"
          : "draft";
      console.info("[Strapi] outputs catalog", {
        rowCount: rows.length,
        total,
        durationMs,
        status: resolvedStatus,
      });
    }

    return NextResponse.json({ rows, total, durationMs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Strapi] outputs catalog error", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
