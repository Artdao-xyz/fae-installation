"use client";

import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

type SubscribeMenuProps = {
  subpanelOpen: boolean;
  onToggleSubpanel: () => void;
};

export function SubscribeMenu({ subpanelOpen, onToggleSubpanel }: SubscribeMenuProps) {
  return (
    <FilterSidebarCategoryRow
      label="Subscribe"
      labelClassName="font-suisseintl text-xs"
      tone="subscribe"
      expanded={subpanelOpen}
      onClick={onToggleSubpanel}
      showCategoryMarker={false}
      leadingIconSrc="/svg/subscribe.svg"
      trailingIconSrc="/svg/open.svg"
      trailingIconClassName="-rotate-90 h-3 w-3 max-h-3 max-w-3"
      trailingIconExpandedClassName="rotate-90"
      className="border-r-hairline border-r-solid border-border"
      showLeftAccentStripe={false}
    />
  );
}
