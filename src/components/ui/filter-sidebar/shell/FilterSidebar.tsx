"use client";

import { useCallback, useId, type ReactElement } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { FilterOptionsPanel } from "./FilterOptionsPanel";
import { FilterSubpanelsColumn } from "./FilterSubpanelsColumn";
import { Footer } from "./Footer";
import { HomeBar } from "./HomeBar";
import { MobileFiltersBar } from "./MobileFiltersBar";
import { MobileFiltersCloseHeader } from "./MobileFiltersCloseHeader";
import { MobileLatestUpdatesStrip } from "./MobileLatestUpdatesStrip";
import {
  FILTER_OPTIONS_PANEL_CLIP_TRANSITION_CLASS,
  FILTER_SIDEBAR_COLUMN_CLASS,
  FILTER_SIDEBAR_COLUMN_COLLAPSED_CLASS,
  MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS,
  MOBILE_OVERLAY_TOP_CLASS,
  MOBILE_OVERLAY_X_CLASS,
} from "./layout-classes";
import { SideBar } from "./SideBar";
import { useIsMaxLg } from "./useIsMaxLg";

export function FilterSidebar() {
  const {
    filtersPanelOpen: filtersOpen,
    setFiltersPanelOpen: setFiltersOpen,
    briefingsSubpanelOpen,
    setBriefingsSubpanelOpen,
    rdSubpanelOpen,
    setRdSubpanelOpen,
    fellowshipsSubpanelOpen,
    setFellowshipsSubpanelOpen,
    networkSubpanelOpen,
    setNetworkSubpanelOpen,
    artistsSubpanelOpen,
    setArtistsSubpanelOpen,
    subscribeSubpanelOpen,
    setSubscribeSubpanelOpen,
    hasActiveTaxonomyFilters,
    selectedFaeBriefing,
  } = useFilterSelection();
  const panelId = useId();
  const isMaxLg = useIsMaxLg();

  const anySubpanelOpen =
    briefingsSubpanelOpen ||
    rdSubpanelOpen ||
    fellowshipsSubpanelOpen ||
    artistsSubpanelOpen ||
    networkSubpanelOpen ||
    subscribeSubpanelOpen;

  const toggleFiltersOpen = useCallback(() => {
    setFiltersOpen((open) => {
      const next = !open;
      if (!next) {
        setBriefingsSubpanelOpen(false);
        setRdSubpanelOpen(false);
        setFellowshipsSubpanelOpen(false);
        setArtistsSubpanelOpen(false);
        setNetworkSubpanelOpen(false);
        setSubscribeSubpanelOpen(false);
      }
      return next;
    });
  }, [
    setFiltersOpen,
    setBriefingsSubpanelOpen,
    setRdSubpanelOpen,
    setFellowshipsSubpanelOpen,
    setArtistsSubpanelOpen,
    setNetworkSubpanelOpen,
    setSubscribeSubpanelOpen,
  ]);

  const subpanelsColumn: ReactElement = (
    <FilterSubpanelsColumn
      filtersPanelOpen={filtersOpen}
      anySubpanelOpen={anySubpanelOpen}
      briefingsSubpanelOpen={briefingsSubpanelOpen}
      rdSubpanelOpen={rdSubpanelOpen}
      fellowshipsSubpanelOpen={fellowshipsSubpanelOpen}
      artistsSubpanelOpen={artistsSubpanelOpen}
      networkSubpanelOpen={networkSubpanelOpen}
      subscribeSubpanelOpen={subscribeSubpanelOpen}
      onCloseBriefings={() => setBriefingsSubpanelOpen(false)}
      onCloseRd={() => setRdSubpanelOpen(false)}
      onCloseFellowships={() => setFellowshipsSubpanelOpen(false)}
      onCloseArtists={() => setArtistsSubpanelOpen(false)}
      onCloseNetwork={() => setNetworkSubpanelOpen(false)}
      onCloseSubscribe={() => setSubscribeSubpanelOpen(false)}
    />
  );

  const showOptionsPanel = !isMaxLg || filtersOpen;

  return (
    <>
    <div className="relative z-40 flex h-screen min-h-0 w-auto min-w-0 shrink-0 flex-row items-stretch overflow-visible">
      <div
        className={`z-50 flex h-full min-h-0 flex-col items-stretch self-stretch overflow-visible ${
          filtersOpen
            ? FILTER_SIDEBAR_COLUMN_CLASS
            : FILTER_SIDEBAR_COLUMN_COLLAPSED_CLASS
        } ${
          filtersOpen
            ? /** `h-full` + `fixed` + `top`/`bottom` makes browsers ignore `bottom` (full viewport). */
              `max-lg:fixed max-lg:z-50 max-lg:h-auto max-lg:min-h-0 max-lg:w-full max-lg:min-w-0 max-lg:max-w-none max-lg:shrink-0 max-lg:transition-none ${MOBILE_OVERLAY_TOP_CLASS} ${MOBILE_OVERLAY_BOTTOM_ABOVE_FOOTER_CLASS} ${MOBILE_OVERLAY_X_CLASS}`
            : "max-lg:hidden"
        }`}
      >
        {isMaxLg && filtersOpen ? (
          <MobileFiltersCloseHeader onClose={toggleFiltersOpen} />
        ) : null}
        <HomeBar
          className={`max-lg:hidden ${FILTER_SIDEBAR_COLUMN_CLASS}`}
          mergeWithSubpanel={anySubpanelOpen}
        />
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden transition-colors duration-500 ease-in-out motion-reduce:transition-none ${
            filtersOpen ? "bg-surface-canvas" : "bg-transparent"
          }`}
        >
          <div className="hidden h-full min-h-0 shrink-0 lg:block">
            <SideBar
              filtersOpen={filtersOpen}
              onToggleFilters={toggleFiltersOpen}
              filterPanelId={panelId}
            />
          </div>
          <div
            className={`h-full min-h-0 shrink-0 overflow-hidden ${FILTER_OPTIONS_PANEL_CLIP_TRANSITION_CLASS} max-lg:min-w-0 ${
              filtersOpen
                ? "w-filter-options max-lg:w-full max-lg:flex-1 opacity-100"
                : "pointer-events-none w-0 max-lg:w-0 opacity-0"
            }`}
          >
            <div className="h-full min-h-0 w-filter-options max-lg:w-full min-w-0 overflow-hidden">
              {showOptionsPanel ? (
                <FilterOptionsPanel
                  panelId={panelId}
                  briefingsSubpanelOpen={briefingsSubpanelOpen}
                  rdSubpanelOpen={rdSubpanelOpen}
                  fellowshipsSubpanelOpen={fellowshipsSubpanelOpen}
                  artistsSubpanelOpen={artistsSubpanelOpen}
                  networkSubpanelOpen={networkSubpanelOpen}
                  subscribeSubpanelOpen={subscribeSubpanelOpen}
                  onToggleArtistsSubpanel={() =>
                    setArtistsSubpanelOpen((o) => !o)
                  }
                  onToggleNetworkSubpanel={() =>
                    setNetworkSubpanelOpen((o) => !o)
                  }
                  onToggleSubscribeSubpanel={() =>
                    setSubscribeSubpanelOpen((o) => !o)
                  }
                />
              ) : null}
            </div>
          </div>
          <div className="min-h-0 min-w-0 flex-1 max-lg:hidden" aria-hidden />
        </div>
        <Footer
          className={`max-lg:hidden ${FILTER_SIDEBAR_COLUMN_CLASS}`}
          mergeWithSubpanel={anySubpanelOpen}
        />
      </div>
      <div className="contents max-lg:hidden">{subpanelsColumn}</div>
      <div className="contents lg:hidden">
        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
          {filtersOpen ||
          hasActiveTaxonomyFilters ||
          selectedFaeBriefing != null ? null : (
            <MobileLatestUpdatesStrip />
          )}
          <div className="flex w-full shrink-0 flex-col bg-surface-canvas">
            {filtersOpen ? null : (
              <MobileFiltersBar onOpen={toggleFiltersOpen} />
            )}
            <Footer showYear={false} mergeWithSubpanel={false} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
