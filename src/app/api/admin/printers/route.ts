import { NextResponse } from "next/server";
import {
  isAdminAuthorized,
  unauthorizedAdminResponse,
} from "@/lib/installation/auth";
import { listAvailablePrinters } from "@/lib/installation/printers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  const printers = await listAvailablePrinters();
  return NextResponse.json({ ok: true, printers });
}
