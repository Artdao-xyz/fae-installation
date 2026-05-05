import { NextResponse } from "next/server";
import { fetchStrapiOutputDetailByDocumentId } from "@/lib/strapi/fetch-outputs-list";

/**
 * Strapi output for preview (one row). Text/body, media, taxonomies, and `Source` → `resources`
 * use the same detail populate (including hover prefetch of body text + sources in one request).
 */
export async function GET(
  _request: Request,
  segmentContext: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await segmentContext.params;
  try {
    const row = await fetchStrapiOutputDetailByDocumentId(documentId, {
      includeSources: true,
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
