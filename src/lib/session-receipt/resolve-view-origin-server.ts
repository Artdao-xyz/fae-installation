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

function resolveReceiptViewOriginFromHeaderValues(
  host: string,
  forwardedProto: string | null,
): string {
  const configured = resolveReceiptViewBaseUrl();
  if (configured && isReceiptOriginOverride(configured)) {
    return stripTrailingSlash(configured);
  }

  const trimmedHost = host.trim();
  const proto = forwardedProto?.trim().split(",")[0] ?? "http";
  const [hostname, port = "3000"] = trimmedHost.split(":");

  if (hostname && !LOCAL_HOSTNAMES.has(hostname)) {
    return `${proto}://${trimmedHost}`;
  }

  const lanIp = listLocalIPv4()[0];
  if (lanIp) {
    return `http://${lanIp}:${port}`;
  }

  return `http://localhost:${port}`;
}

/** Origin phones should use to open `/v` — from Next `headers()`. */
export function resolveReceiptViewOriginFromHeaders(
  requestHeaders: Headers,
): string {
  return resolveReceiptViewOriginFromHeaderValues(
    requestHeaders.get("host") ?? "",
    requestHeaders.get("x-forwarded-proto"),
  );
}

/** Origin phones should use to open `/v` — for print API and receipt-origin. */
export function resolveReceiptViewOriginFromRequest(request: Request): string {
  return resolveReceiptViewOriginFromHeaderValues(
    request.headers.get("host") ?? "",
    request.headers.get("x-forwarded-proto"),
  );
}
