"use client";

import { useState } from "react";
import { ActivityType } from "../sections/ActivityType";
import { ArtistsMenu } from "../sections/ArtistsMenu";
import { EditorialMenu } from "../sections/EditorialMenu";
import { FAEBriefingsMenu } from "../sections/FAEBriefingsMenu";
import { FellowshipsMenu } from "../sections/FellowshipsMenu";
import { FocusAreas } from "../sections/FocusAreas";
import { Format } from "../sections/Format";
import { NetworkMenu } from "../sections/NetworkMenu";
import { RDProjectsMenu } from "../sections/RDProjectsMenu";
import { Search } from "../sections/Search";
type FilterOptionsPanelProps = {
  panelId: string;
  briefingsSubpanelOpen: boolean;
  rdSubpanelOpen: boolean;
  artistsSubpanelOpen: boolean;
  networkSubpanelOpen: boolean;
  onToggleBriefingsSubpanel: () => void;
  onToggleRdSubpanel: () => void;
  onToggleArtistsSubpanel: () => void;
  onToggleNetworkSubpanel: () => void;
};

export function FilterOptionsPanel({
  panelId,
  briefingsSubpanelOpen,
  rdSubpanelOpen,
  artistsSubpanelOpen,
  networkSubpanelOpen,
  onToggleBriefingsSubpanel,
  onToggleRdSubpanel,
  onToggleArtistsSubpanel,
  onToggleNetworkSubpanel,
}: FilterOptionsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searching = searchQuery.trim().length > 0;

  return (
    <aside
      className="flex h-full min-h-0 w-full min-w-[285px] flex-col overflow-hidden border-r-hairline border-solid border-ink-primary"
      aria-label="Filters"
    >
      <div
        id={panelId}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        role="region"
        aria-label="Filter options"
      >
        <Search value={searchQuery} onChange={setSearchQuery} />
        <div
          className={
            searching
              ? "flex shrink-0 flex-col"
              : "flex min-h-0 flex-1 flex-col overflow-hidden"
          }
        >
          <FocusAreas collapsed={searching} />
          <ActivityType collapsed={searching} />
        </div>
        <div className="shrink-0">
          <Format collapsed={searching} />
        </div>
        <div className="shrink-0">
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
          <ArtistsMenu
            subpanelOpen={artistsSubpanelOpen}
            onToggleSubpanel={onToggleArtistsSubpanel}
          />
          <NetworkMenu
            subpanelOpen={networkSubpanelOpen}
            onToggleSubpanel={onToggleNetworkSubpanel}
          />
        </div>
      </div>
    </aside>
  );
}
