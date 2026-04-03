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

  return (
    <div
      className={`flex h-screen shrink-0 overflow-hidden transition-[width] duration-200 ease-out ${
        !filtersOpen
          ? "w-[30px]"
          : anySubpanelOpen
            ? "w-[640px]"
            : "w-[320px]"
      }`}
    >
      <aside
        className={`flex h-full shrink-0 flex-col overflow-hidden border-r-[0.5px] border-solid border-text-primary bg-white-fae transition-[width] duration-200 ease-out ${
          filtersOpen ? "w-[320px]" : "w-[30px]"
        } ${filtersOpen && anySubpanelOpen ? "border-r-0" : ""}`}
        aria-label="Filters and navigation"
      >
        {filtersOpen ? <HomeBar /> : null}
        <div
          className={`grid min-h-0 min-w-0 flex-1 overflow-hidden ${
            filtersOpen
              ? "grid-cols-[30px_minmax(0,1fr)]"
              : "grid-cols-[30px]"
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
              className="min-h-0 overflow-y-auto"
              role="region"
              aria-label="Filter options"
            >
              <Search />
              <FocusAreas />
              <ActivityType />
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
          ) : null}
        </div>
        {filtersOpen ? <Footer /> : null}
      </aside>
      {filtersOpen ? (
        <div
          className={`flex h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out ${
            anySubpanelOpen ? "w-[320px] min-w-[320px]" : "w-0 min-w-0"
          }`}
          aria-hidden={!anySubpanelOpen}
        >
          <div className="flex min-h-0 w-full max-h-full flex-1 flex-col justify-end overflow-y-auto">
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
