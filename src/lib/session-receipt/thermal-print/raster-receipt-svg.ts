import {
  RASTER_RECEIPT_INK,
  RASTER_RECEIPT_TYPE,
  RASTER_RECEIPT_WIDTH_DOTS,
} from "./raster-receipt-spec";
import { rasterReceiptFontFaceCss } from "./raster-receipt-fonts";
import { rasterizeSvgString } from "./rasterize-monochrome";
import type { StarRaster } from "../rasterize-path-stars";

export function escapeSvgText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapMonoText(
  text: string,
  maxWidthDots: number,
  fontSizeDots: number,
): string[] {
  const charWidth = fontSizeDots * 0.6;
  const maxChars = Math.max(1, Math.floor(maxWidthDots / charWidth));
  if (text.length <= maxChars) return [text];

  const lines: string[] = [];
  let rest = text;
  while (rest.length > maxChars) {
    let breakAt = rest.lastIndexOf(" ", maxChars);
    if (breakAt <= 0) breakAt = maxChars;
    lines.push(rest.slice(0, breakAt).trimEnd());
    rest = rest.slice(breakAt).trimStart();
  }
  if (rest.length > 0) lines.push(rest);
  return lines;
}

export type SvgTextSpan = {
  x: number;
  text: string;
  fill?: string;
  weight?: 400 | 500;
  family?: "FiraMono" | "LustText";
  size?: number;
};

export type SvgTextLine = {
  y: number;
  spans: readonly SvgTextSpan[];
};

type BuildSvgBlockOptions = {
  widthDots?: number;
  heightDots: number;
  lines: readonly SvgTextLine[];
};

export function buildSvgTextBlock({
  widthDots = RASTER_RECEIPT_WIDTH_DOTS,
  heightDots,
  lines,
}: BuildSvgBlockOptions): string {
  const fontCss = rasterReceiptFontFaceCss();
  const textNodes = lines
    .map((line) => {
      const spans = line.spans
        .map((span) => {
          const family = span.family ?? "FiraMono";
          const size = span.size ?? RASTER_RECEIPT_TYPE.bodySize;
          const weight = span.weight ?? 400;
          const fill = span.fill ?? RASTER_RECEIPT_INK.primary;
          return `<tspan x="${span.x}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeSvgText(span.text)}</tspan>`;
        })
        .join("");
      return `<text y="${line.y}" dominant-baseline="alphabetic">${spans}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthDots}" height="${heightDots}">
<defs><style>${fontCss}</style></defs>
<rect width="100%" height="100%" fill="#ffffff"/>
${textNodes}
</svg>`;
}

export async function rasterizeReceiptSvgBlock(svg: string): Promise<StarRaster> {
  return rasterizeSvgString(svg, RASTER_RECEIPT_WIDTH_DOTS);
}
