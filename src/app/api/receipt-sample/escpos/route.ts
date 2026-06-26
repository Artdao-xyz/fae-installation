import { NextResponse } from "next/server";
import { SAMPLE_SESSION_RECEIPT } from "@/lib/session-receipt/sample-receipt";
import { buildSessionReceiptEscPosBuffer } from "@/lib/session-receipt/thermal-print/receipt-print";

export const runtime = "nodejs";

function sampleViewOrigin(request: Request): string {
  const env = process.env.NEXT_PUBLIC_RECEIPT_VIEW_BASE_URL?.trim();
  if (env) return env.replace(/\/$/, "");

  try {
    const { origin } = new URL(request.url);
    return origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function GET(request: Request) {
  try {
    const buffer = await buildSessionReceiptEscPosBuffer(
      SAMPLE_SESSION_RECEIPT,
      sampleViewOrigin(request),
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="receipt-sample.escpos"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ESC/POS export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
