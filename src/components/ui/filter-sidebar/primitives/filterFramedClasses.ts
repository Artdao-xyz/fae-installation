/**
 * Selection blue (#0000ff) via `--color-filter-pill-selection`. Arbitrary `var()` classes so the
 * cascade always wins (theme utilities like `text-filter-pill-selection` may not emit reliably).
 */
export const filterPillSelection = {
  text: "text-[color:var(--color-filter-pill-selection)]",
  border: "border-[color:var(--color-filter-pill-selection)]",
  bg: "bg-[color:var(--color-filter-pill-selection)]",
  /** Same “mat” frame as `.fae-control-filter-outer`, but selection blue instead of ink. */
  outerMat: "!border-[color:var(--color-filter-pill-selection)] !bg-[color:var(--color-filter-pill-selection)]",
} as const;

/** Sidebar filter pill label box — keep in sync with `.fae-control-filter-inner` (layout shell only). */
export const filterPillLabelBoxClass =
  "px-2.5 py-[3px] font-fira-mono text-[12px] font-normal leading-4";

/** Shared ink-frame + rounded inner surface (Activity Type / `FilterPill` `rounded`). */
export function filterFramedRoundedInnerClass(selected: boolean) {
  return `fae-control-filter-inner fae-control-shape-rounded ${filterPillLabelBoxClass} ${
    selected
      ? `bg-surface-canvas ${filterPillSelection.text}`
      : "bg-surface-canvas text-ink-primary"
  }`;
}

export const filterFramedOuterFocusClass =
  "cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0";

/** Rounded outer: same hairline mat as unselected (border + fill), in selection blue. */
export const filterFramedRoundedOuterSelectedClass = filterPillSelection.outerMat;

/**
 * Single-layer dotted control: unselected dotted ink stroke; selected same surface bg, blue text + border.
 */
export function filterDottedPillClassName(selected: boolean) {
  /** `min-w-0` (not `shrink-0`) so pills can respect a narrow parent and show ellipsis instead of clipping at the border. */
  const base = `fae-control-shape-square min-w-0 border-hairline bg-surface-canvas/80 ${filterPillLabelBoxClass} backdrop-blur-fae-md`;
  return `${base} ${filterFramedOuterFocusClass} ${
    selected
      ? `border-dotted ${filterPillSelection.border} bg-surface-canvas/80 ${filterPillSelection.text}`
      : "border-dotted border-ink-primary text-ink-primary"
  }`;
}
