import {
  rasterizePathStars,
  type StarRaster,
} from "../rasterize-path-stars";

export type { StarRaster };
export { rasterizePathStars };

/**
 * Max rows per `GS v 0` command. Must stay BELOW 256 so the height high byte (yH)
 * is always zero: the installation's POS-80 clone mishandles yH≠0 — a 256-row band
 * (yL=0, yH=1) makes it read height 0, treat the pixel payload as text, and print
 * garbage from that point on. Receipts whose sections all banded under 256 rows
 * printed fine, which is why the bug tracked receipt length.
 */
const MAX_RASTER_BAND_HEIGHT_DOTS = 240;

function buildRasterBandCommand(
  bytesPerRow: number,
  heightDots: number,
  data: Uint8Array,
): Buffer {
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

/**
 * Split a raster into individual `GS v 0` band commands (not concatenated). Callers
 * that need real gaps between bands — not just correctly-sized commands — send these
 * as separate transport writes/jobs instead of one buffer (see cups-lp-raw-print.ts).
 */
export function buildEscPosRasterBands(
  raster: StarRaster,
  maxBandHeightDots = MAX_RASTER_BAND_HEIGHT_DOTS,
): Buffer[] {
  const { bytesPerRow, heightDots, data } = raster;
  const expectedBytes = bytesPerRow * heightDots;
  if (data.length !== expectedBytes) {
    throw new Error(
      `Raster size mismatch: data=${data.length} expected=${expectedBytes}`,
    );
  }

  if (heightDots === 0) {
    return [buildRasterBandCommand(bytesPerRow, 0, data)];
  }

  const bands: Buffer[] = [];
  for (let y = 0; y < heightDots; y += maxBandHeightDots) {
    const bandHeight = Math.min(maxBandHeightDots, heightDots - y);
    const start = y * bytesPerRow;
    const end = start + bandHeight * bytesPerRow;
    bands.push(buildRasterBandCommand(bytesPerRow, bandHeight, data.subarray(start, end)));
  }
  return bands;
}

/** GS v 0 — raster bit image for ESC/POS thermal printers, sent as height-banded commands. */
export function buildEscPosRasterCommand(
  raster: StarRaster,
  maxBandHeightDots = MAX_RASTER_BAND_HEIGHT_DOTS,
): Buffer {
  return Buffer.concat(buildEscPosRasterBands(raster, maxBandHeightDots));
}
