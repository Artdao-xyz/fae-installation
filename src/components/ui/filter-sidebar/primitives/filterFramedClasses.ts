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
  "px-2.5 py-[3px] font-fira-mono text-[12px] font-normal leading-4 max-lg:py-[5px] max-lg:text-xs";

/**
 * Solid canvas + light blur + color transition — same base as `FilterSidebarCategoryRow` / subpanel labels.
 * Pair with `hover:bg-surface-hover/60` on the same node, or `group-hover:bg-surface-hover/60` on a child.
 */
export const interactiveChromeMatClass =
  "bg-surface-canvas backdrop-blur-fae-sm transition-colors duration-150 motion-reduce:transition-none";

export const interactiveChromeHoverClass = "hover:bg-surface-hover/60";

export const interactiveChromeGroupHoverClass = "group-hover:bg-surface-hover/60";

/**
 * All filter pill buttons (`dotted` / `square` / `rounded` + `FormatButton`): one `filter` on the root
 * `button` so hover matches across variants. `enabled:` skips hover when the control is `disabled` (e.g. unavailable).
 */
export const filterPillSingleLayerBrightnessHoverClass =
  "brightness-100 enabled:hover:brightness-[0.9] !transition-[filter,colors,background-color,border-color] duration-150 ease-out motion-reduce:!transition-none motion-reduce:enabled:hover:brightness-100";

/** Shared ink-frame + rounded inner surface (Activity Type / `FilterPill` `rounded`). */
export function filterFramedRoundedInnerClass(selected: boolean) {
  return `fae-control-filter-inner fae-control-shape-rounded ${filterPillLabelBoxClass} ${interactiveChromeMatClass} ${
    selected
      ? filterPillSelection.text
      : "text-ink-primary"
  }`;
}

export const filterFramedOuterFocusClass =
  "cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0";

/** Rounded outer: same hairline mat as unselected (border + fill), in selection blue. */
export const filterFramedRoundedOuterSelectedClass = filterPillSelection.outerMat;

/**
 * Single-layer dotted control: unselected dotted ink stroke; selected blue text + border.
 * Hover: `filterPillSingleLayerBrightnessHoverClass` (disabled / unavailable: no hover).
 */
export function filterDottedPillClassName(selected: boolean) {
  /** `min-w-0` (not `shrink-0`) so pills can respect a narrow parent and show ellipsis instead of clipping at the border. */
  const base = `fae-control-shape-square min-w-0 border-hairline ${interactiveChromeMatClass} ${filterPillSingleLayerBrightnessHoverClass} ${filterPillLabelBoxClass}`;
  return `${base} ${filterFramedOuterFocusClass} ${
    selected
      ? `border-dotted ${filterPillSelection.border} ${filterPillSelection.text}`
      : "border-dotted border-ink-primary text-ink-primary"
  }`;
}
