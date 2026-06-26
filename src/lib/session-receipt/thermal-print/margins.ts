import type { StarRaster } from "../rasterize-path-stars";
import {
  THERMAL_CHARS_AT_FULL_BLEED,
  THERMAL_CHARS_PER_LINE,
  THERMAL_CONTENT_DOTS,
  THERMAL_HORIZONTAL_MARGIN_DOTS,
  THERMAL_LINE_DOTS,
  THERMAL_MARGIN_CHARS,
} from "../thermal-spec";

const MARGIN_SPACES = " ".repeat(THERMAL_MARGIN_CHARS);

/** Left-pad a content line so it prints inset (works without GS L / GS W). */
export function padThermalLineLeft(text: string): string {
  const trimmed = text.slice(0, THERMAL_CHARS_PER_LINE);
  return `${MARGIN_SPACES}${trimmed}`.slice(0, THERMAL_CHARS_AT_FULL_BLEED);
}

/** Left-pad without truncating — use when the printer should word-wrap. */
export function padThermalLineStart(text: string): string {
  return `${MARGIN_SPACES}${text}`;
}

/** Center within the inset content column, then pad to full paper width. */
export function padThermalLineCenter(text: string): string {
  const trimmed = text.slice(0, THERMAL_CHARS_PER_LINE);
  const innerPad = Math.max(0, Math.floor((THERMAL_CHARS_PER_LINE - trimmed.length) / 2));
  const line = `${MARGIN_SPACES}${" ".repeat(innerPad)}${trimmed}`;
  return line.slice(0, THERMAL_CHARS_AT_FULL_BLEED);
}

/** Horizontal rule matching preview dividers, inset from paper edges. */
export function thermalDividerLine(maxChars = THERMAL_CHARS_PER_LINE): string {
  return padThermalLineLeft("-".repeat(Math.min(maxChars, THERMAL_CHARS_PER_LINE)));
}

/** Embed a content-width raster inside full paper width with side margins. */
export function insetRasterHorizontally(
  raster: StarRaster,
  leftMarginDots = THERMAL_HORIZONTAL_MARGIN_DOTS,
  fullWidthDots = THERMAL_LINE_DOTS,
): StarRaster {
  if (leftMarginDots === 0 && raster.widthDots === fullWidthDots) return raster;

  const { heightDots, widthDots, data } = raster;
  const bytesPerRow = Math.ceil(fullWidthDots / 8);
  const out = new Uint8Array(bytesPerRow * heightDots);
  const srcBytesPerRow = raster.bytesPerRow;

  for (let y = 0; y < heightDots; y++) {
    for (let x = 0; x < widthDots; x++) {
      const srcByteIdx = y * srcBytesPerRow + Math.floor(x / 8);
      const srcBit = 7 - (x % 8);
      if (((data[srcByteIdx] ?? 0) >> srcBit) & 1) {
        const destX = x + leftMarginDots;
        const destByteIdx = y * bytesPerRow + Math.floor(destX / 8);
        const destBit = 7 - (destX % 8);
        out[destByteIdx] = (out[destByteIdx] ?? 0) | (1 << destBit);
      }
    }
  }

  return { widthDots: fullWidthDots, heightDots, bytesPerRow, data: out };
}

/** Center a raster within the inset content column on full paper width. */
export function centerRasterOnPaper(raster: StarRaster): StarRaster {
  const left =
    THERMAL_HORIZONTAL_MARGIN_DOTS +
    Math.max(0, Math.floor((THERMAL_CONTENT_DOTS - raster.widthDots) / 2));
  return insetRasterHorizontally(raster, left, THERMAL_LINE_DOTS);
}
