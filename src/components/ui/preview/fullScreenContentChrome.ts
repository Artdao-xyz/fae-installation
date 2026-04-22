/**
 * Shared full-screen “content” shell (inset, border) and “Show more / Show less” control.
 * Used by the preview and About full-screen views.
 */
export const fullScreenContentShellClass =
  "fixed top-[var(--inset-margin-guide)] right-[var(--inset-margin-guide)] bottom-[var(--inset-margin-guide)] left-[var(--inset-margin-guide)] z-50 flex min-h-0 min-w-0 flex-col overflow-hidden border-hairline border-solid border-ink-primary bg-surface-canvas";

export const fullScreenContentScrollClass =
  "scrollbar-hide min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-12 md:py-8";

export const fullScreenContentInnerClass =
  "mx-auto flex max-w-3xl flex-col gap-5";

export const fullScreenShowMoreLessButtonClass =
  "inline-flex w-fit items-center gap-2 self-start border-t-hairline border-r-hairline border-solid border-ink-primary px-5 py-3 font-fira-mono text-sm text-black-fae transition-colors hover:bg-black-fae/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas";

export const fullScreenShowMoreLessLabelClass =
  "select-none text-[13px] leading-none tracking-wide";
