/**
 * Matches `--inset-margin-guide` in `globals.css` (`calc(var(--width-filter-narrow-column) - 1px)`).
 * Used when JS needs the same inset as the margin guide (e.g. preview panel + particle bounds).
 */
export function getMarginGuideInsetPx(): number {
  if (typeof document === "undefined") return 34;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--width-filter-narrow-column",
  );
  const w = parseFloat(raw);
  const narrow = Number.isFinite(w) ? w : 35;
  return Math.max(0, narrow - 1);
}

/** Matches `--width-filter-narrow-column` (filter rail width). */
export function getFilterNarrowColumnWidthPx(): number {
  if (typeof document === "undefined") return 35;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--width-filter-narrow-column",
  );
  const w = parseFloat(raw);
  return Number.isFinite(w) ? w : 35;
}
