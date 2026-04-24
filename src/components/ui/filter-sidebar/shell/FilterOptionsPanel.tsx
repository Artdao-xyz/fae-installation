"use client";

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
import { MobileFilterOptionsLayout } from "./MobileFilterOptionsLayout";
import { filterChromeRightEdgeClass } from "./layout-classes";
import { useIsMaxLg } from "./useIsMaxLg";

export type FilterOptionsPanelProps = {
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
  const isMaxLg = useIsMaxLg();
  const { filterSearchQuery, setFilterSearchQuery } = useFilterSelection();
  const searching = filterSearchQuery.trim().length > 0;

  if (isMaxLg) {
    return <MobileFilterOptionsLayout panelId={panelId} />;
  }

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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          id={panelId}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          role="region"
          aria-label="Filter options"
        >
          <div className="hidden min-w-0 shrink-0 flex-col lg:flex">
            <Search
              value={filterSearchQuery}
              onChange={setFilterSearchQuery}
              fieldId="filter-search-sidebar"
            />
          </div>
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
      </div>
    </aside>
  );
}
