import { CONTENT_FIXTURE_ROWS } from "@/data/content-fixture";
import type { ContentRow } from "@/data/content-types";

/** Case-insensitive match against fixture titles and taxonomy fields. */
export function filterContentRowsForSearchQuery(query: string): ContentRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return CONTENT_FIXTURE_ROWS.filter((row) => {
    if (row.title.toLowerCase().includes(q)) return true;
    if (String(row.year).includes(q)) return true;
    if (row.focusAreas.some((x) => x.toLowerCase().includes(q))) return true;
    if (row.activityTypes.some((x) => x.toLowerCase().includes(q))) return true;
    if (row.formats.some((x) => x.toLowerCase().includes(q))) return true;
    if (row.networks.some((x) => x.toLowerCase().includes(q))) return true;
    return false;
  });
}
