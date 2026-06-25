import { INSTALLATION_ADMIN_PIN_HEADER } from "./constants";
import { resolveAdminPin } from "./config";

const PIN_HEADER = INSTALLATION_ADMIN_PIN_HEADER;

export function adminPinFromRequest(request: Request): string | null {
  return request.headers.get(PIN_HEADER)?.trim() || null;
}

export function isAdminAuthorized(request: Request): boolean {
  const pin = adminPinFromRequest(request);
  if (!pin) return false;
  return pin === resolveAdminPin();
}

export function unauthorizedAdminResponse(): Response {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
