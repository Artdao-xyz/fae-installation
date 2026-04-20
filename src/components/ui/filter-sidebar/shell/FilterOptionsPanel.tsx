"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { useFilterSelection } from "../FilterSelectionContext";
import { ActivityType } from "../sections/ActivityType";
import { ArtistsMenu } from "../sections/ArtistsMenu";
import { EditorialMenu } from "../sections/EditorialMenu";
import { FAEBriefingsMenu } from "../sections/FAEBriefingsMenu";
import { FellowshipsMenu } from "../sections/FellowshipsMenu";
import { FocusAreas } from "../sections/FocusAreas";
import { Format } from "../sections/Format";
import { NetworkMenu } from "../sections/NetworkMenu";
import { RDProjectsMenu } from "../sections/RDProjectsMenu";
import { FilterSidebarRailRow } from "../primitives/FilterSidebarRailRow";
import { Search } from "../sections/Search";

type FilterOptionsPanelProps = {
  panelId: string;
  briefingsSubpanelOpen: boolean;
  rdSubpanelOpen: boolean;
  networkSubpanelOpen: boolean;
  onToggleBriefingsSubpanel: () => void;
  onToggleRdSubpanel: () => void;
  onToggleNetworkSubpanel: () => void;
  onCloseBriefings: () => void;
  onCloseRd: () => void;
  onCloseNetwork: () => void;
  /** Below `lg`, rendered to the right when a domain subpanel is open (or focus/activity/format body). */
  mobileSubpanelsColumn?: ReactNode;
};

type MobilePrimary = "focus" | "activity" | "format";

