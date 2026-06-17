import { networkInterfaces } from "node:os";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

function isIPv4(family: string | number): boolean {
  return family === "IPv4" || family === 4;
}

function pickLanIPv4(): string | null {
  for (const addrs of Object.values(networkInterfaces())) {
    for (const net of addrs ?? []) {
      if (isIPv4(net.family) && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** Origin phones should use to open `/v` — for print API and receipt-origin. */
export function resolveReceiptViewOriginFromRequest(request: Request): string {
  const env = process.env.NEXT_PUBLIC_RECEIPT_VIEW_BASE_URL?.trim();
  if (env) return stripTrailingSlash(env);

  const host = request.headers.get("host")?.trim() ?? "";
  const proto =
    request.headers.get("x-forwarded-proto")?.trim().split(",")[0] ?? "http";
  const [hostname, port = "3000"] = host.split(":");

  if (hostname && !LOCAL_HOSTNAMES.has(hostname)) {
    return `${proto}://${host}`;
  }

  const lanIp = pickLanIPv4();
  if (lanIp) {
    return `http://${lanIp}:${port}`;
  }

  return `http://localhost:${port}`;
}
