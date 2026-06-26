/**
 * Positioning helpers aligned with `MarginGuideFrame` (`--inset-margin-guide`).
 * The horizontal dashed guide sits at that inset from the top; chrome in the strip
 * above it uses `top-0` and `h-[var(--inset-margin-guide)]`.
 */

/** Top margin strip, right-aligned (above the horizontal margin guide). */
export const marginGuideTopStripRightClass =
  "fixed top-0 right-[var(--inset-margin-guide)] flex h-[var(--inset-margin-guide)] items-center";

/** Bottom margin strip, right-aligned (below the horizontal margin guide). */
export const marginGuideBottomStripRightClass =
  "fixed bottom-0 right-[var(--inset-margin-guide)] flex h-[var(--inset-margin-guide)] items-center";

/** Bottom margin strip, horizontally centered. */
export const marginGuideBottomStripCenterClass =
  "fixed bottom-0 left-1/2 flex h-[var(--inset-margin-guide)] -translate-x-1/2 items-center justify-center";

/** Bottom-right corner inside the margin guide rectangle. */
export const marginGuideBottomRightClass =
  "fixed bottom-[var(--inset-margin-guide)] right-[var(--inset-margin-guide)]";
