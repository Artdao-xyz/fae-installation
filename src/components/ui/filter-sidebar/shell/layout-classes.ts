/**
 * Main filter column + domain subpanel column width: 30vw, floor 320px.
 * No width transition — animated width fights hero/particle compensation and reads as jitter.
 */
export const FILTER_SIDEBAR_COLUMN_CLASS =
  "w-[30vw] min-w-[320px] max-w-[30vw] shrink-0";

/** Alias for expanded subpanel stack (same width token). */
export const FILTER_SUBPANELS_COLUMN_EXPANDED_CLASS = FILTER_SIDEBAR_COLUMN_CLASS;

/** Pixel width matching `FILTER_SIDEBAR_COLUMN_CLASS` (hero + particle bounds when subpanel is open). */
export function getFilterSubpanelColumnWidthPx(viewportWidth: number): number {
  return Math.max(320, viewportWidth * 0.3);
}

export const SUBPANEL_COLUMN_COLLAPSED_CLASS =
  "w-0 min-w-0 max-w-0 shrink-0 overflow-hidden";

/** HomeBar / Footer: invisible right border when merged so layout width matches hairline (avoids 0.5px jump). */
export function filterChromeRightEdgeClass(mergeWithSubpanel: boolean) {
  return mergeWithSubpanel
    ? "border-r-hairline border-r-transparent"
    : "border-r-hairline";
}
