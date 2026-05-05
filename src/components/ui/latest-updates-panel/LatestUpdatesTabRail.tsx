"use client";

import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { LatestUpdatesSvgIcon } from "@/components/ui/icons/LatestUpdatesSvgIcon";
import { navSidebarVerticalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";

type LatestUpdatesTabRailProps = {
  arrowClassName?: string;
  onClick: () => void;
  ariaExpanded: boolean;
  ariaControls: string;
  className?: string;
  /**
   * `desktop`: bottom hairline (dock sits on page chrome).
   * `mobileStrip`: top hairline only so the row’s bottom edge is a single shared line with Filters.
   */
  railLayout?: "desktop" | "mobileStrip";
};

export function LatestUpdatesTabRail({
  arrowClassName,
  onClick,
  ariaExpanded,
  ariaControls,
  className = "",
  railLayout = "desktop",
}: LatestUpdatesTabRailProps) {
  const edgeClass =
    railLayout === "mobileStrip"
      ? "border-t-hairline border-b-0 border-solid border-border"
      : "border-b-hairline border-t-0 border-solid border-border";

  return (
    <button
      type="button"
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      className={`flex min-h-0 w-filter-narrow-column shrink-0 flex-col items-center justify-between self-stretch bg-surface-canvas/90 px-0.5 py-2.5 backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary max-lg:py-1.5 ${edgeClass} ${
        ariaExpanded || railLayout === "mobileStrip" ? "border-r-hairline" : ""
      } ${className}`}
    >
      <OpenSvgIcon
        className={`shrink-0 ${arrowClassName ?? ""} transition-transform duration-500 ease-in-out motion-reduce:transition-none ${
          ariaExpanded ? "rotate-180" : ""
        }`}
      />
      <div className="flex shrink-0 flex-col items-center gap-2 max-lg:gap-1">
        <span className={navSidebarVerticalLabelClassName}>Latest Updates</span>
        <LatestUpdatesSvgIcon
          className={railLayout === "mobileStrip" ? "size-6!" : ""}
        />
      </div>
    </button>
  );
}
