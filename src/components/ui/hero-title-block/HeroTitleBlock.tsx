"use client";

import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";

type Props = {
  title: string;
  subtitle: string;
  className?: string;
};

export function HeroTitleBlock({ title, subtitle, className = "" }: Props) {
  const { selectedFocusAreas, selectedActivityTypes } = useFilterSelection();
  const filterActive =
    selectedFocusAreas.size > 0 || selectedActivityTypes.size > 0;

  return (
    <div
      className={`absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-start justify-center transition-opacity duration-500 ease-out motion-reduce:transition-none whitespace-nowrap ${
        filterActive ? "pointer-events-none opacity-0" : "opacity-100"
      } ${className}`}
      aria-hidden={filterActive}
    >
      <div className="font-lust-text justify-start text-6xl leading-[65px] text-black-fae">
        {title}
      </div>
      <div className="font-fira-mono justify-start text-sm font-medium leading-4 text-black-fae/50">
        {subtitle}
      </div>
    </div>
  );
}
