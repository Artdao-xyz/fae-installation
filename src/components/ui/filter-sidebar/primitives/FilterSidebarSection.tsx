"use client";

import type { ReactNode } from "react";
import { FilterSelectionFractionLabel } from "./FilterSelectionFractionLabel";

export function FilterSidebarSection({
  title,
  children,
  onClearAll,
  selectedCount,
  totalCount,
  scrollBody = false,
  bodyMaxClassName,
  collapsed = false,
}: {
  title: string;
  children: ReactNode;
  onClearAll?: () => void;
  /** When set with `totalCount`, mobile shows `n/total` instead of “clear all”. */
  selectedCount?: number;
  totalCount?: number;
  scrollBody?: boolean;
  bodyMaxClassName?: string;
  /** Header only; body hidden (e.g. while search is active). */
  collapsed?: boolean;
}) {
  const flexGrow = scrollBody && !collapsed;
  const showClear = onClearAll != null && !collapsed;
  const showFraction =
    showClear &&
    selectedCount !== undefined &&
    totalCount !== undefined;

  return (
    <section
      className={`flex flex-col border-t-hairline border-solid border-ink-primary bg-surface-canvas ${
        flexGrow ? "min-h-0 max-lg:flex-none lg:flex-1 lg:min-h-0" : "shrink-0"
      }`}
      aria-label={title}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
        <h2 className="min-w-0 flex-1 font-lust-text text-sm font-medium text-ink-body">
          {title}
        </h2>
        {showClear ? (
          <button
            type="button"
            onClick={onClearAll}
            aria-label="Clear all"
            className="flex shrink-0 cursor-pointer items-center gap-1 font-fira-mono font-medium text-ink-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0 max-lg:no-underline lg:text-[8px] lg:leading-2 lg:underline lg:decoration-solid lg:underline-offset-2 lg:tracking-tighter"
          >
            {showFraction ? (
              <>
                <span className="lg:hidden">
                  <FilterSelectionFractionLabel
                    selected={selectedCount}
                    total={totalCount}
                  />
                </span>
                <span className="hidden lg:inline">clear all</span>
              </>
            ) : (
              "clear all"
            )}
          </button>
        ) : null}
      </header>
      {!collapsed ? (
        <div
          className={[
            "flex flex-wrap content-start items-start justify-start gap-1.5 px-3 py-3",
            scrollBody
              ? "scrollbar-hide min-h-0 overflow-x-hidden overflow-y-auto lg:flex-1 max-lg:max-h-none max-lg:flex-none max-lg:overflow-y-visible"
              : "",
            bodyMaxClassName ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
