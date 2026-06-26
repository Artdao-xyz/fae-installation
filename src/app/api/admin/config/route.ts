import { NextResponse } from "next/server";
import {
  isAdminAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/installation/auth";
import {
  patchInstallationConfig,
  readInstallationConfig,
  resolvePrinterInterface,
} from "@/lib/installation/config";

export const runtime = "nodejs";

type ConfigPatch = {
  printerInterface?: string;
  receiptPrintMode?: "escpos-text" | "raster";
  receiptViewBaseUrl?: string;
  adminPin?: string;
};

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "";
}

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  return NextResponse.json({
    ok: true,
    config: readInstallationConfig(),
    printerInterface: resolvePrinterInterface() ?? null,
  });
}

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const patch = body as ConfigPatch;
  const nextPatch: ConfigPatch = {};

  if ("printerInterface" in patch) {
    nextPatch.printerInterface = normalizeOptionalString(patch.printerInterface);
  }
  if ("receiptViewBaseUrl" in patch) {
    nextPatch.receiptViewBaseUrl = normalizeOptionalString(
      patch.receiptViewBaseUrl,
    );
  }
  if ("receiptPrintMode" in patch) {
    const mode = patch.receiptPrintMode;
    if (mode !== "escpos-text" && mode !== "raster") {
      return NextResponse.json(
        { ok: false, error: "receiptPrintMode must be escpos-text or raster" },
        { status: 400 },
      );
    }
    nextPatch.receiptPrintMode = mode;
  }
  if ("adminPin" in patch) {
    const pin = normalizeOptionalString(patch.adminPin);
    if (pin && pin.length < 3) {
      return NextResponse.json(
        { ok: false, error: "PIN must be at least 3 characters" },
        { status: 400 },
      );
    }
    nextPatch.adminPin = pin;
  }

  const config = patchInstallationConfig(nextPatch);
  return NextResponse.json({
    ok: true,
    config,
    printerInterface: resolvePrinterInterface() ?? null,
  });
}
