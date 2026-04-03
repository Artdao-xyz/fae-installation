"use client";

import { useEffect, useId, useState } from "react";
import { ActivityType } from "./ActivityType";
import { ArtistsMenu } from "./ArtistsMenu";
import { BriefingsSubpanelColumn } from "./briefings/BriefingsSubpanelColumn";
import { EditorialMenu } from "./EditorialMenu";
import { FAEBriefingsMenu } from "./FAEBriefingsMenu";
import { FellowshipsMenu } from "./FellowshipsMenu";
import { FocusAreas } from "./FocusAreas";
import { Footer } from "./Footer";
import { Format } from "./Format";
import { HomeBar } from "./HomeBar";
import { NetworkMenu } from "./NetworkMenu";
import { RDProjectsSubpanelColumn } from "./rd-projects/RDProjectsSubpanelColumn";
import { RDProjectsMenu } from "./RDProjectsMenu";
import { Search } from "./Search";
import { SideBar } from "./SideBar";

export function FilterMenu() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [briefingsSubpanelOpen, setBriefingsSubpanelOpen] = useState(false);
  const [rdSubpanelOpen, setRdSubpanelOpen] = useState(false);
  const panelId = useId();

  const anySubpanelOpen = briefingsSubpanelOpen || rdSubpanelOpen;

  useEffect(() => {
    if (!filtersOpen) {
      setBriefingsSubpanelOpen(false);
      setRdSubpanelOpen(false);
    }
  }, [filtersOpen]);

  const columnWidth =
    "w-[18vw] min-w-[320px] max-w-[18vw] shrink-0 transition-[width] duration-200 ease-out";

  return (
    <div
      className={`flex h-screen shrink-0 overflow-hidden ${
        filtersOpen ? "w-auto min-w-0" : "w-[35px]"
      }`}
    >
      <aside
        className={`z-50 flex h-full flex-col overflow-hidden border-r-[0.5px] border-solid border-text-primary bg-white-fae ${
          filtersOpen ? columnWidth : "w-[35px] shrink-0"
        } ${filtersOpen && anySubpanelOpen ? "border-r-0" : ""}`}
        aria-label="Filters and navigation"
      >
        {filtersOpen ? <HomeBar /> : null}
        <div
          className={`grid min-h-0 min-w-0 flex-1 overflow-hidden ${
            filtersOpen
              ? "grid-cols-[35px_minmax(0,1fr)]"
              : "grid-cols-[35px]"
          }`}
        >
          <SideBar
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen((o) => !o)}
            filterPanelId={panelId}
          />
          {filtersOpen ? (
            <div
              id={panelId}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
              role="region"
              aria-label="Filter options"
            >
              <Search />
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <FocusAreas />
                <ActivityType />
              </div>
              <div className="shrink-0">
                <Format />
                <FAEBriefingsMenu
                  subpanelOpen={briefingsSubpanelOpen}
                  onToggleSubpanel={() => setBriefingsSubpanelOpen((o) => !o)}
                />
                <FellowshipsMenu />
                <RDProjectsMenu
                  subpanelOpen={rdSubpanelOpen}
                  onToggleSubpanel={() => setRdSubpanelOpen((o) => !o)}
                />
                <EditorialMenu />
                <ArtistsMenu />
                <NetworkMenu />
              </div>
            </div>
          ) : null}
        </div>
        {filtersOpen ? <Footer /> : null}
      </aside>
      {filtersOpen ? (
        <div
          className={`flex h-full min-h-0 flex-col overflow-hidden ${
            anySubpanelOpen ? columnWidth : "w-0 min-w-0 max-w-0 shrink-0 overflow-hidden"
          }`}
          aria-hidden={!anySubpanelOpen}
        >
          <div className="scrollbar-hide flex min-h-0 w-full max-h-full flex-1 flex-col justify-end overflow-y-auto">
            {briefingsSubpanelOpen ? (
              <BriefingsSubpanelColumn
                mergeBottomBorder={rdSubpanelOpen}
                onClose={() => setBriefingsSubpanelOpen(false)}
              />
            ) : null}
            {rdSubpanelOpen ? (
              <RDProjectsSubpanelColumn
                mergeTopBorder={briefingsSubpanelOpen}
                onClose={() => setRdSubpanelOpen(false)}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
