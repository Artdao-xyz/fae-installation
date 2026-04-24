export type FilterSidebarCategoryTone =
  | "fae-briefings"
  | "latest-updates"
  | "rd"
  | "editorial"
  | "artists"
  | "network";

/** Pre-colored marker assets in `/public/svg/` (20×20 source; shown at `size-5` in the filter UI). */
export const categoryMarkerImageSrc: Record<
  FilterSidebarCategoryTone,
  string
> = {
  "fae-briefings": "/svg/briefing.svg",
  "latest-updates": "/svg/latest-updates.svg",
  /** Filename on disk is `r&d.svg`; `&` must be encoded in the URL path. */
  rd: "/svg/r%26d.svg",
  editorial: "/svg/editorial.svg",
  artists: "/svg/artists.svg",
  network: "/svg/network.svg",
};

export const toneAccentClass: Record<
  FilterSidebarCategoryTone,
  { glow: string; marker: string }
> = {
  "fae-briefings": {
    glow: "bg-filter-category-fae-briefings",
    marker: "text-filter-category-fae-briefings",
  },
  "latest-updates": {
    glow: "bg-filter-category-latest-updates",
    marker: "text-filter-category-latest-updates",
  },
  rd: {
    glow: "bg-filter-category-rd",
    marker: "text-filter-category-rd",
  },
  editorial: {
    glow: "bg-filter-category-editorial",
    marker: "text-filter-category-editorial",
  },
  artists: {
    glow: "bg-filter-category-artists",
    marker: "text-filter-category-artists",
  },
  network: {
    glow: "bg-filter-category-network",
    marker: "text-filter-category-network",
  },
};

export const toneSelectedBorderClass: Record<FilterSidebarCategoryTone, string> = {
  "fae-briefings": "border-filter-category-fae-briefings",
  "latest-updates": "border-filter-category-latest-updates",
  rd: "border-filter-category-rd",
  editorial: "border-filter-category-editorial",
  artists: "border-filter-category-artists",
  network: "border-filter-category-network",
};

/**
 * Subpanel parent row when a filter in that group is on: category color at 5% into the canvas.
 * `!` so it wins over default mat.
 */
export const categorySubpanelLabelSelectionBgClass: Record<
  FilterSidebarCategoryTone,
  string
> = {
  "fae-briefings":
    "!bg-[color:color-mix(in_srgb,var(--color-filter-category-fae-briefings)_5%,var(--color-surface-canvas))]",
  "latest-updates":
    "!bg-[color:color-mix(in_srgb,var(--color-filter-category-latest-updates)_5%,var(--color-surface-canvas))]",
  rd: "!bg-[color:color-mix(in_srgb,var(--color-filter-category-rd)_5%,var(--color-surface-canvas))]",
  editorial:
    "!bg-[color:color-mix(in_srgb,var(--color-filter-category-editorial)_5%,var(--color-surface-canvas))]",
  artists:
    "!bg-[color:color-mix(in_srgb,var(--color-filter-category-artists)_5%,var(--color-surface-canvas))]",
  network:
    "!bg-[color:color-mix(in_srgb,var(--color-filter-category-network)_5%,var(--color-surface-canvas))]",
};
