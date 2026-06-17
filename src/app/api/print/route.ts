import { NextResponse } from "next/server";
import { logSessionReceiptServer } from "@/lib/session-receipt/log";
import { isLocalReceiptOrigin } from "@/lib/session-receipt/resolve-view-origin";
import { resolveReceiptViewOriginFromRequest } from "@/lib/session-receipt/resolve-view-origin-server";
import { printSessionReceiptToInterface } from "@/lib/session-receipt/thermal-print/print-receipt";
import type { SessionReceipt } from "@/lib/session-receipt/types";

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

export const runtime = "nodejs";

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

  logSessionReceiptServer("POST /api/print", body);

  const headerOrigin = request.headers.get("x-receipt-view-origin")?.trim();
  const viewOrigin =
    headerOrigin && !isLocalReceiptOrigin(headerOrigin)
      ? headerOrigin
      : resolveReceiptViewOriginFromRequest(request);

  const printerInterface = process.env.RECEIPT_PRINTER_INTERFACE?.trim();
  const printerUrl = process.env.RECEIPT_PRINTER_URL?.trim();

  if (printerInterface) {
    try {
      await printSessionReceiptToInterface(body, printerInterface, viewOrigin);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Local printer failed";
      return NextResponse.json({ ok: false, error: message }, { status: 502 });
    }
  }

  if (!printerUrl) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Printer not configured (set RECEIPT_PRINTER_INTERFACE for USB/local, or RECEIPT_PRINTER_URL to forward)",
      },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(printerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: text || `Printer returned ${res.status}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Printer unreachable" },
      { status: 503 },
    );
  }
}
