import { THERMAL_CONTENT_DOTS } from "../thermal-spec";

/**
 * Typography for full-raster receipts — scaled from Figma ticket (208px content column).
 * @see https://www.figma.com/design/V9OWw7RpTM4ZUJiiR7f1oi/FAE-Website?node-id=3205-56267
 */
const FIGMA_CONTENT_PX = 208.25;
const SCALE = THERMAL_CONTENT_DOTS / FIGMA_CONTENT_PX;

function dots(px: number): number {
  return Math.round(px * SCALE);
}

export const RASTER_RECEIPT_WIDTH_DOTS = THERMAL_CONTENT_DOTS;

export const RASTER_RECEIPT_TYPE = {
  titleSize: dots(19.308),
  titleLeading: dots(21.243),
  bodySize: dots(8.275),
  bodyLeading: dots(11.033),
  transcriptLeading: dots(19.308),
  quoteLeading: dots(16.55),
  footerSize: dots(11.033),
  footerLeading: dots(11.033),
  sectionPadY: dots(6.896),
  blockPadY: dots(11.033),
  starsPadY: dots(27.583),
  qrPadTop: dots(13.791),
  qrPadBottom: dots(27.583),
  transcriptColGap: dots(13.791),
  footerGap: dots(6.896),
  sectionGap: dots(6.896),
} as const;

export const RASTER_RECEIPT_INK = {
  primary: "#000000",
  secondary: "#303030",
} as const;

/** Approximate Fira Mono advance width for line wrapping. */
export function rasterMonoCharWidth(fontSizeDots: number): number {
  return fontSizeDots * 0.6;
}
