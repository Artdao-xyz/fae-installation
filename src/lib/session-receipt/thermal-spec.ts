/**
 * CSN-A4L / 58mm thermal receipt printer (Pi Hut).
 * 384 dots/line @ 8 dots/mm — preview and QR size follow the same proportions.
 */

export const THERMAL_PAPER_WIDTH_MM = 58;
export const THERMAL_DOTS_PER_MM = 8;
export const THERMAL_LINE_DOTS = 384;

/** ~32 monospace characters per line on 58mm paper. */
export const THERMAL_CHARS_PER_LINE = 32;

/** CSS px width for on-screen receipt (matches 58mm at ~96dpi). */
export const RECEIPT_PAPER_WIDTH_PX = Math.round(
  (THERMAL_PAPER_WIDTH_MM / 25.4) * 96,
);

/** Screen preview / digital twin — larger than thermal, same proportions. */
export const RECEIPT_DIGITAL_SCALE = 1.75;

export const RECEIPT_DIGITAL_WIDTH_PX = Math.round(
  RECEIPT_PAPER_WIDTH_PX * RECEIPT_DIGITAL_SCALE,
);

/** Journey text stored in QR + printed (ESC/POS text only). */
export const THERMAL_JOURNEY_PROMPT_MAX_LENGTH = 150;

/**
 * Thermal-safe receipt constraints (CSN-A4L / ESC/POS):
 * - 1-bit monochrome only — solid black or white, no opacity / gray
 * - Text: plain + bold; ~32 chars/line (THERMAL_CHARS_PER_LINE)
 * - QR bitmap ≤ ~34mm square (RECEIPT_QR_PX)
 * - Star map: solid fills, size encodes dwell (THERMAL_STAR_SCALE_*)
 */

/** Star scale on receipt — dwell time maps to size, not opacity. */
export const THERMAL_STAR_SCALE_MIN = 0.45;
export const THERMAL_STAR_SCALE_MAX = 1.15;

/**
 * QR square on 58mm ESC/POS receipts — typically 32–36mm.
 * 34mm: scannable on print and phone preview without dominating the ticket.
 */
export const THERMAL_QR_SIZE_MM = 34;

export function thermalMmToReceiptPx(mm: number): number {
  return Math.round((mm / THERMAL_PAPER_WIDTH_MM) * RECEIPT_PAPER_WIDTH_PX);
}

export const RECEIPT_QR_PX = thermalMmToReceiptPx(THERMAL_QR_SIZE_MM);

/**
 * Digital `/v` page QR sizing — display size is fixed (not full width) so the QR
 * doesn't dominate the receipt; render size is higher for retina crispness.
 */
export const RECEIPT_DIGITAL_QR_DISPLAY_PX = 196;
export const RECEIPT_QR_RENDER_PX = 588; // 3× display for sharp scan on phones
export const RECEIPT_QR_MAX_RENDER_PX = 1200;
