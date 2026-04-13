export type FilterSidebarCategoryTone =
  | "fae-briefings"
  | "fellowships"
  | "rd"
  | "editorial"
  | "artists"
  | "network";

export const toneAccentClass: Record<
  FilterSidebarCategoryTone,
  { glow: string; marker: string }
> = {
  "fae-briefings": {
    glow: "bg-filter-category-fae-briefings",
    marker: "text-filter-category-fae-briefings",
  },
  fellowships: {
    glow: "bg-filter-category-fellowships",
    marker: "text-filter-category-fellowships",
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
  fellowships: "border-filter-category-fellowships",
  rd: "border-filter-category-rd",
  editorial: "border-filter-category-editorial",
  artists: "border-filter-category-artists",
  network: "border-filter-category-network",
};
