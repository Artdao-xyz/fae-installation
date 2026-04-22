/**
 * Main filter chrome column: 25vw. Domain subpanel stack: 20vw (narrower than the panel).
 * Preview dock uses `--width-preview-panel` (30vw). Options strip: `FILTER_OPTIONS_PANEL_CLIP_TRANSITION_CLASS`.
 */
export const FILTER_SIDEBAR_COLUMN_CLASS =
  "w-[25vw] max-w-[25vw] shrink-0";

/**
 * Filter options strip: clip with `max-width` (avoids `fr` track interpolation feeling like
 * overshoot on open — same idea as `PREVIEW_DOCK_WIDTH_TRANSITION_CLASS`).
 */
/** Use `width` (not `max-width` + `flex-1`) so flex doesn’t skip the interpolation; `opacity` softens the reveal. */
export const FILTER_OPTIONS_PANEL_CLIP_TRANSITION_CLASS =
  "transition-[width,opacity] duration-500 ease-in-out motion-reduce:transition-none";

/** About / Glossary / Latest updates peek bodies: clip with `max-width` + fade (matches filter strip timing). */
export const FLOATING_DOCK_PEEK_CLIP_CLASS =
  "transition-[max-width,opacity] duration-500 ease-in-out motion-reduce:transition-none";

/** Domain subpanel stack column. */
export const FILTER_SUBPANEL_COLUMN_TRANSITION_CLASS =
  "transition-[max-width,min-width,width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

/** Content preview dock: width clip (smoother than animating `fr` tracks in some engines). */
export const PREVIEW_DOCK_WIDTH_TRANSITION_CLASS =
  "transition-[max-width] duration-300 ease-out motion-reduce:transition-none";

/** Expanded domain subpanel stack column (narrower than `FILTER_SIDEBAR_COLUMN_CLASS`). */
export const FILTER_SUBPANELS_COLUMN_EXPANDED_CLASS =
  "w-[20vw] max-w-[20vw] shrink-0";

/** Pixel width matching `FILTER_SUBPANELS_COLUMN_EXPANDED_CLASS` (20vw). */
export function getFilterSubpanelColumnWidthPx(viewportWidth: number): number {
  return viewportWidth * 0.2;
}

/** Pixel width matching `--width-preview-panel` (30vw); keep in sync with `globals.css`. */
export function getPreviewPanelWidthPx(viewportWidth: number): number {
  return viewportWidth * 0.3;
}

/** Root of `FilterSubpanelsColumn` — `querySelector` for live width during open/close transitions. */
export const FILTER_SUBPANELS_COLUMN_SELECTOR = "[data-fae-filter-subpanels-column]";

export const SUBPANEL_COLUMN_COLLAPSED_CLASS =
  "w-0 min-w-0 max-w-0 shrink-0 overflow-hidden";

/** HomeBar / Footer: no right border when a domain subpanel is open (subpanel provides the shared edge). */
export function filterChromeRightEdgeClass(mergeWithSubpanel: boolean) {
  return mergeWithSubpanel ? "border-r-0" : "border-r-hairline";
}
