import { RECEIPT_PRINT_TEXT_SCALE, THERMAL_CONTENT_DOTS } from "../thermal-spec";

/**
 * Typography for full-raster receipts — scaled from Figma ticket (208px content column).
 * @see https://www.figma.com/design/V9OWw7RpTM4ZUJiiR7f1oi/FAE-Website?node-id=3205-56267
 */
const FIGMA_CONTENT_PX = 208.25;
const SCALE = THERMAL_CONTENT_DOTS / FIGMA_CONTENT_PX;

function dots(px: number): number {
  return Math.round(px * SCALE);
}

function typeDots(px: number): number {
  return dots(px * RECEIPT_PRINT_TEXT_SCALE);
}

export const RASTER_RECEIPT_WIDTH_DOTS = THERMAL_CONTENT_DOTS;

export const RASTER_RECEIPT_TYPE = {
  titleSize: typeDots(19.308),
  titleLeading: typeDots(21.243),
  bodySize: typeDots(8.275),
  bodyLeading: typeDots(11.033),
  transcriptLeading: typeDots(19.308),
  quoteLeading: typeDots(19.308),
  footerSize: typeDots(11.033),
  footerLeading: typeDots(11.033),
  sectionPadY: typeDots(6.896),
  blockPadY: typeDots(11.033),
  starsPadY: typeDots(27.583),
  qrPadTop: typeDots(13.791),
  qrPadBottom: typeDots(27.583),
  transcriptColGap: typeDots(13.791),
  footerGap: typeDots(6.896),
  sectionGap: typeDots(6.896),
} as const;

export const RASTER_RECEIPT_INK = {
  primary: "#000000",
  secondary: "#303030",
} as const;

/** Approximate Fira Mono advance width for line wrapping. */
export function rasterMonoCharWidth(fontSizeDots: number): number {
  return fontSizeDots * 0.6;
}
