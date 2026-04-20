/**
 * Mobile filter header (replaces "clear all"): `n/total` per Figma — selected in blue when n&gt; 0.
 */
export function FilterSelectionFractionLabel({
  selected,
  total,
}: {
  selected: number;
  total: number;
}) {
  return (
    <span
      className="font-fira-mono text-[10px] font-medium leading-3 tabular-nums tracking-tighter"
      aria-hidden
    >
      <span
        className={
          selected > 0 ? "text-(--color-filter-pill-selection)" : "text-ink-body/50"
        }
      >
        {selected}
      </span>
      <span className="text-ink-body/50">/{total}</span>
    </span>
  );
}
