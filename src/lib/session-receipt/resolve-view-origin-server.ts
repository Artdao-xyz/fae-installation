import { resolveReceiptViewBaseUrl } from "@/lib/installation/config";
import { listLocalIPv4 } from "@/lib/installation/status";
import {
  isReceiptOriginOverride,
  isIgnoredLanReceiptOrigin,
  isPrivateLanIPv4,
} from "@/lib/session-receipt/resolve-view-origin";

export { isReceiptOriginOverride, isIgnoredLanReceiptOrigin, isPrivateLanIPv4 };

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** Origin phones should use to open `/v` — for print API and receipt-origin. */
export function resolveReceiptViewOriginFromRequest(request: Request): string {
  const configured = resolveReceiptViewBaseUrl();
  if (configured && isReceiptOriginOverride(configured)) {
    return stripTrailingSlash(configured);
  }

  const host = request.headers.get("host")?.trim() ?? "";
  const proto =
    request.headers.get("x-forwarded-proto")?.trim().split(",")[0] ?? "http";
  const [hostname, port = "3000"] = host.split(":");

  if (hostname && !LOCAL_HOSTNAMES.has(hostname)) {
    return `${proto}://${host}`;
  }

  const lanIp = listLocalIPv4()[0];
  if (lanIp) {
    return `http://${lanIp}:${port}`;
  }

  return `http://localhost:${port}`;
}
