import type { SessionPath } from "./path-grid";
import { PATH_SVG_HEIGHT, PATH_SVG_WIDTH } from "./path-stars";
import {
  rasterizePathStars,
  type StarRaster,
} from "./rasterize-path-stars";

/** Expand 1-bit raster to JPEG data URL (browser only). */
export function rasterToJpegDataUrl(
  raster: StarRaster,
  quality = 0.92,
): string {
  const { widthDots, heightDots, bytesPerRow, data } = raster;
  const canvas = document.createElement("canvas");
  canvas.width = widthDots;
  canvas.height = heightDots;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imageData = ctx.createImageData(widthDots, heightDots);
  const pixels = imageData.data;

  for (let y = 0; y < heightDots; y++) {
    for (let x = 0; x < widthDots; x++) {
      const byteIdx = y * bytesPerRow + Math.floor(x / 8);
      const bit = 7 - (x % 8);
      const on = ((data[byteIdx] ?? 0) >> bit) & 1;
      const i = (y * widthDots + x) * 4;
      pixels[i] = on ? 0 : 255;
      pixels[i + 1] = on ? 0 : 255;
      pixels[i + 2] = on ? 0 : 255;
      pixels[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", quality);
}

export function pathStarsDisplaySize(scale = 1): {
  widthPx: number;
  heightPx: number;
  rasterWidthPx: number;
} {
  const widthPx = Math.round(PATH_SVG_WIDTH * 1.35 * scale);
  const heightPx = Math.round((widthPx * PATH_SVG_HEIGHT) / PATH_SVG_WIDTH);
  return { widthPx, heightPx, rasterWidthPx: widthPx * 2 };
}

/** Raster star map for reliable mobile display (same geometry as thermal print). */
export function pathStarsToJpegDataUrl(
  path: SessionPath,
  scale = 1,
): string {
  const { rasterWidthPx } = pathStarsDisplaySize(scale);
  return rasterToJpegDataUrl(rasterizePathStars(path, rasterWidthPx));
}
