"use client";

import type { ReactNode } from "react";

export function FilterSidebarSection({
  title,
  titleClassName,
  children,
  onClearAll,
  scrollBody = false,
  bodyMaxClassName,
  collapsed = false,
  /** Mobile right pane: category title + selection tally (no reset). */
  chromeless = false,
  selectionTally,
}: {
  title: string;
  /** Overrides default title sizing (desktop chrome headers use `text-sm`). */
  titleClassName?: string;
  children: ReactNode;
  onClearAll?: () => void;
  scrollBody?: boolean;
  bodyMaxClassName?: string;
  /** Header only; body hidden (e.g. while search is active). */
  collapsed?: boolean;
  chromeless?: boolean;
  /** When `chromeless`, show `selected/total` instead of reset. */
  selectionTally?: { selected: number; total: number };
}) {
  const flexGrow = scrollBody && !collapsed;
  const showClear = onClearAll != null && !collapsed;

  if (chromeless) {
    return (
      <section
        className={`flex min-h-0 flex-col bg-surface-canvas ${
          flexGrow ? "min-h-0 flex-1" : "shrink-0"
        }`}
        aria-label={title}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 px-3 pt-2 pb-1">
          <h2
            className={
              titleClassName ??
              "min-w-0 flex-1 font-lust-text text-sm font-medium text-ink-body"
            }
          >
            {title}
          </h2>
          {selectionTally ? (
            <span className="shrink-0 font-fira-mono text-[10px] font-medium tabular-nums text-ink-caption">
              <span className="text-(--color-filter-pill-selection)">
                {selectionTally.selected}
              </span>
              /{selectionTally.total}
            </span>
          ) : null}
        </header>
        {!collapsed ? (
          <div
            className={[
              "flex flex-wrap content-start gap-1.5 px-3 pb-3 pt-1",
              scrollBody
                ? "scrollbar-hide min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
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

  return (
    <section
      className={`flex flex-col bg-surface-canvas ${
        flexGrow ? "min-h-0 flex-1" : "shrink-0"
      }`}
      aria-label={title}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-t-hairline border-solid border-ink-primary px-3 pb-2 pt-1.5">
        <h2
          className={
            titleClassName ??
            "min-w-0 flex-1 font-lust-text text-sm font-medium text-ink-body"
          }
        >
          {title}
        </h2>
        {showClear ? (
          <button
            type="button"
            onClick={onClearAll}
            className="flex shrink-0 cursor-pointer items-center gap-1 font-fira-mono text-[8px] font-medium leading-2 text-ink-primary underline decoration-solid underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0 tracking-tighter"
          >
            reset
          </button>
        ) : null}
      </header>
      {!collapsed ? (
        <div
          className={[
            "flex flex-wrap content-start gap-1.5 px-3 pb-3 pt-0.5",
            scrollBody
              ? "scrollbar-hide min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
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
