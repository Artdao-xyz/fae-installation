import { NextResponse } from "next/server";
import {
  isAdminAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/installation/auth";
import {
  recordPrintResult,
  resolvePrinterInterface,
} from "@/lib/installation/config";
import { printInstallationTestPage } from "@/lib/installation/print-test";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const override =
    body &&
    typeof body === "object" &&
    "printerInterface" in body &&
    typeof (body as { printerInterface: unknown }).printerInterface === "string"
      ? (body as { printerInterface: string }).printerInterface.trim()
      : "";

  const printerInterface = override || resolvePrinterInterface();
  if (!printerInterface) {
    return NextResponse.json(
      { ok: false, error: "No printer configured" },
      { status: 400 },
    );
  }

  try {
    await printInstallationTestPage(printerInterface);
    recordPrintResult(true);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Test print failed";
    recordPrintResult(false, message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
