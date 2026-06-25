/**
 * CSN-A4L / 58mm thermal receipt printer (Pi Hut).
 * 384 dots/line @ 8 dots/mm — preview and QR size follow the same proportions.
 */

export const THERMAL_PAPER_WIDTH_MM = 58;
export const THERMAL_DOTS_PER_MM = 8;
export const THERMAL_LINE_DOTS = 384;

/** ~2 mm side inset on 58 mm paper (8 dots/mm). Applied via ESC/POS on print. */
export const THERMAL_HORIZONTAL_MARGIN_DOTS = 16;

/** Side inset as a fraction of paper width — used for full-width digital layout. */
export const THERMAL_HORIZONTAL_MARGIN_RATIO =
  THERMAL_HORIZONTAL_MARGIN_DOTS / THERMAL_LINE_DOTS;

/** Printable width between left and right margins. */
export const THERMAL_CONTENT_DOTS =
  THERMAL_LINE_DOTS - THERMAL_HORIZONTAL_MARGIN_DOTS * 2;

/** Monospace chars spanning full paper width (before side padding). */
export const THERMAL_CHARS_AT_FULL_BLEED = 32;

/** Space chars per side — derived from dot inset (~2 mm → 2 chars). */
export const THERMAL_MARGIN_CHARS = Math.max(
  1,
  Math.ceil(
    THERMAL_HORIZONTAL_MARGIN_DOTS /
      (THERMAL_LINE_DOTS / THERMAL_CHARS_AT_FULL_BLEED),
  ),
);

/** Chars per line inside side margins (~28 on CSN-A4L). */
export const THERMAL_CHARS_PER_LINE = Math.max(
  24,
  THERMAL_CHARS_AT_FULL_BLEED - THERMAL_MARGIN_CHARS * 2,
);

/** CSS px width for on-screen receipt (matches 58mm at ~96dpi). */
export const RECEIPT_PAPER_WIDTH_PX = Math.round(
  (THERMAL_PAPER_WIDTH_MM / 25.4) * 96,
);

/** Screen preview / digital twin — larger than thermal, same proportions. */
export const RECEIPT_DIGITAL_SCALE = 1.75;

export const RECEIPT_DIGITAL_WIDTH_PX = Math.round(
  RECEIPT_PAPER_WIDTH_PX * RECEIPT_DIGITAL_SCALE,
);

/** Max width for on-screen digital / confirm receipt (preview modal + /v page). */
export const RECEIPT_DIGITAL_MAX_WIDTH_PX = 300;

/** Journey text stored in QR + printed (ESC/POS text only). */
export const THERMAL_JOURNEY_PROMPT_MAX_LENGTH = 150;

/**
 * Thermal-safe receipt constraints (CSN-A4L / ESC/POS):
 * - 1-bit monochrome only — solid black or white, no opacity / gray
 * - Text: plain + bold; THERMAL_CHARS_PER_LINE within side margins
 * - QR raster at THERMAL_QR_SIZE_MM (~25 mm), left-aligned in side margins
 * - Footer wordmarks rasterized from SVG (FAE + Serpentine)
 * - Star map: solid fills, size encodes dwell (THERMAL_STAR_SCALE_*)
 */

/** Star scale on receipt — dwell time maps to size, not opacity. */
export const THERMAL_STAR_SCALE_MIN = 0.45;
export const THERMAL_STAR_SCALE_MAX = 1.15;

/**
 * Target QR width on thermal paper (~25 mm). Print raster scales modules to fit.
 */
export const THERMAL_QR_SIZE_MM = 25;

/** Footer logo height (~1.25 mm). */
export const THERMAL_FOOTER_LOGO_HEIGHT_DOTS = 10;

/** Max width per footer wordmark within the content column. */
export const THERMAL_FOOTER_FAE_MAX_WIDTH_DOTS = 220;
export const THERMAL_FOOTER_SERPENTINE_MAX_WIDTH_DOTS = 72;

export function thermalMmToReceiptPx(mm: number): number {
  return Math.round((mm / THERMAL_PAPER_WIDTH_MM) * RECEIPT_PAPER_WIDTH_PX);
}

/** Horizontal padding for on-screen thermal preview (matches print inset). */
export function thermalReceiptHorizontalPaddingPx(): number {
  return Math.round(
    (THERMAL_HORIZONTAL_MARGIN_DOTS / THERMAL_LINE_DOTS) *
      RECEIPT_PAPER_WIDTH_PX,
  );
}

/** Content width inside side margins — star map and text block. */
export function thermalContentWidthPx(): number {
  return Math.round(
    (THERMAL_CONTENT_DOTS / THERMAL_LINE_DOTS) * RECEIPT_PAPER_WIDTH_PX,
  );
}

export const RECEIPT_QR_PX = thermalMmToReceiptPx(THERMAL_QR_SIZE_MM);

/** On-screen QR beside thermal preview — same proportions, digital scale. */
export const RECEIPT_DIGITAL_QR_DISPLAY_PX = Math.round(
  RECEIPT_QR_PX * RECEIPT_DIGITAL_SCALE,
);

export const RECEIPT_QR_MAX_RENDER_PX = 1200;

/** PNG render resolution for digital QR (retina). */
export const RECEIPT_QR_RENDER_PX = Math.min(
  RECEIPT_QR_MAX_RENDER_PX,
  RECEIPT_DIGITAL_QR_DISPLAY_PX * 3,
);