export function FilterOptionsPanel({
  panelId,
  briefingsSubpanelOpen,
  rdSubpanelOpen,
  networkSubpanelOpen,
  onToggleBriefingsSubpanel,
  onToggleRdSubpanel,
  onToggleNetworkSubpanel,
  onCloseBriefings,
  onCloseRd,
  onCloseNetwork,
  mobileSubpanelsColumn,
}: FilterOptionsPanelProps) {
  const { filterSearchQuery, setFilterSearchQuery } = useFilterSelection();
  const searching = filterSearchQuery.trim().length > 0;

  const domainOpen =
    briefingsSubpanelOpen || rdSubpanelOpen || networkSubpanelOpen;

  /** Accordion (not radio): one section’s pills visible at a time; tap active row again to collapse. */
  const [mobilePrimary, setMobilePrimary] = useState<MobilePrimary | null>("focus");

  const toggleMobileRail = useCallback(
    (next: MobilePrimary) => {
      setMobilePrimary((prev) => (prev === next ? null : next));
      onCloseBriefings();
      onCloseRd();
      onCloseNetwork();
    },
    [onCloseBriefings, onCloseRd, onCloseNetwork],
  );

  const categoryMenus = (
    <>
      <FAEBriefingsMenu
        subpanelOpen={briefingsSubpanelOpen}
        onToggleSubpanel={onToggleBriefingsSubpanel}
      />
      <FellowshipsMenu />
      <RDProjectsMenu
        subpanelOpen={rdSubpanelOpen}
        onToggleSubpanel={onToggleRdSubpanel}
      />
      <EditorialMenu />
      <ArtistsMenu />
      <NetworkMenu
        subpanelOpen={networkSubpanelOpen}
        onToggleSubpanel={onToggleNetworkSubpanel}
      />
    </>
  );

  const railExpanded = (which: MobilePrimary) =>
    mobilePrimary === which && !domainOpen;

  const mobileRightColumn =
    domainOpen && mobileSubpanelsColumn != null ? (
      mobileSubpanelsColumn
    ) : mobilePrimary === null ? null : mobilePrimary === "focus" ? (
      <FocusAreas collapsed={searching} />
    ) : mobilePrimary === "activity" ? (
      <ActivityType collapsed={searching} />
    ) : (
      <Format collapsed={searching} />
    );

  const mobileRailPanelId = `${panelId}-mobile-rail-panel`;

  return (
    <aside
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r-hairline border-solid border-ink-primary max-lg:min-h-0"
      aria-label="Filters"
    >
      {/* Search lives on the landing `main` below `lg`; sidebar only from `lg`. */}
      <div
        className={[
          "hidden min-w-0 w-full bg-surface-canvas lg:relative lg:z-auto lg:flex lg:flex-col",
          searching
            ? "lg:min-h-0 lg:min-w-0 lg:flex-1 lg:overflow-hidden"
            : "lg:shrink-0",
        ].join(" ")}
      >
        <Search
          value={filterSearchQuery}
          onChange={setFilterSearchQuery}
          fieldId="filter-search-sidebar"
        />
      </div>

      <div
        id={panelId}
        className={`flex min-h-0 min-w-0 flex-col overflow-hidden ${
          searching ? "min-h-0 shrink-0" : "min-h-0 flex-1"
        }`}
        role="region"
        aria-label="Filter options"
      >
        <div
          className={`hidden lg:flex ${
            searching
              ? "shrink-0 flex-col"
              : "min-h-0 flex-1 flex-col overflow-hidden"
          }`}
        >
          <FocusAreas collapsed={searching} />
          <ActivityType collapsed={searching} />
        </div>
        <div className="hidden shrink-0 lg:block">
          <Format collapsed={searching} />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-none lg:shrink-0 lg:overflow-visible">
          <div className="flex min-h-0 min-w-0 flex-1 flex-row max-lg:h-full max-lg:min-h-0 max-lg:items-stretch max-lg:justify-start max-lg:overflow-hidden lg:flex-none lg:flex-col lg:overflow-visible">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-start overflow-hidden overflow-x-hidden max-lg:h-full max-lg:min-h-0 max-lg:w-[140px] max-lg:min-w-[140px] max-lg:max-w-[140px] lg:w-full lg:max-w-none lg:flex-none">
              {/*
                Mobile: 9-row grid — first 3 rows (Focus / Activity / Format) use more height (2fr each)
                than the 6 domain rows (1fr each); icon+label stacked in every cell; no scroll here.
              */}
              <div className="grid min-h-0 w-full flex-1 basis-0 grid-rows-[repeat(3,minmax(0,2fr))_repeat(6,minmax(0,1fr))] items-stretch overflow-hidden lg:hidden">
                <div className="min-h-0 overflow-hidden">
                  <FilterSidebarRailRow
                    growToFill
                    label="Focus Areas / Themes"
                    tone="fae-briefings"
                    expanded={railExpanded("focus")}
                    controlsId={mobileRailPanelId}
                    onClick={() => toggleMobileRail("focus")}
                  />
                </div>
                <div className="min-h-0 overflow-hidden">
                  <FilterSidebarRailRow
                    growToFill
                    label="Activity Type"
                    tone="fellowships"
                    expanded={railExpanded("activity")}
                    controlsId={mobileRailPanelId}
                    onClick={() => toggleMobileRail("activity")}
                  />
                </div>
                <div className="min-h-0 overflow-hidden">
                  <FilterSidebarRailRow
                    growToFill
                    label="Format"
                    tone="editorial"
                    expanded={railExpanded("format")}
                    controlsId={mobileRailPanelId}
                    onClick={() => toggleMobileRail("format")}
                  />
                </div>
                <div className="min-h-0 overflow-hidden">
                  <FAEBriefingsMenu
                    subpanelOpen={briefingsSubpanelOpen}
                    onToggleSubpanel={onToggleBriefingsSubpanel}
                    mobileFillCell
                  />
                </div>
                <div className="min-h-0 overflow-hidden">
                  <FellowshipsMenu mobileFillCell />
                </div>
                <div className="min-h-0 overflow-hidden">
                  <RDProjectsMenu
                    subpanelOpen={rdSubpanelOpen}
                    onToggleSubpanel={onToggleRdSubpanel}
                    mobileFillCell
                  />
                </div>
                <div className="min-h-0 overflow-hidden">
                  <EditorialMenu mobileFillCell />
                </div>
                <div className="min-h-0 overflow-hidden">
                  <ArtistsMenu mobileFillCell />
                </div>
                <div className="min-h-0 overflow-hidden">
                  <NetworkMenu
                    subpanelOpen={networkSubpanelOpen}
                    onToggleSubpanel={onToggleNetworkSubpanel}
                    mobileFillCell
                  />
                </div>
              </div>
              {/* Desktop: full category stack (mobile rail hidden); not fixed 1/9 cells */}
              <div className="hidden min-h-0 w-full flex-col lg:flex">{categoryMenus}</div>
            </div>
            <div
              id={mobileRailPanelId}
              className="hidden min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden max-lg:flex max-lg:justify-start lg:hidden"
              role="region"
              aria-label="Focus, activity, and format filters"
            >
              {mobileRightColumn}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
