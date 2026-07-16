import { NextResponse } from "next/server";
import { decodeReceiptPayload } from "@/lib/session-receipt/encode";
import { hasPathActivity } from "@/lib/session-receipt/path-grid";
import { renderPathStarsSvg } from "@/lib/session-receipt/render-path-stars-svg";
import {
  receiptDigitalStarsWidthPx,
  thermalContentWidthPx,
} from "@/lib/session-receipt/thermal-spec";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const d = searchParams.get("d")?.trim();
  if (!d) {
    return NextResponse.json({ error: "Missing d" }, { status: 400 });
  }

  const receipt = decodeReceiptPayload(d);
  const path = receipt?.path;
  if (!path || !hasPathActivity(path)) {
    return NextResponse.json({ error: "No path data" }, { status: 404 });
  }

  const widthParam = Number(searchParams.get("w"));
  const scaleParam = Math.max(1, Number(searchParams.get("s")) || 1);
  const widthPx =
    Number.isFinite(widthParam) && widthParam > 0
      ? Math.round(widthParam)
      : scaleParam > 1
        ? receiptDigitalStarsWidthPx()
        : Math.round(thermalContentWidthPx() * scaleParam);

  const svg = renderPathStarsSvg(path, widthPx);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
