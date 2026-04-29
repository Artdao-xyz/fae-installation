"use client";

import { useFilterSelection } from "../FilterSelectionContext";
import { FilterSidebarCategoryRow } from "../primitives/FilterSidebarCategoryRow";

/** Desktop domain row: clickable toggle; opens no subpanel (behavior wired separately). */
export function FellowshipsMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { selectedDesktopDomainMenuId, toggleDesktopDomainMenuSelection } =
    useFilterSelection();
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
