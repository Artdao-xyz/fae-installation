import QRCode, { type QRCodeErrorCorrectionLevel } from "qrcode";
import {
  THERMAL_CONTENT_DOTS,
  THERMAL_QR_MIN_MODULE_DOTS,
  THERMAL_QR_PRINT_DOTS,
  THERMAL_QR_PRINT_ERROR_CORRECTION,
} from "./thermal-spec";

const DIGITAL_QR_ERROR_CORRECTION = "L" as const;

/** Quiet zone around QR modules in print rasters (modules). */
export const THERMAL_QR_QUIET_ZONE_MODULES = 4;

export type ThermalPrintQrLayout = {
  moduleCount: number;
  gridModules: number;
  moduleDots: number;
  widthDots: number;
};

function createQrMatrix(url: string, ecc: QRCodeErrorCorrectionLevel) {
  return QRCode.create(url, { errorCorrectionLevel: ecc });
}

/** Layout for thermal print — fills target width, capped to content column. */
export function thermalPrintQrLayout(url: string): ThermalPrintQrLayout {
  const qr = createQrMatrix(url, THERMAL_QR_PRINT_ERROR_CORRECTION);
  const moduleCount = qr.modules.size;
  const gridModules = moduleCount + THERMAL_QR_QUIET_ZONE_MODULES * 2;
  let moduleDots = Math.max(
    THERMAL_QR_MIN_MODULE_DOTS,
    Math.round(THERMAL_QR_PRINT_DOTS / gridModules),
  );
  let widthDots = gridModules * moduleDots;
  if (widthDots > THERMAL_CONTENT_DOTS) {
    moduleDots = Math.max(
      THERMAL_QR_MIN_MODULE_DOTS,
      Math.floor(THERMAL_CONTENT_DOTS / gridModules),
    );
    widthDots = gridModules * moduleDots;
  }
  return { moduleCount, gridModules, moduleDots, widthDots };
}

/** Digital / on-screen — matrix can be allocated at ECC L. */
export function receiptUrlFitsInQr(url: string): boolean {
  try {
    createQrMatrix(url, DIGITAL_QR_ERROR_CORRECTION);
    return true;
  } catch {
    return false;
  }
}

/**
 * Practical thermal-print density — phones tolerate denser codes than
 * {@link receiptUrlFitsThermalPrintQr}. Used to decide when the star map can
 * ride along in the print QR (~QR version 15–16).
 */
export const THERMAL_PRINT_QR_MAX_MODULES = 85;

export function receiptUrlAcceptableForThermalPrint(url: string): boolean {
  try {
    const { moduleCount, widthDots } = thermalPrintQrLayout(url);
    return (
      moduleCount <= THERMAL_PRINT_QR_MAX_MODULES &&
      widthDots <= THERMAL_CONTENT_DOTS
    );
  } catch {
    return false;
  }
}

/**
 * Thermal print — ECC M, minimum module dots, and target width within content column.
 * Used to trim print URLs without affecting digital QR payloads.
 */
export function receiptUrlFitsThermalPrintQr(url: string): boolean {
  try {
    const { gridModules, widthDots } = thermalPrintQrLayout(url);
    const maxGridAtMinModule = Math.floor(
      THERMAL_QR_PRINT_DOTS / THERMAL_QR_MIN_MODULE_DOTS,
    );
    return gridModules <= maxGridAtMinModule && widthDots <= THERMAL_CONTENT_DOTS;
  } catch {
    return false;
  }
}
