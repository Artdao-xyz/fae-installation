import { NextResponse } from "next/server";
import {
  fetchStrapiTaxonomyOptionLabelsStaged,
} from "@/lib/strapi/fetch-outputs-list";

/**
 * CMS taxonomy lists for filter sidebars (staged Strapi fetches server-side).
 * Call after `/api/strapi/outputs` when the catalog is already on-screen.
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
    } = await fetchStrapiTaxonomyOptionLabelsStaged();

    const durationMs = Math.round(performance.now() - started);

    if (process.env.NODE_ENV === "development") {
      console.info("[Strapi] taxonomy options", {
        durationMs,
        focusOptionsCount: focusOptionLabels.length,
        activityOptionsCount: activityOptionLabels.length,
        formatOptionsCount: formatOptionLabels.length,
        networkOptionsCount: networkOptionLabels.length,
        artistOptionsCount: artistOptionLabels.length,
      });
    }

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
    console.error("[Strapi] taxonomy options error", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
