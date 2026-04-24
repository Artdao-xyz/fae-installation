import type { ContentRow } from "@/data/content-types";

/**
 * Case-insensitive match against titles, taxonomy, year, resources, and plain `content`.
 * Catalog rows from Strapi may omit body text (`content` empty) until preview loads detail;
 * in that case search won’t match inside the article body.
 */
export function filterContentRowsForSearchQuery(
  query: string,
  rows: readonly ContentRow[],
): ContentRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return rows.filter((row) => {
    if (row.title.toLowerCase().includes(q)) return true;
    if (row.shortTitle.toLowerCase().includes(q)) return true;
    if (row.content.length > 0 && row.content.toLowerCase().includes(q))
      return true;
    if (String(row.year).includes(q)) return true;
    if (row.yearLabel.toLowerCase().includes(q)) return true;
    if (row.focusAreas.some((x) => x.toLowerCase().includes(q))) return true;
    if (row.activityTypes.some((x) => x.toLowerCase().includes(q))) return true;
    if (row.formats.some((x) => x.toLowerCase().includes(q))) return true;
    if (row.networks.some((x) => x.toLowerCase().includes(q))) return true;
    if (row.artists.some((x) => x.toLowerCase().includes(q))) return true;
    if (row.resources.some((x) => x.toLowerCase().includes(q))) return true;
    return false;
  });
}
