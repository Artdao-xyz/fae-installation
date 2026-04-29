"use client";

import { SubpanelCloseBar } from "../../shell/SubpanelCloseBar";
import { FellowshipsDropdownPanel } from "./FellowshipsDropdownPanel";

type FellowshipsSubpanelColumnProps = {
  onClose: () => void;
  onClearAll?: () => void;
  mergeTopBorder?: boolean;
};

export function FellowshipsSubpanelColumn({
  onClose,
  onClearAll,
  mergeTopBorder,
}: FellowshipsSubpanelColumnProps) {
  return (
    <div
      className={`flex max-h-full w-full shrink-0 flex-col overflow-hidden border-l-0 border-r-hairline border-solid border-ink-primary bg-surface-canvas ${
        mergeTopBorder ? "border-t-0" : "border-t-hairline"
      }`}
      role="complementary"
      aria-label="Fellowships filters"
    >
      <SubpanelCloseBar onClose={onClose} />
      <div className="scrollbar-hide min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <FellowshipsDropdownPanel variant="subcolumn" onClearAll={onClearAll} />
      </div>
    </div>
  );
}
