"use client";

import { SubpanelCloseBar } from "../../shell/SubpanelCloseBar";
import { ARTISTS_NETWORK_SUBPANEL_SCROLL_BODY_CLASS } from "../../shell/layout-classes";
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
      className={`flex w-full flex-none flex-col overflow-hidden border-l-0 border-r-hairline border-solid border-ink-primary bg-surface-canvas ${
        mergeTopBorder ? "border-t-0" : "border-t-hairline"
      }`}
      role="complementary"
      aria-label="Network filters"
    >
      <SubpanelCloseBar onClose={onClose} showTopBorder={false} />
      <div className={ARTISTS_NETWORK_SUBPANEL_SCROLL_BODY_CLASS}>
        <NetworkDropdownPanel variant="subcolumn" onClearAll={onClearAll} />
      </div>
    </div>
  );
}
