/** Main filter column width (chrome + subpanel when open): 30vw, floor 320px. */
export const FILTER_SIDEBAR_COLUMN_CLASS =
  "w-[30vw] min-w-[320px] max-w-[30vw] shrink-0 transition-[width] duration-200 ease-out";

export const SUBPANEL_COLUMN_COLLAPSED_CLASS =
  "w-0 min-w-0 max-w-0 shrink-0 overflow-hidden";

/** HomeBar / Footer only: drop outer right edge when subpanels are open (seam from filter panel + subpanel stack). */
export function filterChromeRightEdgeClass(mergeWithSubpanel: boolean) {
  return mergeWithSubpanel ? "border-r-0" : "border-r-hairline";
}
