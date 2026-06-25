import { NextResponse } from "next/server";
import {
  isAdminAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/installation/auth";
import { getInstallationStatus } from "@/lib/installation/status";
import {
  isIgnoredLanReceiptOrigin,
  resolveReceiptViewOriginFromRequest,
} from "@/lib/session-receipt/resolve-view-origin-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  const status = getInstallationStatus();
  const receiptOrigin = resolveReceiptViewOriginFromRequest(request);
  const savedQrOrigin = status.receiptViewBaseUrl?.trim() || null;

  return NextResponse.json({
    ok: true,
    status,
    urls: {
      kiosk: receiptOrigin,
      admin: `${receiptOrigin}/admin`,
      receiptViewOrigin: receiptOrigin,
      savedReceiptViewOrigin: savedQrOrigin,
      savedLanOverrideIgnored: isIgnoredLanReceiptOrigin(savedQrOrigin),
    },
  });
}
