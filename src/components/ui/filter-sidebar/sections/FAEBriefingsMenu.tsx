"use client";

import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

/** Desktop domain row: clickable toggle; opens no subpanel (behavior wired separately). */
export function FAEBriefingsMenu({ collapsed = false }: { collapsed?: boolean }) {
  const {
    selectedFaeBriefing,
    selectedDesktopDomainMenuId,
    toggleDesktopDomainMenuSelection,
  } = useFilterSelection();
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
