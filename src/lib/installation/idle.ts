/** Default inactivity period before the installation screensaver appears. */
export const DEFAULT_INSTALLATION_IDLE_TIMEOUT_MS = 120_000;

/** How long the receipt screen may sit open before auto-reset. */
export const DEFAULT_RECEIPT_IDLE_TIMEOUT_MS = 90_000;

/** Warn this many ms before the main idle timeout fires during an active session. */
export const DEFAULT_IDLE_WARNING_BEFORE_MS = 30_000;

/** Client-side cap on `/api/print` requests. */
export const DEFAULT_PRINT_REQUEST_TIMEOUT_MS = 35_000;

function parsePositiveIntEnv(
  raw: string | undefined,
  fallback: number,
  min: number,
): number {
  if (!raw?.trim()) return fallback;
  const parsed = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < min) return fallback;
  return parsed;
}

export function resolveInstallationIdleTimeoutMs(): number {
  return parsePositiveIntEnv(
    process.env.NEXT_PUBLIC_INSTALLATION_IDLE_TIMEOUT_MS,
    DEFAULT_INSTALLATION_IDLE_TIMEOUT_MS,
    10_000,
  );
}

export function resolveReceiptIdleTimeoutMs(): number {
  return parsePositiveIntEnv(
    process.env.NEXT_PUBLIC_INSTALLATION_RECEIPT_IDLE_TIMEOUT_MS,
    DEFAULT_RECEIPT_IDLE_TIMEOUT_MS,
    15_000,
  );
}

export function resolveIdleWarningBeforeMs(): number {
  const idleMs = resolveInstallationIdleTimeoutMs();
  const warningMs = parsePositiveIntEnv(
    process.env.NEXT_PUBLIC_INSTALLATION_IDLE_WARNING_MS,
    DEFAULT_IDLE_WARNING_BEFORE_MS,
    5_000,
  );
  return Math.min(warningMs, idleMs - 5_000);
}

export function resolvePrintRequestTimeoutMs(): number {
  return parsePositiveIntEnv(
    process.env.NEXT_PUBLIC_INSTALLATION_PRINT_TIMEOUT_MS,
    DEFAULT_PRINT_REQUEST_TIMEOUT_MS,
    10_000,
  );
}
