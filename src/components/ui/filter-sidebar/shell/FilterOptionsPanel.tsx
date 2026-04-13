"use client";

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
  networkSubpanelOpen: boolean;
  onToggleBriefingsSubpanel: () => void;
  onToggleRdSubpanel: () => void;
  onToggleNetworkSubpanel: () => void;
};

export function FilterOptionsPanel({
  panelId,
  briefingsSubpanelOpen,
  rdSubpanelOpen,
  networkSubpanelOpen,
  onToggleBriefingsSubpanel,
  onToggleRdSubpanel,
  onToggleNetworkSubpanel,
}: FilterOptionsPanelProps) {
  return (
    <aside
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r-hairline border-solid border-ink-primary"
      aria-label="Filters"
    >
      <div
        id={panelId}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
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
        </div>
      </div>
    </aside>
  );
}
