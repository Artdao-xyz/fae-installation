import {
  PATH_GRID_COLS,
  PATH_GRID_SIZE,
  PATH_GRID_ROWS,
  type SessionPath,
} from "./path-grid";
import {
  THERMAL_STAR_SCALE_MAX,
  THERMAL_STAR_SCALE_MIN,
} from "./thermal-spec";

/** Swap this path to use a custom star SVG (viewBox should stay centered ~±5). */
export const RECEIPT_STAR_PATH =
  "M0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2Z";

export const STAR_VERTICES: ReadonlyArray<readonly [number, number]> = [
  [0, -4],
  [1.2, -1.2],
  [4, 0],
  [1.2, 1.2],
  [0, 4],
  [-1.2, 1.2],
  [-4, 0],
  [-1.2, -1.2],
] as const;

export const PATH_SVG_WIDTH = PATH_GRID_COLS * 10;
export const PATH_SVG_HEIGHT = PATH_GRID_ROWS * 10;

export type PathStarPlacement = {
  x: number;
  y: number;
  /** Solid black on paper — size encodes dwell time (ESC/POS 1-bit). */
  scale: number;
  kind: "start" | "end" | "visit";
};

export function computePathStarPlacements(path: SessionPath): PathStarPlacement[] {
  const maxVisit = Math.max(1, ...path.visits);
  const placements: PathStarPlacement[] = [];

  for (let idx = 0; idx < PATH_GRID_SIZE; idx++) {
    const visits = path.visits[idx] ?? 0;
    if (visits <= 0) continue;

    const col = idx % PATH_GRID_COLS;
    const row = Math.floor(idx / PATH_GRID_COLS);
    const x = col * 10 + 5;
    const y = row * 10 + 5;

    let kind: PathStarPlacement["kind"] = "visit";
    if (idx === path.start && idx === path.end) kind = "start";
    else if (idx === path.start) kind = "start";
    else if (idx === path.end) kind = "end";

    const density = visits / maxVisit;
    const trailScale =
      THERMAL_STAR_SCALE_MIN +
      density * (THERMAL_STAR_SCALE_MAX - THERMAL_STAR_SCALE_MIN);

    placements.push({
      x,
      y,
      scale:
        kind === "start"
          ? THERMAL_STAR_SCALE_MAX + 0.2
          : kind === "end"
            ? THERMAL_STAR_SCALE_MAX
            : trailScale,
      kind,
    });
  }

  return placements;
}
