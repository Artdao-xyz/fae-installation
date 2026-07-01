import { readInstallationConfig, DEFAULT_RECEIPT_PRINT_MODE } from "@/lib/installation/config";
import type { SessionReceipt } from "../types";
import {
  buildSessionReceiptEscPosBuffer as buildSessionReceiptEscPosBufferText,
  printSessionReceiptToInterface as printSessionReceiptToInterfaceText,
} from "./print-receipt";
import {
  buildSessionReceiptEscPosBufferRaster,
  printSessionReceiptToInterfaceRaster,
} from "./print-receipt-raster";

export type { ReceiptPrintMode } from "@/lib/installation/constants";
export { DEFAULT_RECEIPT_PRINT_MODE } from "@/lib/installation/constants";

export function resolveReceiptPrintMode(): import("@/lib/installation/constants").ReceiptPrintMode {
  const fromConfig = readInstallationConfig().receiptPrintMode;
  if (fromConfig === "raster" || fromConfig === "escpos-text") {
    return fromConfig;
  }

  const fromEnv = process.env.RECEIPT_PRINT_MODE?.trim();
  if (fromEnv === "raster" || fromEnv === "escpos-text") {
    return fromEnv;
  }

  return DEFAULT_RECEIPT_PRINT_MODE;
}

export function isRasterReceiptPrintMode(): boolean {
  return resolveReceiptPrintMode() === "raster";
}

/** Build ESC/POS bytes using the configured receipt print mode. */
export async function buildSessionReceiptEscPosBuffer(
  receipt: SessionReceipt,
  viewOrigin?: string,
): Promise<Buffer> {
  if (isRasterReceiptPrintMode()) {
    return buildSessionReceiptEscPosBufferRaster(receipt, viewOrigin);
  }
  return buildSessionReceiptEscPosBufferText(receipt, viewOrigin);
}

/** Print a session receipt using the configured receipt print mode. */
export async function printSessionReceiptToInterface(
  receipt: SessionReceipt,
  printerInterface: string,
  viewOrigin?: string,
): Promise<void> {
  if (isRasterReceiptPrintMode()) {
    return printSessionReceiptToInterfaceRaster(
      receipt,
      printerInterface,
      viewOrigin,
    );
  }
  return printSessionReceiptToInterfaceText(receipt, printerInterface, viewOrigin);
}

export { buildSessionReceiptRaster } from "./raster-receipt-layout";
