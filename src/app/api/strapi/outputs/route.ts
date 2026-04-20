import { NextResponse } from "next/server";
import { fetchStrapiOutputsAllMapped } from "@/lib/strapi/fetch-outputs-list";

/**
 * Returns mapped `ContentRow[]` for the whole Strapi catalog (all pages merged server-side).
 * Token stays on the server; upstream Strapi fetches are cached via `next.revalidate`.
 */
export async function GET() {
  try {
    const {
      rows,
      total,
      durationMs,
      focusOptionLabels,
      activityOptionLabels,
      formatOptionLabels,
      networkOptionLabels,
      artistOptionLabels,
    } = await fetchStrapiOutputsAllMapped();

    if (process.env.NODE_ENV === "development") {
      const resolvedStatus =
        process.env.STRAPI_OUTPUTS_STATUS?.trim().toLowerCase() === "published"
          ? "published"
          : "draft";
      console.info("[Strapi] outputs catalog", {
        rowCount: rows.length,
        total,
        durationMs,
        focusOptionsCount: focusOptionLabels.length,
        activityOptionsCount: activityOptionLabels.length,
        formatOptionsCount: formatOptionLabels.length,
        networkOptionsCount: networkOptionLabels.length,
        artistOptionsCount: artistOptionLabels.length,
        status: resolvedStatus,
      });
    }

    return NextResponse.json({
      rows,
      total,
      durationMs,
      focusOptionLabels,
      activityOptionLabels,
      formatOptionLabels,
      networkOptionLabels,
      artistOptionLabels,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Strapi] outputs catalog error", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
