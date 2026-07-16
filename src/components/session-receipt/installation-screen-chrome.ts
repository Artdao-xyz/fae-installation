import {
  filterFramedOuterFocusClass,
  filterPillSingleLayerBrightnessHoverClass,
  interactiveChromeMatClass,
} from "@/components/ui/filter-sidebar/primitives/filterFramedClasses";

/** Kiosk overlays — above mobile menu / filter sheet / preview (`Z_INDEX.installationOverlay`). */
export const installationOverlayZClass = "!z-[310]";

/** Kiosk screensaver — above other installation overlays (`Z_INDEX.installationScreensaver`). */
export const installationScreensaverZClass = "!z-[320]";

export const installationOverlayBackdropClass =
  "bg-surface-canvas/80 backdrop-blur-fae-md";

/** Kiosk About — flush to viewport edges on `max-lg`; margin-guide inset on `lg+`. */
export const installationAboutShellClass = [
  "fixed inset-0 flex min-h-0 min-w-0 flex-col overflow-hidden bg-surface-canvas",
  installationOverlayZClass,
  "lg:top-[var(--inset-margin-guide)] lg:right-[var(--inset-margin-guide)] lg:bottom-[var(--inset-margin-guide)] lg:left-[var(--inset-margin-guide)] lg:border-hairline lg:border-solid lg:border-border",
].join(" ");

export const installationAboutScrollClass =
  "scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain";

/** Centers about copy in the remaining shell on `lg+`; top-aligned scroll on smaller viewports. */
export const installationAboutContentStageClass =
  "flex w-full px-3 py-3 lg:min-h-full lg:items-center lg:justify-center lg:px-6 lg:py-6";

/** Start screen hero glyph (intro / idle return). */
export const installationIntroGlyphSrc = "/glyph-2.png";

/** Screensaver hero glyph. */
export const installationScreensaverGlyphSrc = "/glyph-1.png";

/** Glyph mark above installation screen titles. */
export const installationGlyphMarkClass =
  "h-auto w-[440px] max-w-[90vw] shrink-0 self-center object-contain";

export const installationScreenTitleClass =
  "font-lust-text text-left text-[clamp(2rem,7vw,3rem)] leading-tight text-black-fae max-lg:whitespace-normal lg:whitespace-nowrap";

/** Matches home hero subtitle (`HeroTitleBlock`). */
export const installationScreenSubtitleBaseClass =
  "font-fira-mono text-sm font-medium leading-4 text-black-fae/50 sm:text-base sm:leading-5";

export const installationScreenSubtitleClass = `text-left ${installationScreenSubtitleBaseClass}`;

/** Title + subtitle stack — keeps the pair visually tight inside the screen column. */
export const installationScreenTitleBlockClass = "flex flex-col gap-0";

/** Screensaver title stack — centered within the bouncing content column. */
export const installationScreensaverTitleBlockClass =
  "flex w-full flex-col items-center gap-0";

export const installationScreensaverTitleClass =
  "font-lust-text whitespace-nowrap text-center text-[clamp(2rem,7vw,3rem)] leading-tight text-black-fae";

export const installationScreensaverSubtitleClass = `text-center ${installationScreenSubtitleBaseClass}`;

export const installationModalOverlayClass = [
  "fixed inset-0",
  installationOverlayZClass,
  installationOverlayBackdropClass,
].join(" ");

/** Centers installation title / button screens in the viewport. */
export const installationScreenStageClass =
  "flex flex-col items-center justify-center p-4 sm:p-6";

/**
 * Fixed content column — matches the intro button row (300 + 5 + 300)
 * so title, subtitle, and buttons stay aligned across screen swaps.
 */
export const installationScreenContentClass =
  "flex w-[605px] max-w-[calc(100vw-2rem)] shrink-0 flex-col items-start gap-5 sm:max-w-[calc(100vw-3rem)]";

/** Intro / confirm action rows — stack full-width buttons on `max-lg`. */
export const installationScreenActionsRowClass =
  "flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:gap-[5px]";

/** Overlay shell fade-in on mount. */
export const installationOverlayEnterClass =
  "transition-opacity duration-200 ease-out motion-reduce:transition-none";

/** Inner phase crossfade within a single overlay shell. */
export const installationPhaseEnterClass =
  "transition-opacity duration-200 ease-out motion-reduce:transition-none";

export const installationPhaseHiddenClass =
  "pointer-events-none opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none";

export const installationPhaseVisibleClass =
  "pointer-events-auto opacity-100";

export const installationIntroButtonClass = [
  "inline-flex h-[30px] w-full shrink-0 items-center justify-center gap-2 lg:w-[300px]",
  "border-hairline border-solid border-[#424242] px-5",
  interactiveChromeMatClass,
  filterPillSingleLayerBrightnessHoverClass,
  filterFramedOuterFocusClass,
  "font-fira-mono text-xs leading-[15px] text-ink-body",
  "enabled:hover:text-(--color-filter-pill-selection)",
].join(" ");

export const installationActionButtonClass = [
  "inline-flex h-[30px] min-w-0 w-full items-center justify-center gap-2 lg:flex-1 lg:w-auto",
  "border-thin border-solid border-[#424242] px-5",
  interactiveChromeMatClass,
  filterPillSingleLayerBrightnessHoverClass,
  filterFramedOuterFocusClass,
  "font-fira-mono text-xs leading-[15px] text-ink-body",
  "enabled:hover:text-(--color-filter-pill-selection)",
].join(" ");
