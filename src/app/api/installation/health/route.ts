import { NextResponse } from "next/server";
import { getInstallationStatus } from "@/lib/installation/status";

export const runtime = "nodejs";

export async function GET() {
  const status = getInstallationStatus();

  if (!status.installationMode) {
    return NextResponse.json({ ok: true, installationMode: false });
  }

  const contentReady = status.contentSourceReady;
  const printerReady = status.printerConfigured;

  return NextResponse.json({
    ok: contentReady,
    installationMode: true,
    catalogPresent: status.catalogPresent,
    contentSourceReady: contentReady,
    contentSource: status.contentSource,
    printerConfigured: printerReady,
    mediaFileCount: status.mediaFileCount,
    /** Kiosk may run without a printer — digital receipt only. */
    visitorReady: contentReady,
  });
}
