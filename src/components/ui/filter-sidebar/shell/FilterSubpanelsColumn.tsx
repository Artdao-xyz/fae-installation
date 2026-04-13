"use client";

import { BriefingsSubpanelColumn } from "../domains/briefings/BriefingsSubpanelColumn";
import { RDProjectsSubpanelColumn } from "../domains/rd-projects/RDProjectsSubpanelColumn";
import {
  FILTER_SIDEBAR_COLUMN_CLASS,
  SUBPANEL_COLUMN_COLLAPSED_CLASS,
} from "./layout-classes";

type FilterSubpanelsColumnProps = {
  anySubpanelOpen: boolean;
  briefingsSubpanelOpen: boolean;
  rdSubpanelOpen: boolean;
  onCloseBriefings: () => void;
  onCloseRd: () => void;
};

export function FilterSubpanelsColumn({
  anySubpanelOpen,
  briefingsSubpanelOpen,
  rdSubpanelOpen,
  onCloseBriefings,
  onCloseRd,
}: FilterSubpanelsColumnProps) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${
        anySubpanelOpen ? FILTER_SIDEBAR_COLUMN_CLASS : SUBPANEL_COLUMN_COLLAPSED_CLASS
      }`}
      aria-hidden={!anySubpanelOpen}
    >
      <div className="scrollbar-hide flex min-h-0 w-full max-h-full flex-1 flex-col justify-end overflow-y-auto">
        {briefingsSubpanelOpen ? (
          <BriefingsSubpanelColumn
            mergeBottomBorder={rdSubpanelOpen}
            onClose={onCloseBriefings}
          />
        ) : null}
        {rdSubpanelOpen ? (
          <RDProjectsSubpanelColumn
            mergeTopBorder={briefingsSubpanelOpen}
            onClose={onCloseRd}
          />
        ) : null}
      </div>
    </div>
  );
}
