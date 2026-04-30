import type { ContentProgramme, ContentRow } from "@/data/content-types";

/**
 * Same semantics as particle spread filtering — keep in sync with product default (intersection / AND).
 */
export type FilterMatchMode = "intersection" | "union";

/** All catalog-backed taxonomy dimensions used for spread + sidebar availability. */
export type TaxonomyFilterSelection = {
  programme: ContentProgramme | null;
  focus: ReadonlySet<string>;
  activity: ReadonlySet<string>;
  artists: ReadonlySet<string>;
  formats: ReadonlySet<string>;
  networks: ReadonlySet<string>;
};

export function rowMatchesFilterSelection(
  row: ContentRow,
  sel: TaxonomyFilterSelection,
  mode: FilterMatchMode,
): boolean {
  const { programme, focus, activity, artists, formats, networks } = sel;
  /**
   * All dimensions empty = no taxonomy constraints — every row is eligible (unfiltered),
   * including when the user hits “clear all” on the last active category.
   * (Previously this returned `false` for every row, so clearing filters seemed to do nothing
   * or “matched nothing” depending on the UI.)
   */
  if (
    programme == null &&
    focus.size === 0 &&
    activity.size === 0 &&
    artists.size === 0 &&
    formats.size === 0 &&
    networks.size === 0
  ) {
    return true;
  }

  if (programme != null && row.programme !== programme) {
    return false;
  }

  if (mode === "union") {
    if (focus.size > 0 && !row.focusAreas.some((f) => focus.has(f))) {
      return false;
    }
    if (activity.size > 0 && !row.activityTypes.some((a) => activity.has(a))) {
      return false;
    }
    if (artists.size > 0 && !row.artists.some((a) => artists.has(a))) {
      return false;
    }
    if (formats.size > 0 && !row.formats.some((f) => formats.has(f))) {
      return false;
    }
    if (networks.size > 0 && !row.networks.some((n) => networks.has(n))) {
      return false;
    }
    return true;
  }

  if (focus.size > 0) {
    for (const f of focus) {
      if (!row.focusAreas.includes(f)) return false;
    }
  }
  if (activity.size > 0) {
    for (const a of activity) {
      if (!row.activityTypes.includes(a)) return false;
    }
  }
  if (artists.size > 0) {
    for (const a of artists) {
      if (!row.artists.includes(a)) return false;
    }
  }
  if (formats.size > 0) {
    for (const f of formats) {
      if (!row.formats.includes(f)) return false;
    }
  }
  if (networks.size > 0) {
    for (const n of networks) {
      if (!row.networks.includes(n)) return false;
    }
  }
  return true;
}

export function countMatchingFilterRows(
  rows: readonly ContentRow[],
  sel: TaxonomyFilterSelection,
  mode: FilterMatchMode,
): number {
  let n = 0;
  for (const row of rows) {
    if (rowMatchesFilterSelection(row, sel, mode)) {
      n += 1;
    }
  }
  return n;
}

/** Resulting set if the user toggles `label` in this dimension (add if not selected, remove if selected). */
export function toggledSet(
  current: ReadonlySet<string>,
  label: string,
  isSelected: boolean,
): Set<string> {
  const next = new Set(current);
  if (isSelected) next.delete(label);
  else next.add(label);
  return next;
}
