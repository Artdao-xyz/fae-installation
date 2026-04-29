"use client";

import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import {
  filterFramedRoundedInnerClass,
  filterFramedRoundedOuterSelectedClass,
} from "@/components/ui/filter-sidebar/primitives/filterFramedClasses";

/** Non-interactive pill chips (visual only; parent bar opens the filter panel). */
function SelectedFilterPillLabel({ label }: { label: string }) {
  return (
    <span
      className={`fae-control-filter-outer inline-flex max-w-full shrink-0 items-baseline ${filterFramedRoundedOuterSelectedClass}`}
      aria-hidden
    >
      <span className={filterFramedRoundedInnerClass(true)}>{label}</span>
    </span>
  );
}

export function MobileSelectedFiltersStrip() {
  const {
    selectedFocusAreas,
    selectedActivityTypes,
    selectedFormats,
    selectedArtists,
    selectedNetworks,
    selectedFaeBriefing,
  } = useFilterSelection();

  const labels: { key: string; label: string }[] = [
    ...[...selectedFocusAreas].map((label) => ({
      key: `focus:${label}`,
      label,
    })),
    ...[...selectedActivityTypes].map((label) => ({
      key: `activity:${label}`,
      label,
    })),
    ...[...selectedFormats].map((label) => ({
      key: `format:${label}`,
      label,
    })),
    ...(selectedFaeBriefing
      ? [
          {
            key: `briefing:${selectedFaeBriefing}`,
            label: selectedFaeBriefing,
          },
        ]
      : []),
    ...[...selectedArtists].map((label) => ({
      key: `artist:${label}`,
      label,
    })),
    ...[...selectedNetworks].map((label) => ({
      key: `network:${label}`,
      label,
    })),
  ];

  if (labels.length === 0) {
    return null;
  }

  return (
    <div className="scrollbar-hide flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto py-4">
      {labels.map((item) => (
        <SelectedFilterPillLabel key={item.key} label={item.label} />
      ))}
    </div>
  );
}
