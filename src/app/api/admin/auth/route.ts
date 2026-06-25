import { NextResponse } from "next/server";
import { resolveAdminPin } from "@/lib/installation/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const pin =
    body &&
    typeof body === "object" &&
    "pin" in body &&
    typeof (body as { pin: unknown }).pin === "string"
      ? (body as { pin: string }).pin.trim()
      : "";

  if (!pin || pin !== resolveAdminPin()) {
    return NextResponse.json({ ok: false, error: "Invalid PIN" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
