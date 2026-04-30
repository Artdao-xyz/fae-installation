import type { ContentRow } from "@/data/content-types";

/**
 * Lowercase, strip zero-width chars, normalize spaces (incl. NBSP) for reliable substring checks.
 */
function normalizeForSearch(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTokensFromQuery(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word match (case-insensitive) — avoids `era` hitting inside `interoperability`. */
function wholeWordMatch(haystack: string, token: string): boolean {
  if (token.length === 0) return true;
  const re = new RegExp(`\\b${escapeRegExp(token)}\\b`, "iu");
  return re.test(haystack);
}

/**
 * Contiguous substring phrases to try against the haystack. When the query starts with
 * **a / an / the** and the rest is still **multi-word**, we also try the rest alone — so
 * `"a new era"` matches `"new era (art) tech development"` even without a leading `"a "`.
 */
function phraseMatchVariants(normQuery: string): string[] {
  const variants = [normQuery];
  const m = normQuery.match(/^(a|an|the)\s+(.+)$/);
  const rest = m?.[2]?.trim() ?? "";
  if (rest.length > 0 && rest.includes(" ")) {
    variants.push(rest);
  }
  return variants;
}

/** Single lowercased string over all fields we search (token-wise AND across this blob). */
function rowSearchBlob(row: ContentRow): string {
  const parts: string[] = [
    row.title,
    row.shortTitle,
    row.shareSlug,
    row.caption,
    row.yearLabel,
    String(row.year),
    row.content,
    ...row.focusAreas,
    ...row.activityTypes,
    ...row.formats,
    ...row.networks,
    ...row.artists,
    ...row.linkedOutputNames,
    ...row.resources.flatMap((r) => [r.url, r.label]),
  ];
  return normalizeForSearch(parts.join(" "));
}

/** Title fields should support typeahead-style partial matches. */
function rowTitleSearchBlob(row: ContentRow): string {
  return normalizeForSearch([row.title, row.shortTitle].join(" "));
}

/**
 * Case-insensitive search over the row blob (titles, slug, caption, body, taxonomy, years, …).
 * - **Title / short title:** substring match first, so incomplete typed queries
 *   like `"fu"` or `"futu"` match `"Future Art Ecosystem"`.
 * - **Multi-word:** matches if **any phrase variant** is a substring — full normalized query,
 *   plus without a leading **a / an / the** when the remainder is still multi-word
 *   (e.g. `"a new era"` also tries `"new era"`).
 *   Otherwise, if no **single-letter** token: every token as a **whole word** (reordered queries
 *   like `"era new"` vs `"a new era"` when variants don’t apply).
 * - **Non-title single word:** whole-word only (so `"new"` doesn’t match inside `newfoundland`).
 * Spacing / NBSP is normalized first.
 *
 * Catalog rows may omit `content` until detail load — body-only phrases won’t match until then.
 */
export function filterContentRowsForSearchQuery(
  query: string,
  rows: readonly ContentRow[],
): ContentRow[] {
  const normQuery = normalizeForSearch(query);
  const tokens = searchTokensFromQuery(normQuery);
  if (tokens.length === 0) return [];

  const phraseVariants = phraseMatchVariants(normQuery);

  return rows.filter((row) => {
    const titleHaystack = rowTitleSearchBlob(row);
    if (phraseVariants.some((p) => titleHaystack.includes(p))) return true;

    const haystack = rowSearchBlob(row);
    if (tokens.length === 1) {
      return wholeWordMatch(haystack, tokens[0]!);
    }
    if (phraseVariants.some((p) => haystack.includes(p))) return true;
    if (tokens.some((t) => t.length < 2)) return false;
    return tokens.every((t) => wholeWordMatch(haystack, t));
  });
}
