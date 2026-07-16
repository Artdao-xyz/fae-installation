/**
 * 80mm thermal receipt printer.
 * 576 dots/line @ 8 dots/mm (72mm printable head on 80mm paper, per printer
 * self-test) — preview and QR size follow the same proportions. Rasters wider
 * than the head make clone controllers desync and print pixel bytes as text.
 */

export const THERMAL_PAPER_WIDTH_MM = 80;
export const THERMAL_DOTS_PER_MM = 8;
export const THERMAL_LINE_DOTS = 576;

/** ~2 mm side inset on 80 mm paper (8 dots/mm). Applied via ESC/POS on print. */
export const THERMAL_HORIZONTAL_MARGIN_DOTS = 16;

/** Side inset as a fraction of paper width — used for full-width digital layout. */
export const THERMAL_HORIZONTAL_MARGIN_RATIO =
  THERMAL_HORIZONTAL_MARGIN_DOTS / THERMAL_LINE_DOTS;

/** Printable width between left and right margins. */
export const THERMAL_CONTENT_DOTS =
  THERMAL_LINE_DOTS - THERMAL_HORIZONTAL_MARGIN_DOTS * 2;

/** Monospace chars spanning the printable line (Font A 12-dot glyphs: 576/12). */
export const THERMAL_CHARS_AT_FULL_BLEED = 48;

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

/** CSS px width for on-screen receipt (matches 80mm at ~96dpi). */
export const RECEIPT_PAPER_WIDTH_PX = Math.round(
  (THERMAL_PAPER_WIDTH_MM / 25.4) * 96,
);

/** Legacy 58mm receipt — used to preserve digital card proportions after paper change. */
const LEGACY_RECEIPT_PAPER_WIDTH_PX = Math.round((58 / 25.4) * 96);
const LEGACY_RECEIPT_DIGITAL_MAX_WIDTH_PX = 300;

/** Screen preview / digital twin — larger than thermal, same proportions. */
export const RECEIPT_DIGITAL_SCALE = 1.75;

export const RECEIPT_DIGITAL_WIDTH_PX = Math.round(
  RECEIPT_PAPER_WIDTH_PX * RECEIPT_DIGITAL_SCALE,
);

/**
 * Digital / confirm card width — same visual proportion as legacy 300px @ 58mm,
 * scaled to the current {@link RECEIPT_PAPER_WIDTH_PX} (80mm).
 */
export const RECEIPT_DIGITAL_MAX_WIDTH_PX = Math.round(
  RECEIPT_PAPER_WIDTH_PX *
    (LEGACY_RECEIPT_DIGITAL_MAX_WIDTH_PX / LEGACY_RECEIPT_PAPER_WIDTH_PX),
);

/**
 * Extra multiplier on Figma→thermal raster typography.
 * 1.25 ≈ ~3.75 mm body on 80 mm paper; 2× overshoots.
 */
export const RECEIPT_PRINT_TEXT_SCALE = 1.25;

/** On-screen thermal preview typography (digital twin uses fixed Tailwind sizes). */
export const RECEIPT_THERMAL_BODY_PX = 11;
export const RECEIPT_THERMAL_LEADING_PX = 14;
export const RECEIPT_THERMAL_TITLE_PX = 12;

/** Fixed digital receipt typography — same on kiosk, /v, and archive. */
export const RECEIPT_DIGITAL_BODY_PX = 12;
export const RECEIPT_DIGITAL_LEADING_PX = 15;
export const RECEIPT_DIGITAL_TITLE_PX = 14;
export const RECEIPT_DIGITAL_LOGO_HEIGHT_PX = 12;

/** Constellation width inside the digital / confirm card (80mm content column). */
export function receiptDigitalStarsWidthPx(): number {
  return Math.round(
    thermalContentWidthPx() *
      (RECEIPT_DIGITAL_MAX_WIDTH_PX / RECEIPT_PAPER_WIDTH_PX),
  );
}

/** Journey text stored in QR + printed (ESC/POS text only). */
export const THERMAL_JOURNEY_PROMPT_MAX_LENGTH = 150;

/**
 * Thermal-safe receipt constraints (CSN-A4L / ESC/POS):
 * - 1-bit monochrome only — solid black or white, no opacity / gray
 * - Text: plain + bold; THERMAL_CHARS_PER_LINE within side margins
 * - QR raster at THERMAL_QR_SIZE_MM (~42 mm), centered in content column
 * - Footer wordmark rasterized from SVG (Serpentine)
 * - Star map: solid fills, size encodes dwell (THERMAL_STAR_SCALE_*)
 */

/** Star scale on receipt — dwell time maps to size, not opacity. */
export const THERMAL_STAR_SCALE_MIN = 0.45;
export const THERMAL_STAR_SCALE_MAX = 1.15;

/**
 * Target QR width on thermal paper (~42 mm). Print raster scales modules to fit.
 */
export const THERMAL_QR_SIZE_MM = 42;

/** Target QR width on thermal paper in dots (8 dots/mm). */
export const THERMAL_QR_PRINT_DOTS = Math.round(
  THERMAL_QR_SIZE_MM * THERMAL_DOTS_PER_MM,
);

/** Thermal print QR — ECC M tolerates ink spread better than on-screen L. */
export const THERMAL_QR_PRINT_ERROR_CORRECTION = "M" as const;

/** Minimum QR module size on paper (dots) for reliable thermal scans. */
export const THERMAL_QR_MIN_MODULE_DOTS = 6;

/**
 * Digital / kiosk QR proportion on screen (~32 mm @ 80 mm + {@link RECEIPT_DIGITAL_QR_SCALE}).
 * Independent of {@link THERMAL_QR_SIZE_MM} — print size can be tuned without affecting /v.
 */
export const RECEIPT_DIGITAL_QR_SIZE_MM = 32;

/** Footer logo height on print (ESC/POS text path; raster uses RASTER_RECEIPT_TYPE.footerSize). */
export const THERMAL_FOOTER_LOGO_HEIGHT_DOTS = Math.round(
  10 * RECEIPT_PRINT_TEXT_SCALE,
);

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

/** Digital QR is larger than the thermal print proportion — phones need a bigger target. */
export const RECEIPT_DIGITAL_QR_SCALE = 1.5;

/** On-screen QR inside the digital card — not tied to print QR size. */
export const RECEIPT_DIGITAL_QR_WIDTH_PERCENT =
  (RECEIPT_DIGITAL_QR_SIZE_MM / THERMAL_PAPER_WIDTH_MM) *
  100 *
  RECEIPT_DIGITAL_QR_SCALE;

export const RECEIPT_DIGITAL_QR_DISPLAY_PX = Math.round(
  RECEIPT_DIGITAL_MAX_WIDTH_PX *
    (RECEIPT_DIGITAL_QR_SIZE_MM / THERMAL_PAPER_WIDTH_MM) *
    RECEIPT_DIGITAL_QR_SCALE,
);

/** Pixel width for the digital QR from a measured card host width. */
export function receiptDigitalQrDisplayPx(hostWidthPx: number): number {
  return Math.round(hostWidthPx * (RECEIPT_DIGITAL_QR_WIDTH_PERCENT / 100));
}

export const RECEIPT_QR_MAX_RENDER_PX = 1200;

/** PNG render resolution for digital QR (retina). */
export const RECEIPT_QR_RENDER_PX = Math.min(
  RECEIPT_QR_MAX_RENDER_PX,
  RECEIPT_DIGITAL_QR_DISPLAY_PX * 3,
);
