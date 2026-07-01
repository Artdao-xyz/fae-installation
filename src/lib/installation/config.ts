import fs from "node:fs";
import path from "node:path";
import { type ReceiptPrintMode } from "./constants";

export type { ReceiptPrintMode } from "./constants";
export { DEFAULT_RECEIPT_PRINT_MODE } from "./constants";

export type InstallationConfig = {
  /** CUPS name (`printer:Name`) or Linux device (`/dev/usb/lp0`). */
  printerInterface?: string;
  /** `raster` (default) or `escpos-text` — see thermal-print/receipt-print.ts */
  receiptPrintMode?: ReceiptPrintMode;
  /** Optional custom hostname for receipt QR codes (LAN IPs are auto-detected). */
  receiptViewBaseUrl?: string;
  /** PIN for /admin and admin APIs. Default: `fae`. */
  adminPin?: string;
  lastPrintError?: string;
  lastPrintAt?: string;
  lastPrintOk?: boolean;
};

const CONFIG_FILENAME = "installation.local.json";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function installationConfigPath(): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), CONFIG_FILENAME);
}

export function readInstallationConfig(): InstallationConfig {
  try {
    const raw = fs.readFileSync(installationConfigPath(), "utf8");
    return JSON.parse(raw) as InstallationConfig;
  } catch {
    return {};
  }
}

export function writeInstallationConfig(config: InstallationConfig): void {
  fs.writeFileSync(
    installationConfigPath(),
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8",
  );
}

export function patchInstallationConfig(
  patch: Partial<InstallationConfig>,
): InstallationConfig {
  const next = { ...readInstallationConfig(), ...patch };
  writeInstallationConfig(next);
  return next;
}

export function resolveAdminPin(): string {
  const fromConfig = readInstallationConfig().adminPin?.trim();
  if (fromConfig) return fromConfig;
  const fromEnv = process.env.INSTALLATION_ADMIN_PIN?.trim();
  if (fromEnv) return fromEnv;
  return "fae";
}

export function resolvePrinterInterface(): string | undefined {
  const fromConfig = readInstallationConfig().printerInterface?.trim();
  if (fromConfig) return fromConfig;
  const fromEnv = process.env.RECEIPT_PRINTER_INTERFACE?.trim();
  if (fromEnv) return fromEnv;
  return undefined;
}

export function resolvePrinterUrl(): string | undefined {
  return process.env.RECEIPT_PRINTER_URL?.trim() || undefined;
}

export function resolveReceiptViewBaseUrl(): string | undefined {
  const fromConfig = readInstallationConfig().receiptViewBaseUrl?.trim();
  if (fromConfig) return stripTrailingSlash(fromConfig);
  const fromEnv = process.env.NEXT_PUBLIC_RECEIPT_VIEW_BASE_URL?.trim();
  if (fromEnv) return stripTrailingSlash(fromEnv);
  return undefined;
}

export function recordPrintResult(ok: boolean, error?: string): void {
  const config = readInstallationConfig();
  config.lastPrintAt = new Date().toISOString();
  config.lastPrintOk = ok;
  config.lastPrintError = ok ? undefined : error;
  writeInstallationConfig(config);
}
