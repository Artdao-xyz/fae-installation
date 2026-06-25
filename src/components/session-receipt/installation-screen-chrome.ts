import {
  filterFramedOuterFocusClass,
  filterPillSingleLayerBrightnessHoverClass,
  interactiveChromeMatClass,
} from "@/components/ui/filter-sidebar/primitives/filterFramedClasses";

export const installationOverlayZClass = "z-[250]";

export const installationOverlayBackdropClass =
  "bg-surface-canvas/80 backdrop-blur-fae-md";

export const installationScreensaverBackdropClass = "bg-black";

/** Start screen hero glyph (intro / idle return). */
export const installationIntroGlyphSrc = "/glyph-2.png";

/** Screensaver hero glyph. */
export const installationScreensaverGlyphSrc = "/glyph-1.png";

/** Glyph mark above installation screen titles. */
export const installationGlyphMarkClass =
  "h-auto w-[440px] max-w-[90vw] shrink-0 self-center object-contain";

export const installationScreenTitleClass =
  "font-lust-text whitespace-nowrap text-left text-[clamp(2rem,7vw,3rem)] leading-tight text-black-fae";

export const installationScreenSubtitleClass =
  "text-left font-fira-mono text-sm font-medium leading-5 text-black-fae/50 sm:text-base";

/** Title + subtitle stack — keeps the pair visually tight inside the screen column. */
export const installationScreenTitleBlockClass = "flex flex-col gap-0";

export const installationScreensaverTitleClass =
  "font-lust-text whitespace-nowrap text-left text-[clamp(2rem,7vw,3rem)] leading-tight text-white";

export const installationScreensaverSubtitleClass =
  "text-left font-fira-mono text-sm font-medium leading-5 text-white/50 sm:text-base";

export const installationModalOverlayClass = [
  "fixed inset-0",
  installationOverlayZClass,
  installationOverlayBackdropClass,
].join(" ");

/** Centers installation title / button screens in the viewport. */
export const installationScreenStageClass =
  "flex flex-col items-center justify-center p-6";

/**
 * Fixed content column — matches the intro button row (300 + 5 + 300)
 * so title, subtitle, and buttons stay aligned across screen swaps.
 */
export const installationScreenContentClass =
  "flex w-[605px] max-w-[calc(100vw-3rem)] shrink-0 flex-col items-start gap-5";

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
  "inline-flex h-[30px] w-[300px] shrink-0 items-center justify-center gap-2",
  "border-hairline border-solid border-[#424242] px-5",
  interactiveChromeMatClass,
  filterPillSingleLayerBrightnessHoverClass,
  filterFramedOuterFocusClass,
  "font-fira-mono text-xs leading-[15px] text-ink-body",
  "enabled:hover:text-(--color-filter-pill-selection)",
].join(" ");

export const installationActionButtonClass = [
  "inline-flex h-[30px] min-w-0 flex-1 items-center justify-center gap-2",
  "border-thin border-solid border-[#424242] px-5",
  interactiveChromeMatClass,
  filterPillSingleLayerBrightnessHoverClass,
  filterFramedOuterFocusClass,
  "font-fira-mono text-xs leading-[15px] text-ink-body",
  "enabled:hover:text-(--color-filter-pill-selection)",
].join(" ");
