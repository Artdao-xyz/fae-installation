import { NextResponse } from "next/server";
import { getCachedStrapiTaxonomyOptionLabels } from "@/lib/strapi/fetch-outputs-list";

/**
 * CMS taxonomy lists for filter sidebars (parallel Strapi fetches server-side, short-lived cache).
 * Safe to call in parallel with `/api/strapi/outputs` from the client.
 */
export async function GET() {
  try {
    const started = performance.now();
    const {
      focusOptionLabels,
      activityOptionLabels,
      formatOptionLabels,
      networkOptionLabels,
      artistOptionLabels,
    } = await getCachedStrapiTaxonomyOptionLabels();

    const durationMs = Math.round(performance.now() - started);

    return NextResponse.json({
      durationMs,
      focusOptionLabels,
      activityOptionLabels,
      formatOptionLabels,
      networkOptionLabels,
      artistOptionLabels,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
