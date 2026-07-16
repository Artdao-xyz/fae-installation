import { NextResponse } from "next/server";
import { resolveReceiptViewOriginFromRequest } from "@/lib/session-receipt/resolve-view-origin-server";
import { isLocalReceiptOrigin } from "@/lib/session-receipt/resolve-view-origin";
import { buildSessionReceiptEscPosBuffer } from "@/lib/session-receipt/thermal-print/receipt-print";
import type { SessionReceipt } from "@/lib/session-receipt/types";

export const runtime = "nodejs";

function isSessionPath(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const p = value as NonNullable<SessionReceipt["path"]>;
  return (
    Array.isArray(p.visits) &&
    typeof p.start === "number" &&
    typeof p.end === "number"
  );
}

function isSessionReceipt(value: unknown): value is SessionReceipt {
  if (!value || typeof value !== "object") return false;
  const r = value as SessionReceipt;
  return (
    typeof r.sessionStart === "string" &&
    Array.isArray(r.events) &&
    typeof r.seed === "number" &&
    typeof r.prompt === "string" &&
    isSessionPath(r.path)
  );
}

/**
 * Export the exact ESC/POS bytes that /api/print would send — for kiosk debugging:
 * curl -o journey.escpos -X POST -H 'Content-Type: application/json' --data @receipt.json \
 *   http://localhost:3000/api/print/escpos
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!isSessionReceipt(body)) {
    return NextResponse.json(
      { ok: false, error: "Invalid receipt payload" },
      { status: 400 },
    );
  }

  const headerOrigin = request.headers.get("x-receipt-view-origin")?.trim();
  const viewOrigin =
    headerOrigin && !isLocalReceiptOrigin(headerOrigin)
      ? headerOrigin
      : resolveReceiptViewOriginFromRequest(request);

  try {
    const buffer = await buildSessionReceiptEscPosBuffer(body, viewOrigin);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="receipt-journey.escpos"',
        "Cache-Control": "no-store",
        "X-Receipt-Escpos-Bytes": String(buffer.length),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ESC/POS export failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
