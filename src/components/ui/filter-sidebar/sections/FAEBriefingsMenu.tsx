"use client";

import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";
import { MobileLandingDomainButton } from "../primitives/MobileLandingDomainButton";

/** Desktop domain row: clickable toggle; opens no subpanel (behavior wired separately). */
export function FAEBriefingsMenu({
  collapsed = false,
  mobileLanding = false,
}: {
  collapsed?: boolean;
  mobileLanding?: boolean;
}) {
  const {
    selectedFaeBriefing,
    selectedDesktopDomainMenuId,
    toggleDesktopDomainMenuSelection,
  } = useFilterSelection();

  if (mobileLanding) {
    return (
      <MobileLandingDomainButton
        label="FAE Briefings"
        tone="fae-briefings"
        compact={collapsed}
      />
    );
  }

  return (
    <FilterSidebarCategoryRow
      label="FAE Briefings"
      tone="fae-briefings"
      appearance="domain"
      collapsed={collapsed}
      domainRowSelected={selectedDesktopDomainMenuId === "briefings"}
      onClick={() => toggleDesktopDomainMenuSelection("briefings")}
      hasSubpanelSelection={selectedFaeBriefing != null}
    />
  );
}
