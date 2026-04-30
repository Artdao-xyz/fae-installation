"use client";

import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";
import { MobileLandingDomainButton } from "../primitives/MobileLandingDomainButton";

/** Desktop domain row: clickable toggle; opens no subpanel (behavior wired separately). */
export function RDProjectsMenu({
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
        label="R&D Projects"
        tone="rd"
        compact={collapsed}
        selected={selectedDesktopDomainMenuId === "rd"}
        onPress={() => toggleDesktopDomainMenuSelection("rd")}
      />
    );
  }

  return (
    <FilterSidebarCategoryRow
      label="R&D Projects"
      tone="rd"
      appearance="domain"
      collapsed={collapsed}
      domainRowSelected={selectedDesktopDomainMenuId === "rd"}
      onClick={() => toggleDesktopDomainMenuSelection("rd")}
    />
  );
}
