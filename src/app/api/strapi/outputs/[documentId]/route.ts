import { NextResponse } from "next/server";
import { fetchStrapiOutputDetailByDocumentId } from "@/lib/strapi/fetch-outputs-list";

/**
 * Full Strapi output for preview (Text blocks, resources, full media).
 * Catalog rows from `GET /api/strapi/outputs` are intentionally slim.
 */
export async function GET(
  _request: Request,
  segmentContext: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await segmentContext.params;
  try {
    const row = await fetchStrapiOutputDetailByDocumentId(documentId);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Strapi] output detail error", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
