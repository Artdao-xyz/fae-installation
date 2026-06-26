import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { StarRaster } from "../rasterize-path-stars";

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

function isInk(r: number, g: number, b: number, a: number): boolean {
  if (a < 128) return false;
  return (r + g + b) / 3 < 220;
}

/** RGBA buffer → 1-bit thermal raster. */
export function rgbaToStarRaster(
  rgba: Buffer,
  widthDots: number,
  heightDots: number,
  channels: number,
): StarRaster {
  const bytesPerRow = Math.ceil(widthDots / 8);
  const data = new Uint8Array(bytesPerRow * heightDots);

  for (let y = 0; y < heightDots; y++) {
    for (let x = 0; x < widthDots; x++) {
      const i = (y * widthDots + x) * channels;
      if (isInk(rgba[i] ?? 255, rgba[i + 1] ?? 255, rgba[i + 2] ?? 255, rgba[i + 3] ?? 255)) {
        setPixel(data, widthDots, x, y);
      }
    }
  }

  return { widthDots, heightDots, bytesPerRow, data };
}

export function blitRaster(
  target: Uint8Array,
  targetWidth: number,
  source: StarRaster,
  destX: number,
  destY: number,
): void {
  const targetBytesPerRow = Math.ceil(targetWidth / 8);
  for (let y = 0; y < source.heightDots; y++) {
    for (let x = 0; x < source.widthDots; x++) {
      const srcByteIdx = y * source.bytesPerRow + Math.floor(x / 8);
      const srcBit = 7 - (x % 8);
      if (((source.data[srcByteIdx] ?? 0) >> srcBit) & 1) {
        const px = destX + x;
        const py = destY + y;
        const destByteIdx = py * targetBytesPerRow + Math.floor(px / 8);
        const destBit = 7 - (px % 8);
        target[destByteIdx] = (target[destByteIdx] ?? 0) | (1 << destBit);
      }
    }
  }
}

/** Place `left` and `right` on one row — both start-aligned with a gap. */
export function composeRastersRowStart(
  left: StarRaster,
  right: StarRaster,
  rowWidthDots: number,
  gapDots = 16,
): StarRaster {
  const heightDots = Math.max(left.heightDots, right.heightDots);
  const bytesPerRow = Math.ceil(rowWidthDots / 8);
  const data = new Uint8Array(bytesPerRow * heightDots);
  blitRaster(data, rowWidthDots, left, 0, 0);
  blitRaster(data, rowWidthDots, right, left.widthDots + gapDots, 0);
  return { widthDots: rowWidthDots, heightDots, bytesPerRow, data };
}

/** Place `left` and `right` on one row — `space-between` within `rowWidthDots`. */
export function composeRastersRow(
  left: StarRaster,
  right: StarRaster,
  rowWidthDots: number,
): StarRaster {
  const heightDots = Math.max(left.heightDots, right.heightDots);
  const bytesPerRow = Math.ceil(rowWidthDots / 8);
  const data = new Uint8Array(bytesPerRow * heightDots);
  blitRaster(data, rowWidthDots, left, 0, 0);
  blitRaster(data, rowWidthDots, right, rowWidthDots - right.widthDots, 0);
  return { widthDots: rowWidthDots, heightDots, bytesPerRow, data };
}

/** Stack content-width rasters into one column (optional gap between sections). */
export function stackRastersVertically(
  sections: readonly StarRaster[],
  widthDots: number,
  gapDots = 0,
): StarRaster {
  if (sections.length === 0) {
    return { widthDots, heightDots: 0, bytesPerRow: Math.ceil(widthDots / 8), data: new Uint8Array(0) };
  }

  const gap = Math.max(0, gapDots);
  const totalHeight =
    sections.reduce((sum, section) => sum + section.heightDots, 0) +
    gap * Math.max(0, sections.length - 1);
  const bytesPerRow = Math.ceil(widthDots / 8);
  const data = new Uint8Array(bytesPerRow * totalHeight);

  let y = 0;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    blitRaster(data, widthDots, section, 0, y);
    y += section.heightDots;
    if (i < sections.length - 1) y += gap;
  }

  return { widthDots, heightDots: totalHeight, bytesPerRow, data };
}

/** Rasterize inline SVG to 1-bit thermal dots at a fixed width. */
export async function rasterizeSvgString(
  svg: string,
  widthDots: number,
): Promise<StarRaster> {
  const { data, info } = await sharp(Buffer.from(svg))
    .resize({ width: widthDots, fit: "inside" })
    .flatten({ background: "#ffffff" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return rgbaToStarRaster(data, info.width, info.height, info.channels);
}

/** Rasterize an SVG asset to 1-bit thermal dots, constrained by height and width. */
export async function rasterizeSvgFile(
  svgPath: string,
  heightDots: number,
  maxWidthDots?: number,
): Promise<StarRaster> {
  const absolutePath = path.isAbsolute(svgPath)
    ? svgPath
    : path.join(/* turbopackIgnore: true */ process.cwd(), svgPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`SVG not found: ${absolutePath}`);
  }

  const { data, info } = await sharp(absolutePath)
    .resize({
      height: heightDots,
      width: maxWidthDots,
      fit: "inside",
    })
    .flatten({ background: "#ffffff" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return rgbaToStarRaster(data, info.width, info.height, info.channels);
}
