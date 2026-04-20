"use client";

import { useSyncExternalStore } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { getFilterSubpanelColumnWidthPx } from "@/components/ui/filter-sidebar/shell/layout-classes";

function subscribeResize(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

function useInnerWidth(): number {
  return useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth,
    () => 1024,
  );
}

type Props = {
  title: string;
  subtitle: string;
  className?: string;
};

export function HeroTitleBlock({ title, subtitle, className = "" }: Props) {
  const {
    selectedFocusAreas,
    selectedActivityTypes,
    filtersPanelOpen,
    filterSubpanelsOpen,
  } = useFilterSelection();
  const filterActive =
    selectedFocusAreas.size > 0 || selectedActivityTypes.size > 0;

  const innerWidth = useInnerWidth();
  const subpanelHalfPx =
    filtersPanelOpen && filterSubpanelsOpen
      ? getFilterSubpanelColumnWidthPx(innerWidth) / 2
      : 0;

  const useSubpanelShift = filtersPanelOpen && filterSubpanelsOpen;

  /** Open: align to main column (incl. desktop 35px nudge). Closed: center in full viewport. */
  const positionClass = filtersPanelOpen
    ? `absolute top-1/2 left-1/2 md:left-[calc(50%-var(--width-filter-narrow-column))]${
        useSubpanelShift ? "" : " -translate-x-1/2 -translate-y-1/2"
      }`
    : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  return (
    <div
      className={`z-10 flex flex-col items-start justify-center transition-opacity duration-500 ease-out motion-reduce:transition-none whitespace-nowrap ${positionClass} ${
        filterActive ? "pointer-events-none opacity-0" : "opacity-100"
      } ${className}`}
      style={
        useSubpanelShift
          ? {
              transform: `translateX(calc(-50% - ${subpanelHalfPx}px)) translateY(-50%)`,
            }
          : undefined
      }
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
