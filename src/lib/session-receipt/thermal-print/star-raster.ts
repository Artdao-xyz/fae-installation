import {
  rasterizePathStars,
  type StarRaster,
} from "../rasterize-path-stars";

export type { StarRaster };
export { rasterizePathStars };

/** GS v 0 — raster bit image for ESC/POS thermal printers. */
export function buildEscPosRasterCommand(raster: StarRaster): Buffer {
  const { bytesPerRow, heightDots, data } = raster;
  const header = Buffer.from([
    0x1d,
    0x76,
    0x30,
    0x00,
    bytesPerRow & 0xff,
    (bytesPerRow >> 8) & 0xff,
    heightDots & 0xff,
    (heightDots >> 8) & 0xff,
  ]);
  return Buffer.concat([header, Buffer.from(data)]);
}
