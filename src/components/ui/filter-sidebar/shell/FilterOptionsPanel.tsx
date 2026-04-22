"use client";

import { useState } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { ActivityType } from "../sections/ActivityType";
import { ArtistsMenu } from "../sections/ArtistsMenu";
import { EditorialMenu } from "../sections/EditorialMenu";
import { FAEBriefingsMenu } from "../sections/FAEBriefingsMenu";
import { LatestUpdatesMenu } from "../sections/LatestUpdatesMenu";
import { FocusAreas } from "../sections/FocusAreas";
import { Format } from "../sections/Format";
import { NetworkMenu } from "../sections/NetworkMenu";
import { RDProjectsMenu } from "../sections/RDProjectsMenu";
import { Search } from "../sections/Search";
import { FilterTaxonomyEmptyHint } from "./FilterTaxonomyEmptyHint";
import { filterChromeRightEdgeClass } from "./layout-classes";
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

function FilterOptionsPanelContent({
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
  const anySubpanelOpen =
    briefingsSubpanelOpen ||
    rdSubpanelOpen ||
    artistsSubpanelOpen ||
    networkSubpanelOpen;

  return (
    <aside
      className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-solid border-ink-primary ${filterChromeRightEdgeClass(anySubpanelOpen)}`}
      aria-label="Filters"
    >
      <div
        id={panelId}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        role="region"
        aria-label="Filter options"
      >
        <Search value={searchQuery} onChange={setSearchQuery} />
        <FilterTaxonomyEmptyHint />
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
          <LatestUpdatesMenu />
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

export function FilterOptionsPanel(props: FilterOptionsPanelProps) {
  const { searchQueryResetNonce } = useFilterSelection();
  return (
    <FilterOptionsPanelContent
      key={searchQueryResetNonce}
      {...props}
    />
  );
}
