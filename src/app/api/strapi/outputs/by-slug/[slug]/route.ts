import { NextResponse } from "next/server";
import { fetchStrapiOutputDetailByShareSlug } from "@/lib/strapi/fetch-outputs-list";

export async function GET(
  _request: Request,
  segmentContext: { params: Promise<{ slug: string }> },
) {
  const { slug } = await segmentContext.params;

  try {
    const row = await fetchStrapiOutputDetailByShareSlug(slug);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

