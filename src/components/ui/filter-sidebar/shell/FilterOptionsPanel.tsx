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
import { FilterTaxonomyEmptyHint } from "./FilterTaxonomyEmptyHint";
import { MobileFilterOptionsLayout } from "./MobileFilterOptionsLayout";
import { filterChromeRightEdgeClass } from "./layout-classes";
import { isInstallationMode } from "@/lib/installation-mode";
import { useIsMaxLg } from "./useIsMaxLg";

export type FilterOptionsPanelProps = {
  panelId: string;
  briefingsSubpanelOpen: boolean;
  rdSubpanelOpen: boolean;
  fellowshipsSubpanelOpen: boolean;
  artistsSubpanelOpen: boolean;
  networkSubpanelOpen: boolean;
  onToggleArtistsSubpanel: () => void;
  onToggleNetworkSubpanel: () => void;
};

export function FilterOptionsPanel({
  panelId,
  briefingsSubpanelOpen,
  rdSubpanelOpen,
  fellowshipsSubpanelOpen,
  artistsSubpanelOpen,
  networkSubpanelOpen,
  onToggleArtistsSubpanel,
  onToggleNetworkSubpanel,
}: FilterOptionsPanelProps) {
  const isMaxLg = useIsMaxLg();
  const installation = isInstallationMode();
  const { filterSearchQuery, setFilterSearchQuery } = useFilterSelection();
  const searching = filterSearchQuery.trim().length > 0;

  if (isMaxLg) {
    return <MobileFilterOptionsLayout panelId={panelId} />;
  }

  if (installation) {
    return (
      <aside
        className={`flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-solid border-border ${filterChromeRightEdgeClass(false)}`}
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
            <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-4">
              <FilterTaxonomyEmptyHint />
              <FocusAreas collapsed={false} />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const anySubpanelOpen =
    briefingsSubpanelOpen ||
    rdSubpanelOpen ||
    fellowshipsSubpanelOpen ||
    artistsSubpanelOpen ||
    networkSubpanelOpen;

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
          <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div
              className={`flex min-h-full min-w-0 flex-col ${searching ? "" : "pb-4"}`}
            >
              <FilterTaxonomyEmptyHint />
              <div
                className="flex min-w-0 flex-1 flex-col"
                role="radiogroup"
                aria-label="Programme filters"
              >
                <div
                  className={`min-w-0 ${searching ? "shrink-0" : "min-h-10 shrink-0 flex-1"}`}
                >
                  <FellowshipsMenu collapsed={searching} />
                </div>
                <div
                  className={`min-w-0 ${searching ? "shrink-0" : "min-h-10 shrink-0 flex-1"}`}
                >
                  <RDProjectsMenu collapsed={searching} />
                </div>
                <div
                  className={`min-w-0 ${searching ? "shrink-0" : "min-h-10 shrink-0 flex-1"}`}
                >
                  <FAEBriefingsMenu collapsed={searching} />
                </div>
              </div>
              <div className="flex shrink-0 flex-col">
                {searching ? (
                  <>
                    <FocusAreas collapsed />
                    <ActivityType collapsed />
                  </>
                ) : (
                  <>
                    <div className="flex min-w-0 shrink-0 flex-col">
                      <FocusAreas collapsed={false} />
                    </div>
                    <div className="flex min-w-0 shrink-0 flex-col">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
