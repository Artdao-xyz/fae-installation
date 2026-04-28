"use client";

import { useCallback, useState } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { BriefingsDropdownPanel } from "../domains/briefings/BriefingsDropdownPanel";
import { ArtistsDropdownPanel } from "../domains/artists/ArtistsDropdownPanel";
import { NetworkDropdownPanel } from "../domains/network/NetworkDropdownPanel";
import { RDProjectsDropdownPanel } from "../domains/rd-projects/RDProjectsDropdownPanel";
import { FilterSidebarMobileRailButton } from "../primitives/FilterSidebarMobileRailButton";
import { ActivityType } from "../sections/ActivityType";
import { FocusAreas } from "../sections/FocusAreas";
import { FilterTaxonomyEmptyHint } from "./FilterTaxonomyEmptyHint";
import { MobileFormatScrollRow } from "./MobileFormatScrollRow";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { filterPillSelection } from "@/components/ui/filter-sidebar/primitives/filterFramedClasses";
import { filterChromeRightEdgeClass } from "./layout-classes";

/** Recolor static SVG assets via `background-color` + mask (fills are fixed in the files). */
const FILTER_ACTION_ICON_MASK_BASE =
  "block shrink-0 [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat] [-webkit-mask-size:contain] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat]";

const MOBILE_FILTER_ACTIONS_LABEL_CLASS =
  "text-[#303030] text-sm font-normal font-lust-text leading-4 tracking-wide";

export type MobileFilterCategoryId =
  | "focus"
  | "activity"
  | "briefings"
  | "fellowships"
  | "rd"
  | "editorial"
  | "artists"
  | "network";

export type MobileFilterOptionsLayoutProps = {
  panelId: string;
};

export function MobileFilterOptionsLayout({
  panelId,
}: MobileFilterOptionsLayoutProps) {
  const [active, setActive] = useState<MobileFilterCategoryId>("focus");
  const {
    selectedFocusAreas,
    selectedActivityTypes,
    selectedFaeBriefing,
    selectedArtists,
    selectedNetworks,
    hasActiveTaxonomyFilters,
    filterMatchingRowCount,
    clearAllFilters,
    setFiltersPanelOpen,
  } = useFilterSelection();

  const filterActionsIconActive =
    hasActiveTaxonomyFilters || selectedFaeBriefing != null;

  const rail = useCallback(
    (
      id: MobileFilterCategoryId,
      label: string,
      tone: FilterSidebarCategoryTone,
      hasSelection: boolean,
      showMarker = true,
      flexToFill = false,
    ) => (
      <FilterSidebarMobileRailButton
        key={id}
        label={label}
        tone={tone}
        selected={active === id}
        hasSelection={hasSelection}
        showMarker={showMarker}
        flexToFill={flexToFill}
        onClick={() => setActive(id)}
      />
    ),
    [active],
  );

  return (
    <aside
      className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-solid border-ink-primary bg-surface-canvas ${filterChromeRightEdgeClass(false)}`}
      aria-label="Filters"
    >
      <FilterTaxonomyEmptyHint />
      <div
        id={panelId}
        className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden"
        role="region"
        aria-label="Filter options"
      >
        <nav
          className="scrollbar-hide flex h-full min-h-0 w-[132px] min-w-[132px] max-w-[132px] shrink-0 flex-col overflow-y-auto overflow-x-hidden bg-surface-canvas"
          aria-label="Filter categories"
        >
          {rail(
            "focus",
            "Focus Areas",
            "fae-briefings",
            selectedFocusAreas.size > 0,
            false,
            true,
          )}
          {rail(
            "activity",
            "Activity Type",
            "editorial",
            selectedActivityTypes.size > 0,
            false,
            true,
          )}
          {rail(
            "briefings",
            "FAE Briefings",
            "fae-briefings",
            selectedFaeBriefing != null,
          )}
          {rail("fellowships", "Fellowships", "latest-updates", false)}
          {rail("rd", "R&D Projects", "rd", false)}
          {rail("editorial", "Editorial", "editorial", false)}
          {rail("artists", "Artists", "artists", selectedArtists.size > 0)}
          {rail("network", "Network", "network", selectedNetworks.size > 0)}
        </nav>
        <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-surface-canvas">
          {active === "focus" ? (
            <FocusAreas collapsed={false} chromeless />
          ) : null}
          {active === "activity" ? (
            <ActivityType collapsed={false} chromeless />
          ) : null}
          {active === "briefings" ? (
            <div className="w-full shrink-0 p-2">
              <BriefingsDropdownPanel variant="subcolumn" mobilePane />
            </div>
          ) : null}
          {active === "fellowships" ? (
            <p className="px-3 py-3 font-fira-mono text-[10px] leading-snug text-ink-body/70">
              No content yet.
            </p>
          ) : null}
          {active === "rd" ? (
            <div className="w-full shrink-0 p-2">
              <RDProjectsDropdownPanel variant="subcolumn" mobilePane />
            </div>
          ) : null}
          {active === "editorial" ? (
            <p className="px-3 py-3 font-fira-mono text-[10px] leading-snug text-ink-body/70">
              Editorial category — filters are not listed here yet.
            </p>
          ) : null}
          {active === "artists" ? (
            <div className="w-full shrink-0 p-2">
              <ArtistsDropdownPanel variant="subcolumn" mobilePane />
            </div>
          ) : null}
          {active === "network" ? (
            <div className="w-full shrink-0 p-2">
              <NetworkDropdownPanel variant="subcolumn" mobilePane />
            </div>
          ) : null}
        </div>
      </div>
      <MobileFormatScrollRow />
      <div
        className="flex shrink-0 flex-row items-stretch border-t-hairline border-solid border-ink-primary bg-surface-canvas px-3"
        role="group"
        aria-label="Filter actions"
      >
        <button
          type="button"
          onClick={clearAllFilters}
          className="flex h-11 min-w-0 flex-1 basis-0 items-center justify-center gap-2 pr-3 text-sm transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
        >
          <span
            className={`m-0 size-4 max-h-4 max-w-4 ${FILTER_ACTION_ICON_MASK_BASE} ${
              filterActionsIconActive
                ? filterPillSelection.bg
                : "bg-ink-primary"
            } mask-[url('/svg/delete.svg')] [-webkit-mask-image:url('/svg/delete.svg')]`}
            aria-hidden
          />
          <span className={MOBILE_FILTER_ACTIONS_LABEL_CLASS}>
            Clear Filters
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFiltersPanelOpen(false)}
          className="flex h-11 min-w-0 flex-1 basis-0 items-center justify-center gap-2 border-l-hairline border-solid border-ink-primary pl-3 text-sm transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
        >
          <span className="flex min-w-0 flex-wrap items-baseline justify-center gap-x-1">
            {hasActiveTaxonomyFilters ? (
              <span
                className={`shrink-0 tabular-nums ${filterPillSelection.text}`}
              >
                ({filterMatchingRowCount})
              </span>
            ) : null}
            <span className={`min-w-0 ${MOBILE_FILTER_ACTIONS_LABEL_CLASS}`}>
              Apply Filters
            </span>
          </span>
          <span
            className={`m-0 h-2.5 w-2 max-h-2.5 max-w-2 ${FILTER_ACTION_ICON_MASK_BASE} ${
              filterActionsIconActive
                ? filterPillSelection.bg
                : "bg-ink-primary"
            } mask-[url('/svg/right-arrow.svg')] [-webkit-mask-image:url('/svg/right-arrow.svg')]`}
            aria-hidden
          />
        </button>
      </div>
    </aside>
  );
}
