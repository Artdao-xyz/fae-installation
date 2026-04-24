/** Case-insensitive substring match on network labels (from catalog-derived list). */
export function filterNetworkLabelsForSearchQuery(
  query: string,
  labels: readonly string[],
): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return labels.filter((label) => label.toLowerCase().includes(q));
}
