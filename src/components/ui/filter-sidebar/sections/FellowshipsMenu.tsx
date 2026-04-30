"use client";

import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";
import { MobileLandingDomainButton } from "../primitives/MobileLandingDomainButton";

/** Desktop domain row: clickable toggle; opens no subpanel (behavior wired separately). */
export function FellowshipsMenu({
  collapsed = false,
  mobileLanding = false,
}: {
  collapsed?: boolean;
  mobileLanding?: boolean;
}) {
  const { selectedDesktopDomainMenuId, toggleDesktopDomainMenuSelection } =
    useFilterSelection();

  if (mobileLanding) {
    return (
      <MobileLandingDomainButton
        label="Fellowships"
        tone="latest-updates"
        compact={collapsed}
        selected={selectedDesktopDomainMenuId === "fellowships"}
        onPress={() => toggleDesktopDomainMenuSelection("fellowships")}
      />
    );
  }

  return (
    <FilterSidebarCategoryRow
      label="Fellowships"
      tone="latest-updates"
      appearance="domain"
      collapsed={collapsed}
      domainRowSelected={selectedDesktopDomainMenuId === "fellowships"}
      onClick={() => toggleDesktopDomainMenuSelection("fellowships")}
    />
  );
}
