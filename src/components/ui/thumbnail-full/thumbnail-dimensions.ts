export const SIZE_DIMS = {
  sm: { frame: 75, labelMinH: 24, textPx: 12, gapPx: 5, chipW: 2.5, chipH: 10, padX: 10 },
  md: { frame: 120, labelMinH: 28, textPx: 12, gapPx: 6, chipW: 3, chipH: 12, padX: 12 },
  lg: { frame: 120, labelMinH: 28, textPx: 12, gapPx: 6, chipW: 3, chipH: 12, padX: 12 },
} as const;

export type ThumbnailSize = keyof typeof SIZE_DIMS;

export function getThumbnailFramePx(size: ThumbnailSize = "lg"): number {
  return SIZE_DIMS[size].frame;
}

/**
 * Outer width/height for a `variant="full"` card (label chip + gap + image frame),
 * using a conservative label width so collision checks stay safe for typical titles.
 */
export function getThumbnailFullCardOuterSize(
  size: ThumbnailSize = "lg",
): { width: number; height: number } {
  const d = SIZE_DIMS[size];
  const labelH = d.labelMinH + 12; // vertical padding 6+6 on the chip row
  const labelW = d.padX * 2 + d.chipW + 6 + 9 * (d.textPx * 0.55);
  const width = Math.max(d.frame, Math.ceil(labelW));
  const height = labelH + d.gapPx + d.frame;
  return { width, height };
}

/**
 * Fixed outer box for `variant="text"` only (label chip, no frame). Same width
 * as full-card outer so filter transitions don’t reflow from `w-fit` + wrap.
 */
export function getThumbnailTextVariantOuterSize(
  size: ThumbnailSize = "lg",
): { width: number; height: number } {
  const outer = getThumbnailFullCardOuterSize(size);
  const d = SIZE_DIMS[size];
  return {
    width: outer.width,
    height: d.labelMinH + 12,
  };
}

/**
 * Latest updates peek clip width: three `lg` full cards + horizontal gaps + horizontal padding
 * (aligned with `LatestUpdatesPanel` row: `gap-8` + `px-6` at `sm+`).
 * Extra px: full-card width uses a short-title estimate; real labels are often wider than the
 * image frame, so the peek needs slack so the row isn’t clipped.
 */
const LATEST_UPDATES_PEEK_EXTRA_PX = 300;

export function getLatestUpdatesPeekClipWidthPx(): number {
  const { width } = getThumbnailFullCardOuterSize("lg");
  const gapPx = 32; // gap-8 (2rem)
  const padXPx = 24; // px-6 (1.5rem) each side
  return 3 * width + 2 * gapPx + 2 * padXPx + LATEST_UPDATES_PEEK_EXTRA_PX;
}
