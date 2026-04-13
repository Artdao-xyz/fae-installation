"use client";

import { SubpanelCloseBar } from "../../shell/SubpanelCloseBar";
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
      className={`flex max-h-full w-full shrink-0 flex-col overflow-hidden border-l-0 border-r-hairline border-t-hairline border-solid border-ink-primary bg-surface-canvas ${
        mergeBottomBorder ? "border-t-0" : "border-t-hairline"
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
