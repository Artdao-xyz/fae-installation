import { NETWORK_LABELS } from "@/data/content-taxonomy";

/** Case-insensitive substring match on network filter labels. */
export function filterNetworkLabelsForSearchQuery(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return NETWORK_LABELS.filter((label) => label.toLowerCase().includes(q));
}
