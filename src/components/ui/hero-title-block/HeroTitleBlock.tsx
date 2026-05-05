"use client";

import { useEffect, useRef, useState } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";

type Props = {
  title: string;
  subtitle: string;
  className?: string;
};

/**
 * Horizontal center of the main column **as if the domain subpanel stack were closed**:
 * `--width-filter-chrome-column` matches `FILTER_SIDEBAR_COLUMN_CLASS`; subpanel width is ignored so the title does not
 * track that column’s animation (avoids tremor). Desktop nudge matches former `absolute` layout.
 */
const HERO_LEFT_FILTERS_OPEN_CLASS =
  "left-[calc(var(--width-filter-chrome-column)+(100vw-var(--width-filter-chrome-column))/2)] md:left-[calc(var(--width-filter-chrome-column)+(100vw-var(--width-filter-chrome-column))/2-var(--width-filter-narrow-column))]";

export function HeroTitleBlock({ title, subtitle, className = "" }: Props) {
  const {
    selectedFocusAreas,
    selectedActivityTypes,
    selectedArtists,
    selectedFormats,
    selectedNetworks,
    selectedFaeBriefing,
    selectedProgramme,
    contentPreviewRow,
    filtersPanelOpen,
  } = useFilterSelection();

  /**
   * Title/subtitle only in true idle: no taxonomy, no briefing, no content preview.
   * (Previously only Focus+Activity hid the hero, so subpanel-only filters still showed it.)
   */
  const isHeroIdle =
    selectedFocusAreas.size === 0 &&
    selectedActivityTypes.size === 0 &&
    selectedArtists.size === 0 &&
    selectedFormats.size === 0 &&
    selectedNetworks.size === 0 &&
    selectedFaeBriefing == null &&
    selectedProgramme == null &&
    contentPreviewRow == null;

  const hideHero = !isHeroIdle;

  /**
   * Reveal title/subtitle on mount so they appear before Strapi-backed imagery loads in the canvas.
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

  const positionClass = filtersPanelOpen
    ? `fixed top-1/2 ${HERO_LEFT_FILTERS_OPEN_CLASS} -translate-x-1/2 -translate-y-1/2`
    : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  const hiddenUntilFade = !heroTextEnter;
  const mobileTitleParts = title.match(/^(.*\bArt)\s+(.*)$/);
  const mobileSubtitleParts = subtitle.match(/^(.*\bAdvanced)\s+(.*)$/);

  return (
    <div
      className={`z-20 flex flex-col items-start justify-center whitespace-nowrap [transition:opacity_300ms_ease-out] max-lg:items-center max-lg:gap-2 max-lg:text-center lg:[transition:left_500ms_ease-in-out,opacity_300ms_ease-out] motion-reduce:transition-none ${positionClass} ${
        hideHero ? "pointer-events-none opacity-0" : "opacity-100"
      } ${className}`}
      aria-hidden={hideHero}
    >
      <div
        className={`font-lust-text justify-start text-6xl leading-[65px] text-black-fae max-lg:text-center max-lg:text-5xl max-lg:leading-13 ${
          heroTextEnter ? "fae-hero-title-line" : ""
        }`}
        style={
          hiddenUntilFade
            ? { opacity: 0, visibility: "hidden" as const }
            : undefined
        }
      >
        <span className="max-lg:hidden">{title}</span>
        <span className="hidden max-lg:block">
          {mobileTitleParts ? (
            <>
              {mobileTitleParts[1]}
              <br />
              {mobileTitleParts[2]}
            </>
          ) : (
            title
          )}
        </span>
      </div>
      <div
        className={`font-fira-mono justify-start text-sm font-medium leading-4 text-black-fae/50 max-lg:text-center max-lg:text-base max-lg:leading-5 ${
          heroTextEnter ? "fae-hero-subtitle-line" : ""
        }`}
        style={
          hiddenUntilFade
            ? { opacity: 0, visibility: "hidden" as const }
            : undefined
        }
      >
        <span className="max-lg:hidden">{subtitle}</span>
        <span className="hidden max-lg:block">
          {mobileSubtitleParts ? (
            <>
              {mobileSubtitleParts[1]}
              <br />
              {mobileSubtitleParts[2]}
            </>
          ) : (
            subtitle
          )}
        </span>
      </div>
    </div>
  );
}
