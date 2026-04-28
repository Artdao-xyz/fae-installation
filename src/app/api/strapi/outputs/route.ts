import { NextResponse } from "next/server";
import { getCachedStrapiOutputsCatalog } from "@/lib/strapi/fetch-outputs-list";

/**
 * Returns mapped `ContentRow[]` for the whole Strapi catalog (all pages merged server-side).
 * Merged catalog is cached briefly (see `getCachedStrapiOutputsCatalog`) to cut Strapi load.
 * Taxonomy option lists: `GET /api/strapi/taxonomy-options`.
 */
export async function GET() {
  try {
    const { rows, total, durationMs } = await getCachedStrapiOutputsCatalog();

    return NextResponse.json({ rows, total, durationMs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
