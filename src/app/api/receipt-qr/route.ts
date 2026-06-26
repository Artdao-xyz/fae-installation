import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { resolveReceiptViewOriginFromRequest } from "@/lib/session-receipt/resolve-view-origin-server";
import {
  RECEIPT_QR_MAX_RENDER_PX,
  RECEIPT_QR_PX,
} from "@/lib/session-receipt/thermal-spec";

const RECEIPT_VIEW_PATH = "/v";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const d = searchParams.get("d")?.trim();
  if (!d) {
    return NextResponse.json({ error: "Missing d" }, { status: 400 });
  }

  const scale = Math.max(1, Number(searchParams.get("s")) || 1);
  const requestedPx = Number(searchParams.get("px"));
  const size = Math.min(
    RECEIPT_QR_MAX_RENDER_PX,
    Math.round(
      Number.isFinite(requestedPx) && requestedPx > 0
        ? requestedPx
        : RECEIPT_QR_PX * scale,
    ),
  );
  const origin = resolveReceiptViewOriginFromRequest(request);
  const scanUrl = `${origin}${RECEIPT_VIEW_PATH}?d=${encodeURIComponent(d)}`;

  try {
    const png = await QRCode.toBuffer(scanUrl, {
      type: "png",
      width: size,
      margin: 1,
      errorCorrectionLevel: "L",
    });

    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "QR render failed" }, { status: 500 });
  }
}
