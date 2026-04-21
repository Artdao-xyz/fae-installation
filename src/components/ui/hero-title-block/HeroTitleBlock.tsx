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
  } = useFilterSelection();
  const filterActive =
    selectedFocusAreas.size > 0 || selectedActivityTypes.size > 0;

  /**
   * Reveal title/subtitle on mount so they appear before Strapi-backed imagery loads in the canvas.
   * (Position still follows `filtersPanelOpen` for layout; minor shift may occur when the panel opens.)
   */
  const heroRevealOnceRef = useRef(false);
  const [heroTextEnter, setHeroTextEnter] = useState(false);
  useEffect(() => {
    if (heroRevealOnceRef.current) return;
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
  }, []);

  const innerWidth = useInnerWidth();
  const subpanelHalfPx =
    filtersPanelOpen && filterSubpanelsOpen
      ? getFilterSubpanelColumnWidthPx(innerWidth) / 2
      : 0;

  /** Open: align to main column (incl. desktop 35px nudge). Closed: center in full viewport. */
  const useSubpanelShift = filtersPanelOpen && filterSubpanelsOpen;

  /**
   * Use Tailwind translate for normal centering; inline `transform` only when subpanel needs px shift.
   * (Always applying translate via `style` broke alignment with `md:left-[calc(50%-…)]` in some layouts.)
   */
  const positionClass = filtersPanelOpen
    ? `absolute top-1/2 left-1/2 md:left-[calc(50%-var(--width-filter-narrow-column))]${
        useSubpanelShift ? "" : " -translate-x-1/2 -translate-y-1/2"
      }`
    : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  const hiddenUntilFade = !heroTextEnter;

  return (
    <div
      className={`z-20 flex flex-col items-start justify-center whitespace-nowrap transition-opacity duration-300 ease-out motion-reduce:transition-none ${positionClass} ${
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
