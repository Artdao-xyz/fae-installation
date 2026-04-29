"use client";

import { SubpanelCloseBar } from "../../shell/SubpanelCloseBar";
import { ARTISTS_NETWORK_SUBPANEL_SCROLL_BODY_CLASS } from "../../shell/layout-classes";
import { ArtistsDropdownPanel } from "./ArtistsDropdownPanel";

type ArtistsSubpanelColumnProps = {
  onClose: () => void;
  onClearAll?: () => void;
  mergeTopBorder?: boolean;
};

export function ArtistsSubpanelColumn({
  onClose,
  onClearAll,
  mergeTopBorder,
}: ArtistsSubpanelColumnProps) {
  return (
    <div
      className={`flex w-full flex-none flex-col overflow-hidden border-l-0 border-r-hairline border-solid border-ink-primary bg-surface-canvas ${
        mergeTopBorder ? "border-t-0" : "border-t-hairline"
      }`}
      role="complementary"
      aria-label="Artists filters"
    >
      <SubpanelCloseBar onClose={onClose} />
      <div className={ARTISTS_NETWORK_SUBPANEL_SCROLL_BODY_CLASS}>
        <ArtistsDropdownPanel variant="subcolumn" onClearAll={onClearAll} />
      </div>
    </div>
  );
}
