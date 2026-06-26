import { PATH_GRID_COLS, PATH_GRID_ROWS, type SessionPath } from "./path-grid";
import {
  computePathStarPlacements,
  PATH_SVG_HEIGHT,
  PATH_SVG_WIDTH,
  STAR_VERTICES,
} from "./path-stars";
import { THERMAL_LINE_DOTS } from "./thermal-spec";

export type StarRaster = {
  widthDots: number;
  heightDots: number;
  bytesPerRow: number;
  /** Row-major 1-bit bitmap, MSB = leftmost pixel, 1 = black. */
  data: Uint8Array;
};

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

function fillPolygon(
  bitmap: Uint8Array,
  widthDots: number,
  heightDots: number,
  polygon: readonly [number, number][],
): void {
  if (polygon.length < 3) return;

  const minY = Math.max(0, Math.floor(Math.min(...polygon.map((p) => p[1]))));
  const maxY = Math.min(
    heightDots - 1,
    Math.ceil(Math.max(...polygon.map((p) => p[1]))),
  );

  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const [x1, y1] = polygon[i]!;
      const [x2, y2] = polygon[(i + 1) % polygon.length]!;
      if (y1 === y2) continue;
      if ((y >= y1 && y < y2) || (y >= y2 && y < y1)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const xStart = Math.max(0, Math.ceil(xs[i]!));
      const xEnd = Math.min(widthDots - 1, Math.floor(xs[i + 1]!));
      for (let x = xStart; x <= xEnd; x++) {
        setPixel(bitmap, widthDots, x, y);
      }
    }
  }
}

/** 1-bit raster of the star path map (solid black, size = dwell). */
export function rasterizePathStars(
  path: SessionPath,
  widthDots = THERMAL_LINE_DOTS,
): StarRaster {
  const heightDots = Math.round(
    widthDots * (PATH_GRID_ROWS / PATH_GRID_COLS),
  );
  const bytesPerRow = Math.ceil(widthDots / 8);
  const data = new Uint8Array(bytesPerRow * heightDots);

  const scaleX = widthDots / PATH_SVG_WIDTH;
  const scaleY = heightDots / PATH_SVG_HEIGHT;
  const cellW = widthDots / PATH_GRID_COLS;
  const placements = computePathStarPlacements(path);

  for (const star of placements) {
    const cx = star.x * scaleX;
    const cy = star.y * scaleY;
    const unit = cellW * 0.09 * star.scale;

    const polygon = STAR_VERTICES.map(
      ([vx, vy]) =>
        [cx + vx * unit, cy + vy * unit] as [number, number],
    );

    fillPolygon(data, widthDots, heightDots, polygon);
  }

  return { widthDots, heightDots, bytesPerRow, data };
}
