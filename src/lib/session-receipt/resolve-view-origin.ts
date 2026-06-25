const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const RECEIPT_ORIGIN_LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.has(hostname.toLowerCase());
}

export function isPrivateLanIPv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return false;
  }
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

/** Custom hostname override (not localhost / LAN IP — those are auto-detected). */
export function isReceiptOriginOverride(configured: string): boolean {
  try {
    const hostname = new URL(configured).hostname.toLowerCase();
    if (RECEIPT_ORIGIN_LOCAL_HOSTNAMES.has(hostname)) return false;
    if (isPrivateLanIPv4(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Saved LAN IPs are ignored — QR always uses the machine's current address. */
export function isIgnoredLanReceiptOrigin(
  configured: string | undefined | null,
): boolean {
  const trimmed = configured?.trim();
  if (!trimmed) return false;
  return !isReceiptOriginOverride(trimmed);
}

export function isLocalReceiptOrigin(origin: string): boolean {
  try {
    return isLocalHostname(new URL(origin).hostname);
  } catch {
    return true;
  }
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Best-effort QR scan target. Priority:
 * 1. Browser origin when the kiosk is opened via LAN IP or hostname (not localhost)
 * 2. `NEXT_PUBLIC_RECEIPT_VIEW_BASE_URL` when the kiosk runs on localhost
 * 3. `resolvedOrigin` from `/api/receipt-origin` (auto LAN IP on localhost)
 * 4. `window.location.origin` fallback
 */
export function pickReceiptViewOrigin(resolvedOrigin?: string): string {
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (!isLocalHostname(hostname)) {
      return origin;
    }
  }

  const env = process.env.NEXT_PUBLIC_RECEIPT_VIEW_BASE_URL?.trim();
  if (env) return stripTrailingSlash(env);

  if (resolvedOrigin) return stripTrailingSlash(resolvedOrigin);

  return typeof window !== "undefined" ? window.location.origin : "";
}

let inflight: Promise<string> | null = null;

/** Server-detected LAN origin — used when the kiosk browser is on localhost. */
export async function fetchReceiptViewOrigin(): Promise<string> {
  if (inflight) return inflight;

  inflight = fetch("/api/receipt-origin")
    .then(async (res) => {
      if (!res.ok) throw new Error("receipt-origin failed");
      const data = (await res.json()) as { origin?: string };
      const origin =
        typeof data.origin === "string" && data.origin.length > 0
          ? stripTrailingSlash(data.origin)
          : pickReceiptViewOrigin();
      return origin;
    })
    .catch(() => pickReceiptViewOrigin())
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
