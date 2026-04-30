"use client";

import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { ActivityType } from "../sections/ActivityType";
import { ArtistsMenu } from "../sections/ArtistsMenu";
import { FAEBriefingsMenu } from "../sections/FAEBriefingsMenu";
import { FellowshipsMenu } from "../sections/FellowshipsMenu";
import { FocusAreas } from "../sections/FocusAreas";
import { Format } from "../sections/Format";
import { NetworkMenu } from "../sections/NetworkMenu";
import { RDProjectsMenu } from "../sections/RDProjectsMenu";
import { Search } from "../sections/Search";
import { SubscribeMenu } from "../sections/SubscribeMenu";
import { FilterTaxonomyEmptyHint } from "./FilterTaxonomyEmptyHint";
import { MobileFilterOptionsLayout } from "./MobileFilterOptionsLayout";
import { filterChromeRightEdgeClass } from "./layout-classes";
import { useIsMaxLg } from "./useIsMaxLg";

export type FilterOptionsPanelProps = {
  panelId: string;
  briefingsSubpanelOpen: boolean;
  rdSubpanelOpen: boolean;
  fellowshipsSubpanelOpen: boolean;
  artistsSubpanelOpen: boolean;
  networkSubpanelOpen: boolean;
  subscribeSubpanelOpen: boolean;
  onToggleArtistsSubpanel: () => void;
  onToggleNetworkSubpanel: () => void;
  onToggleSubscribeSubpanel: () => void;
};

export function FilterOptionsPanel({
  panelId,
  briefingsSubpanelOpen,
  rdSubpanelOpen,
  fellowshipsSubpanelOpen,
  artistsSubpanelOpen,
  networkSubpanelOpen,
  subscribeSubpanelOpen,
  onToggleArtistsSubpanel,
  onToggleNetworkSubpanel,
  onToggleSubscribeSubpanel,
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
    fellowshipsSubpanelOpen ||
    artistsSubpanelOpen ||
    networkSubpanelOpen ||
    subscribeSubpanelOpen;

  return (
    <aside
      className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-solid border-border ${filterChromeRightEdgeClass(anySubpanelOpen)}`}
      aria-label="Filters"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          id={panelId}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          role="region"
          aria-label="Filter options"
        >
          <div
            className={
              searching
                ? "hidden min-h-0 min-w-0 flex-1 flex-col lg:flex"
                : "hidden min-w-0 shrink-0 flex-col lg:flex"
            }
          >
            <Search
              value={filterSearchQuery}
              onChange={setFilterSearchQuery}
              fieldId="filter-search-sidebar"
            />
          </div>
          <FilterTaxonomyEmptyHint />
          <div
            className={`flex shrink-0 flex-col ${searching ? "" : "pb-4"}`}
            role="radiogroup"
            aria-label="Programme filters"
          >
            <FellowshipsMenu collapsed={searching} />
            <RDProjectsMenu collapsed={searching} />
            <FAEBriefingsMenu collapsed={searching} />
          </div>
          <div
            className={
              searching
                ? "flex shrink-0 flex-col"
                : "flex min-h-0 flex-1 flex-col overflow-hidden"
            }
          >
            {searching ? (
              <>
                <FocusAreas collapsed />
                <ActivityType collapsed />
              </>
            ) : (
              <>
                <div className="flex min-h-0 min-w-0 flex-2 flex-col overflow-hidden">
                  <FocusAreas collapsed={false} />
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <ActivityType collapsed={false} />
                </div>
              </>
            )}
          </div>
          <div className="shrink-0">
            <Format collapsed={searching} />
          </div>
          <div className="shrink-0">
            <ArtistsMenu
              subpanelOpen={artistsSubpanelOpen}
              onToggleSubpanel={onToggleArtistsSubpanel}
            />
            <NetworkMenu
              subpanelOpen={networkSubpanelOpen}
              onToggleSubpanel={onToggleNetworkSubpanel}
            />
            <SubscribeMenu
              subpanelOpen={subscribeSubpanelOpen}
              onToggleSubpanel={onToggleSubscribeSubpanel}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
