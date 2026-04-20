"use client";

import { useCallback, useId } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { FilterOptionsPanel } from "./FilterOptionsPanel";
import { FilterSubpanelsColumn } from "./FilterSubpanelsColumn";
import { Footer } from "./Footer";
import { HomeBar } from "./HomeBar";
import { FILTER_SIDEBAR_COLUMN_CLASS } from "./layout-classes";
import { SideBar } from "./SideBar";

export function FilterSidebar() {
  const {
    filtersPanelOpen: filtersOpen,
    setFiltersPanelOpen: setFiltersOpen,
    briefingsSubpanelOpen,
    setBriefingsSubpanelOpen,
    rdSubpanelOpen,
    setRdSubpanelOpen,
    networkSubpanelOpen,
    setNetworkSubpanelOpen,
    artistsSubpanelOpen,
    setArtistsSubpanelOpen,
  } = useFilterSelection();
  const panelId = useId();

  const anySubpanelOpen =
    briefingsSubpanelOpen ||
    rdSubpanelOpen ||
    artistsSubpanelOpen ||
    networkSubpanelOpen;

  const toggleFiltersOpen = useCallback(() => {
    setFiltersOpen((open) => {
      const next = !open;
      if (!next) {
        setBriefingsSubpanelOpen(false);
        setRdSubpanelOpen(false);
        setArtistsSubpanelOpen(false);
        setNetworkSubpanelOpen(false);
      }
      return next;
    });
  }, [
    setFiltersOpen,
    setBriefingsSubpanelOpen,
    setRdSubpanelOpen,
    setArtistsSubpanelOpen,
    setNetworkSubpanelOpen,
  ]);

  return (
    <div className="flex h-screen min-h-0 shrink-0 overflow-hidden z-50 w-auto min-w-0">
      <div
        className={`z-50 flex h-full min-h-0 flex-col items-stretch self-stretch overflow-hidden ${FILTER_SIDEBAR_COLUMN_CLASS}`}
      >
        <HomeBar mergeWithSubpanel={anySubpanelOpen} />
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden ${
            filtersOpen ? "bg-surface-canvas" : "bg-transparent"
          }`}
        >
          <SideBar
            filtersOpen={filtersOpen}
            onToggleFilters={toggleFiltersOpen}
            filterPanelId={panelId}
          />
          {filtersOpen ? (
            <FilterOptionsPanel
              panelId={panelId}
              briefingsSubpanelOpen={briefingsSubpanelOpen}
              rdSubpanelOpen={rdSubpanelOpen}
              artistsSubpanelOpen={artistsSubpanelOpen}
              networkSubpanelOpen={networkSubpanelOpen}
              onToggleBriefingsSubpanel={() =>
                setBriefingsSubpanelOpen((o) => !o)
              }
              onToggleRdSubpanel={() => setRdSubpanelOpen((o) => !o)}
              onToggleArtistsSubpanel={() =>
                setArtistsSubpanelOpen((o) => !o)
              }
              onToggleNetworkSubpanel={() =>
                setNetworkSubpanelOpen((o) => !o)
              }
            />
          ) : null}
        </div>
        <Footer mergeWithSubpanel={anySubpanelOpen} />
      </div>
      {filtersOpen ? (
        <FilterSubpanelsColumn
          anySubpanelOpen={anySubpanelOpen}
          briefingsSubpanelOpen={briefingsSubpanelOpen}
          rdSubpanelOpen={rdSubpanelOpen}
          artistsSubpanelOpen={artistsSubpanelOpen}
          networkSubpanelOpen={networkSubpanelOpen}
          onCloseBriefings={() => setBriefingsSubpanelOpen(false)}
          onCloseRd={() => setRdSubpanelOpen(false)}
          onCloseArtists={() => setArtistsSubpanelOpen(false)}
          onCloseNetwork={() => setNetworkSubpanelOpen(false)}
        />
      ) : null}
    </div>
  );
}
