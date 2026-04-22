"use client";

import { SubpanelCloseBar } from "../../shell/SubpanelCloseBar";
import { NetworkDropdownPanel } from "./NetworkDropdownPanel";

type NetworkSubpanelColumnProps = {
  onClose: () => void;
  onClearAll?: () => void;
  mergeTopBorder?: boolean;
};

export function NetworkSubpanelColumn({
  onClose,
  onClearAll,
  mergeTopBorder,
}: NetworkSubpanelColumnProps) {
  return (
    <div
      className={`flex max-h-[min(40rem,78dvh)] min-h-0 w-full flex-1 flex-col overflow-hidden border-l-0 border-r-hairline border-solid border-ink-primary bg-surface-canvas ${
        mergeTopBorder ? "border-t-0" : "border-t-hairline"
      }`}
      role="complementary"
      aria-label="Network filters"
    >
      <SubpanelCloseBar onClose={onClose} />
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
        <NetworkDropdownPanel variant="subcolumn" onClearAll={onClearAll} />
      </div>
    </div>
  );
}
