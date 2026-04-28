import type { ContentRow } from "@/data/content-types";

/** Max related outputs considered for source spread when there are no CMS links. */
export const PREVIEW_SUGGESTED_OUTPUTS_MAX = 20;

function normalizeOutputLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveLinkedOutputRows(
  linkedNames: readonly string[],
  catalog: readonly ContentRow[],
): ContentRow[] {
  const out: ContentRow[] = [];
  const seen = new Set<string>();
  for (const name of linkedNames) {
    const n = name.trim();
    if (!n) continue;
    const nn = normalizeOutputLabel(n);
    const row = catalog.find(
      (r) =>
        normalizeOutputLabel(r.title) === nn ||
        normalizeOutputLabel(r.shortTitle) === nn,
    );
    if (row && !seen.has(row.id)) {
      seen.add(row.id);
      out.push(row);
    }
  }
  return out;
}

function taxonomyOverlapScore(
  row: ContentRow,
  focus: ReadonlySet<string>,
  activity: ReadonlySet<string>,
): number {
  let n = 0;
  for (const f of row.focusAreas) {
    if (focus.has(f)) n++;
  }
  for (const a of row.activityTypes) {
    if (activity.has(a)) n++;
  }
  return n;
}

/**
 * CMS-linked outputs (full list, CMS order) and activity+focus matches as separate pools.
 * Preview rendering decides whether linked rows are exclusive; `maxRelatedCandidates` bounds
 * the related pool size.
 */
export function buildSuggestedSourceRowsSplit(
  row: ContentRow,
  catalog: readonly ContentRow[],
  maxRelatedCandidates: number = PREVIEW_SUGGESTED_OUTPUTS_MAX,
): { linked: ContentRow[]; related: ContentRow[] } {
  const linked = resolveLinkedOutputRows(row.linkedOutputNames, catalog).filter(
    (r) => r.id !== row.id,
  );
  const linkedIds = new Set(linked.map((r) => r.id));
  const used = new Set<string>([row.id, ...linkedIds]);

  const focusSet = new Set(row.focusAreas);
  const activitySet = new Set(row.activityTypes);
  const related: ContentRow[] = [];

  if (focusSet.size > 0 && activitySet.size > 0) {
    const candidates = catalog.filter(
      (r) =>
        r.id !== row.id &&
        !used.has(r.id) &&
        r.focusAreas.some((f) => focusSet.has(f)) &&
        r.activityTypes.some((a) => activitySet.has(a)),
    );

    candidates.sort((a, b) => {
      const da = taxonomyOverlapScore(a, focusSet, activitySet);
      const db = taxonomyOverlapScore(b, focusSet, activitySet);
      if (db !== da) return db - da;
      return a.title.localeCompare(b.title);
    });

    for (const c of candidates) {
      if (related.length >= maxRelatedCandidates) break;
      related.push(c);
      used.add(c.id);
    }
  }

  return { linked, related };
}

/**
 * Linked first, then related — truncated to `maxTotal` only after merge (all linked kept
 * when `maxTotal` is large enough).
 */
export function buildSuggestedOutputRows(
  row: ContentRow,
  catalog: readonly ContentRow[],
  maxTotal: number = PREVIEW_SUGGESTED_OUTPUTS_MAX,
): ContentRow[] {
  const { linked, related } = buildSuggestedSourceRowsSplit(
    row,
    catalog,
    maxTotal,
  );
  return [...linked, ...related].slice(0, maxTotal);
}
