"use client";

import { ArtistsSubpanelColumn } from "../domains/artists/ArtistsSubpanelColumn";
import { BriefingsSubpanelColumn } from "../domains/briefings/BriefingsSubpanelColumn";
import { NetworkSubpanelColumn } from "../domains/network/NetworkSubpanelColumn";
import { RDProjectsSubpanelColumn } from "../domains/rd-projects/RDProjectsSubpanelColumn";
import {
  FILTER_SUBPANELS_COLUMN_EXPANDED_CLASS,
  SUBPANEL_COLUMN_COLLAPSED_CLASS,
} from "./layout-classes";

type FilterSubpanelsColumnProps = {
  anySubpanelOpen: boolean;
  briefingsSubpanelOpen: boolean;
  rdSubpanelOpen: boolean;
  artistsSubpanelOpen: boolean;
  networkSubpanelOpen: boolean;
  onCloseBriefings: () => void;
  onCloseRd: () => void;
  onCloseArtists: () => void;
  onCloseNetwork: () => void;
};

export function FilterSubpanelsColumn({
  anySubpanelOpen,
  briefingsSubpanelOpen,
  rdSubpanelOpen,
  artistsSubpanelOpen,
  networkSubpanelOpen,
  onCloseBriefings,
  onCloseRd,
  onCloseArtists,
  onCloseNetwork,
}: FilterSubpanelsColumnProps) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${
        anySubpanelOpen
          ? FILTER_SUBPANELS_COLUMN_EXPANDED_CLASS
          : SUBPANEL_COLUMN_COLLAPSED_CLASS
      }`}
      aria-hidden={!anySubpanelOpen}
    >
      <div className="scrollbar-hide flex min-h-0 w-full max-h-full flex-1 flex-col justify-end overflow-x-hidden overflow-y-auto">
        {briefingsSubpanelOpen ? (
          <BriefingsSubpanelColumn
            mergeBottomBorder={
              rdSubpanelOpen || artistsSubpanelOpen || networkSubpanelOpen
            }
            onClose={onCloseBriefings}
          />
        ) : null}
        {rdSubpanelOpen ? (
          <RDProjectsSubpanelColumn
            mergeTopBorder={
              briefingsSubpanelOpen ||
              artistsSubpanelOpen ||
              networkSubpanelOpen
            }
            onClose={onCloseRd}
          />
        ) : null}
        {artistsSubpanelOpen ? (
          <ArtistsSubpanelColumn
            mergeTopBorder={briefingsSubpanelOpen || rdSubpanelOpen}
            onClose={onCloseArtists}
          />
        ) : null}
        {networkSubpanelOpen ? (
          <NetworkSubpanelColumn
            mergeTopBorder={
              briefingsSubpanelOpen || rdSubpanelOpen || artistsSubpanelOpen
            }
            onClose={onCloseNetwork}
          />
        ) : null}
      </div>
    </div>
  );
}
