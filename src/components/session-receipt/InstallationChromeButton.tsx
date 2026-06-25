"use client";

import type { ReactNode } from "react";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { navSidebarHorizontalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";

type InstallationChromeButtonProps = {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  /** Hairline divider on the left — pair with an adjacent sibling (sidebar action row). */
  divided?: boolean;
  /** Full hairline frame for a lone control (e.g. modal). */
  framed?: boolean;
  /**
   * About / Glossary dock tab styling — horizontal icon + Suisse label.
   * Pass `icon` for the mark icon (e.g. `<PrintSvgIcon />`).
   */
  dock?: boolean;
  icon?: ReactNode;
};

/** Sidebar chrome bar control — matches filter action rows / HomeBar dividers. */
const installationChromeButtonClass =
  "flex min-w-0 items-center justify-center gap-2 bg-surface-canvas font-fira-mono text-[12px] font-normal leading-4 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary";

/** Horizontal dock tab — mirrors About / Glossary tab rails. */
const installationDockButtonClass =
  "flex w-[260px] shrink-0 items-center justify-between gap-2 border-solid border-border bg-surface-canvas/90 px-2.5 py-3 backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary lg:py-0";

export function InstallationChromeButton({
  children,
  onClick,
  className = "",
  autoFocus,
  "aria-label": ariaLabel,
  divided = false,
  framed = false,
  dock = false,
  icon,
}: InstallationChromeButtonProps) {
  const baseClass = dock ? installationDockButtonClass : installationChromeButtonClass;

  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      className={[
        baseClass,
        divided
          ? dock
            ? "border-l-hairline"
            : "border-l-hairline border-solid border-border"
          : "",
        framed ? "border-hairline border-solid border-border" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dock && icon ? (
        <>
          <span className="flex min-w-0 items-center gap-2">
            <span className="shrink-0">{icon}</span>
            <span className={`truncate ${navSidebarHorizontalLabelClassName}`}>
              {children}
            </span>
          </span>
          <OpenSvgIcon className="shrink-0" />
        </>
      ) : (
        children
      )}
    </button>
  );
}
