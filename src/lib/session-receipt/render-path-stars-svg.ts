import type { SessionPath } from "./path-grid";
import {
  computePathStarPlacements,
  PATH_SVG_HEIGHT,
  PATH_SVG_WIDTH,
  RECEIPT_STAR_PATH,
} from "./path-stars";

/** Inline SVG star map — served as `image/svg+xml` for reliable mobile `<img>` tags. */
export function renderPathStarsSvg(path: SessionPath, widthPx: number): string {
  const heightPx = Math.round((widthPx * PATH_SVG_HEIGHT) / PATH_SVG_WIDTH);
  const placements = computePathStarPlacements(path);
  const stars = placements
    .map(
      (star) =>
        `<path d="${RECEIPT_STAR_PATH}" fill="#000" transform="translate(${star.x} ${star.y}) scale(${star.scale})"/>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PATH_SVG_WIDTH} ${PATH_SVG_HEIGHT}" width="${widthPx}" height="${heightPx}">${stars}</svg>`;
}
