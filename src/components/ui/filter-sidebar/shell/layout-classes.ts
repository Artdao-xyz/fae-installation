/**
 * Main filter column when a domain subpanel is open. On `lg+`, fixed fractional width with 320px
 * floor (desktop two-column chrome). Below `lg`, fills the remaining row beside the rail — avoid
 * `min-w-[320px]` there or pills overflow off-screen next to the narrow rail.
 */
export const FILTER_SIDEBAR_COLUMN_CLASS =
  "max-lg:w-full max-lg:min-w-0 max-lg:max-w-full shrink-0 transition-[width] duration-200 ease-out lg:w-[27.5vw] lg:min-w-[320px] lg:max-w-[27.5vw] lg:shrink-0";

export const SUBPANEL_COLUMN_COLLAPSED_CLASS =
  "w-0 min-w-0 max-w-0 shrink-0 overflow-hidden";

/** HomeBar / Footer only: drop outer right edge when subpanels are open (seam from filter panel + subpanel stack). */
export function filterChromeRightEdgeClass(mergeWithSubpanel: boolean) {
  return mergeWithSubpanel ? "border-r-0" : "border-r-hairline";
}
