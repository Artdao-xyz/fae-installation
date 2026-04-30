/**
 * Main filter chrome column: `--width-filter-chrome-column` (25vw below 2xl, 20vw from 2xl up).
 * Domain subpanel stack: 20vw. Preview dock: `--width-preview-panel` (30vw).
 * Options strip: `FILTER_OPTIONS_PANEL_CLIP_TRANSITION_CLASS`.
 */
export const FILTER_SIDEBAR_COLUMN_CLASS =
  "w-[var(--width-filter-chrome-column)] max-w-[var(--width-filter-chrome-column)] shrink-0";

export const FILTER_SIDEBAR_COLUMN_COLLAPSED_CLASS =
  "w-filter-narrow-column max-w-filter-narrow-column shrink-0";

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

/** Domain subpanel max height: starts at the margin-guide top and can extend to viewport bottom. */
export const FILTER_SUBPANEL_GUIDE_VIEWPORT_HEIGHT_CLASS =
  "max-h-[calc(100dvh_-_var(--inset-margin-guide))]";

/** Two open guide-height subpanels share the available top-guide-to-bottom viewport height. */
export const FILTER_SUBPANEL_GUIDE_VIEWPORT_HALF_HEIGHT_CLASS =
  "max-h-[calc((100dvh_-_var(--inset-margin-guide))_/_2)]";

export function filterSubpanelGuideViewportHeightClass(splitHeight: boolean): string {
  return splitHeight
    ? FILTER_SUBPANEL_GUIDE_VIEWPORT_HALF_HEIGHT_CLASS
    : FILTER_SUBPANEL_GUIDE_VIEWPORT_HEIGHT_CLASS;
}

/** Artists / Network subpanel: fill the assigned shell height; inner content scrolls as needed. */
export const ARTISTS_NETWORK_SUBPANEL_SCROLL_BODY_CLASS =
  "scrollbar-hide min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto";

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

/**
 * `max-lg` overlays (filter sheet, About): below `MobileSiteHeader` (safe area + `h-13`).
 * Pair with `max-lg:h-auto` on the same `fixed` node — `h-full` + `top`/`bottom` fills the viewport
 * and ignores `bottom`.
 */
export const MOBILE_OVERLAY_TOP_CLASS =
  "max-lg:top-[calc(env(safe-area-inset-top,0px)+3.25rem)]";

/**
 * Stack above the Serpentine bar: `h-11` footer row + home indicator (`max-lg` matches other chrome strips).
 * While the filter sheet is open the “Filters” row is hidden, so this must not include that bar.
 */
export const MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS =
  "max-lg:bottom-[calc(env(safe-area-inset-bottom,0px)+2.75rem)]";

export const MOBILE_OVERLAY_X_CLASS = "max-lg:left-0 max-lg:right-0";

/**
 * `max-lg` **`padding-bottom` on the main scroll column** (`overflow-y-auto` in `page.tsx`).
 *
 * **Important:** each return value must be a **complete string literal** in this file. Tailwind only emits
 * utilities it can see verbatim; template-built class names never land in CSS.
 *
 * Dock: optional `MobileLatestUpdatesStrip` (`12.875rem` = `floatingDockPanelOuterHeightPx()` @ 16px root),
 * two `h-11` rows,
 * `pb-[env(safe-area-inset-bottom)]` on the fixed dock; taxonomy grid `+3rem`.
 */
export function mobileMainScrollInsetClassName(options: {
  filtersPanelOpen: boolean;
  hasActiveTaxonomyFilters: boolean;
  showMobileLatestUpdatesStrip: boolean;
}): string {
  if (options.filtersPanelOpen) {
    return "max-lg:pb-[calc(2.75rem+env(safe-area-inset-bottom,0px))]";
  }
  if (options.showMobileLatestUpdatesStrip && options.hasActiveTaxonomyFilters) {
    return "max-lg:pb-[calc(12.875rem+2.75rem+2.75rem+env(safe-area-inset-bottom,0px)+3rem)]";
  }
  if (options.showMobileLatestUpdatesStrip && !options.hasActiveTaxonomyFilters) {
    return "max-lg:pb-[calc(12.875rem+2.75rem+2.75rem+env(safe-area-inset-bottom,0px))]";
  }
  if (!options.showMobileLatestUpdatesStrip && options.hasActiveTaxonomyFilters) {
    return "max-lg:pb-[calc(2.75rem+2.75rem+env(safe-area-inset-bottom,0px))]";
  }
  return "max-lg:pb-[calc(2.75rem+2.75rem+env(safe-area-inset-bottom,0px))]";
}
