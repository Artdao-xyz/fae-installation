"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
    contentCatalogStatus,
  } = useFilterSelection();
  const filterActive =
    selectedFocusAreas.size > 0 || selectedActivityTypes.size > 0;

  /**
   * Fade in only after filter chrome has settled (panel open on success, or error with panel
   * staying closed). Otherwise we briefly show the hero `fixed` centered, then jump to
   * `absolute` when `filtersPanelOpen` flips — reads as visible → hidden → fade in.
   */
  const layoutReadyForHeroFade =
    filtersPanelOpen || contentCatalogStatus === "error";

  const heroRevealOnceRef = useRef(false);
  const [heroTextEnter, setHeroTextEnter] = useState(false);
  useEffect(() => {
    if (heroRevealOnceRef.current || !layoutReadyForHeroFade) return;
    heroRevealOnceRef.current = true;
    let cancelled = false;
    let raf = 0;
    queueMicrotask(() => {
      if (cancelled || typeof window === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setHeroTextEnter(true);
        return;
      }
      raf = requestAnimationFrame(() => {
        if (!cancelled) setHeroTextEnter(true);
      });
    });
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [layoutReadyForHeroFade]);

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

  const hiddenUntilFade = !heroTextEnter;

  return (
    <div
      className={`z-10 flex flex-col items-start justify-center transition-opacity duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none whitespace-nowrap ${positionClass} ${
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
      <div
        className={`font-lust-text justify-start text-6xl leading-[65px] text-black-fae ${
          heroTextEnter ? "fae-hero-title-line" : ""
        }`}
        style={
          hiddenUntilFade
            ? { opacity: 0, visibility: "hidden" as const }
            : undefined
        }
      >
        {title}
      </div>
      <div
        className={`font-fira-mono justify-start text-sm font-medium leading-4 text-black-fae/50 ${
          heroTextEnter ? "fae-hero-subtitle-line" : ""
        }`}
        style={
          hiddenUntilFade
            ? { opacity: 0, visibility: "hidden" as const }
            : undefined
        }
      >
        {subtitle}
      </div>
    </div>
  );
}
