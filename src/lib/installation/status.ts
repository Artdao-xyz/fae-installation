import fs from "node:fs";
import { networkInterfaces } from "node:os";
import { isInstallationMode } from "@/lib/installation-mode";
import {
  contentSourceReady,
  getConfiguredDataSource,
  resolveContentSourceKind,
  type ContentSourceKind,
} from "@/lib/local-data";
import { localCatalogExists, localMediaDir } from "@/lib/local-data/paths";
import {
  readInstallationConfig,
  resolvePrinterInterface,
  resolvePrinterUrl,
} from "./config";

function isIPv4(family: string | number): boolean {
  return family === "IPv4" || family === 4;
}

export function listLocalIPv4(): string[] {
  const ips: string[] = [];
  for (const addrs of Object.values(networkInterfaces())) {
    for (const net of addrs ?? []) {
      if (isIPv4(net.family) && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

export function pickLanIPv4(): string | null {
  return listLocalIPv4()[0] ?? null;
}

function countMediaFiles(): number {
  try {
    return fs
      .readdirSync(localMediaDir())
      .filter((name) => !name.startsWith(".")).length;
  } catch {
    return 0;
  }
}

export type InstallationStatus = {
  installationMode: boolean;
  catalogPresent: boolean;
  contentSourceReady: boolean;
  contentSource: ContentSourceKind;
  configuredDataSource: ReturnType<typeof getConfiguredDataSource>;
  mediaFileCount: number;
  printerConfigured: boolean;
  printerInterface: string | null;
  printerUrlConfigured: boolean;
  receiptViewBaseUrl: string | null;
  lanIp: string | null;
  nodeVersion: string;
  config: ReturnType<typeof readInstallationConfig>;
};

export function getInstallationStatus(): InstallationStatus {
  const printerInterface = resolvePrinterInterface() ?? null;
  const config = readInstallationConfig();

  return {
    installationMode: isInstallationMode(),
    catalogPresent: localCatalogExists(),
    contentSourceReady: contentSourceReady(),
    contentSource: resolveContentSourceKind(),
    configuredDataSource: getConfiguredDataSource(),
    mediaFileCount: countMediaFiles(),
    printerConfigured: Boolean(printerInterface || resolvePrinterUrl()),
    printerInterface,
    printerUrlConfigured: Boolean(resolvePrinterUrl()),
    receiptViewBaseUrl: config.receiptViewBaseUrl?.trim() || null,
    lanIp: pickLanIPv4(),
    nodeVersion: process.version,
    config,
  };
}
