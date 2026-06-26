import QRCode from "qrcode";
import type { StarRaster } from "../rasterize-path-stars";
import {
  THERMAL_DOTS_PER_MM,
  THERMAL_QR_SIZE_MM,
} from "../thermal-spec";

/** Fixed QR width on paper — minimum legible size (~25 mm on CSN-A4L). */
export const THERMAL_QR_PRINT_DOTS = Math.round(
  THERMAL_QR_SIZE_MM * THERMAL_DOTS_PER_MM,
);

const QUIET_ZONE_MODULES = 4;

function setPixel(
  bitmap: Uint8Array,
  widthDots: number,
  x: number,
  y: number,
): void {
  if (x < 0 || y < 0 || x >= widthDots) return;
  const bytesPerRow = Math.ceil(widthDots / 8);
  if (y >= bitmap.length / bytesPerRow) return;
  const byteIdx = y * bytesPerRow + Math.floor(x / 8);
  const bit = 7 - (x % 8);
  bitmap[byteIdx] = (bitmap[byteIdx] ?? 0) | (1 << bit);
}

/** 1-bit QR raster at fixed thermal size (replaces native ESC/POS QR for margin control). */
export function rasterizeQrCode(url: string): StarRaster {
  const qr = QRCode.create(url, { errorCorrectionLevel: "L" });
  const modules = qr.modules;
  const moduleCount = modules.size;
  const gridModules = moduleCount + QUIET_ZONE_MODULES * 2;
  const moduleDots = Math.max(
    1,
    Math.floor(THERMAL_QR_PRINT_DOTS / gridModules),
  );
  const widthDots = gridModules * moduleDots;
  const heightDots = widthDots;
  const bytesPerRow = Math.ceil(widthDots / 8);
  const data = new Uint8Array(bytesPerRow * heightDots);

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!modules.get(row, col)) continue;
      const x0 = (col + QUIET_ZONE_MODULES) * moduleDots;
      const y0 = (row + QUIET_ZONE_MODULES) * moduleDots;
      for (let dy = 0; dy < moduleDots; dy++) {
        for (let dx = 0; dx < moduleDots; dx++) {
          setPixel(data, widthDots, x0 + dx, y0 + dy);
        }
      }
    }
  }

  return { widthDots, heightDots, bytesPerRow, data };
}
