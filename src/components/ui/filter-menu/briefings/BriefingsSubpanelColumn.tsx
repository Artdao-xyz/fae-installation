"use client";

import { SubpanelCloseBar } from "../SubpanelCloseBar";
import { BriefingsDropdownPanel } from "./BriefingsDropdownPanel";

type BriefingsSubpanelColumnProps = {
  onClose: () => void;
  onClearAll?: () => void;
  mergeBottomBorder?: boolean;
};

export function BriefingsSubpanelColumn({
  onClose,
  onClearAll,
  mergeBottomBorder,
}: BriefingsSubpanelColumnProps) {
  return (
    <div
      className={`flex max-h-full w-full shrink-0 flex-col overflow-hidden border-l-[0.5px] border-r-[0.5px] border-t-[0.5px] border-solid border-text-primary bg-white-fae ${
        mergeBottomBorder ? "border-t-0" : "border-t-[0.5px]"
      }`}
      role="complementary"
      aria-label="FAE Briefings filters"
    >
      <SubpanelCloseBar onClose={onClose} />
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
        <BriefingsDropdownPanel variant="subcolumn" onClearAll={onClearAll} />
      </div>
    </div>
  );
}
