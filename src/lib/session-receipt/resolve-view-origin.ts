const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.has(hostname.toLowerCase());
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

let cachedOrigin: string | null = null;
let inflight: Promise<string> | null = null;

/** Server-detected LAN origin — used when the kiosk browser is on localhost. */
export async function fetchReceiptViewOrigin(): Promise<string> {
  if (cachedOrigin) return cachedOrigin;
  if (inflight) return inflight;

  inflight = fetch("/api/receipt-origin")
    .then(async (res) => {
      if (!res.ok) throw new Error("receipt-origin failed");
      const data = (await res.json()) as { origin?: string };
      const origin =
        typeof data.origin === "string" && data.origin.length > 0
          ? stripTrailingSlash(data.origin)
          : pickReceiptViewOrigin();
      cachedOrigin = origin;
      return origin;
    })
    .catch(() => {
      const fallback = pickReceiptViewOrigin();
      cachedOrigin = fallback;
      return fallback;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
