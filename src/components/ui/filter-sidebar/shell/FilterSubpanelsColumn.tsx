"use client";

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
  networkSubpanelOpen: boolean;
  onCloseBriefings: () => void;
  onCloseRd: () => void;
  onCloseNetwork: () => void;
};

export function FilterSubpanelsColumn({
  anySubpanelOpen,
  briefingsSubpanelOpen,
  rdSubpanelOpen,
  networkSubpanelOpen,
  onCloseBriefings,
  onCloseRd,
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
            mergeBottomBorder={rdSubpanelOpen || networkSubpanelOpen}
            onClose={onCloseBriefings}
          />
        ) : null}
        {rdSubpanelOpen ? (
          <RDProjectsSubpanelColumn
            mergeTopBorder={briefingsSubpanelOpen || networkSubpanelOpen}
            onClose={onCloseRd}
          />
        ) : null}
        {networkSubpanelOpen ? (
          <NetworkSubpanelColumn
            mergeTopBorder={briefingsSubpanelOpen || rdSubpanelOpen}
            onClose={onCloseNetwork}
          />
        ) : null}
      </div>
    </div>
  );
}
