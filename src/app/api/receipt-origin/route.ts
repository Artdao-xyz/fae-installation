import { NextResponse } from "next/server";
import { resolveReceiptViewOriginFromRequest } from "@/lib/session-receipt/resolve-view-origin-server";

export async function GET(request: Request) {
  return NextResponse.json({
    origin: resolveReceiptViewOriginFromRequest(request),
  });
}
