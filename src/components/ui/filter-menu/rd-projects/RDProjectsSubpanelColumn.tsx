"use client";

import { SubpanelCloseBar } from "../SubpanelCloseBar";
import { RDProjectsDropdownPanel } from "./RDProjectsDropdownPanel";

type RDProjectsSubpanelColumnProps = {
  onClose: () => void;
  onClearAll?: () => void;
  mergeTopBorder?: boolean;
};

export function RDProjectsSubpanelColumn({
  onClose,
  onClearAll,
  mergeTopBorder,
}: RDProjectsSubpanelColumnProps) {
  return (
    <div
      className={`flex max-h-full w-full shrink-0 flex-col overflow-hidden border-l-[0.5px] border-r-[0.5px] border-t-[0.5px] border-solid border-text-primary bg-white-fae ${
        mergeTopBorder ? "border-t-0" : "border-t-[0.5px]"
      }`}
      role="complementary"
      aria-label="R&D Projects filters"
    >
      <SubpanelCloseBar onClose={onClose} />
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
        <RDProjectsDropdownPanel variant="subcolumn" onClearAll={onClearAll} />
      </div>
    </div>
  );
}
