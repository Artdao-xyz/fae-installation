"use client";

import type { ReactNode } from "react";

export function FilterSidebarSection({
  title,
  children,
  onClearAll,
  scrollBody = false,
  bodyMaxClassName,
}: {
  title: string;
  children: ReactNode;
  onClearAll?: () => void;
  scrollBody?: boolean;
  bodyMaxClassName?: string;
}) {
  return (
    <section
      className={`flex flex-col border-t-hairline border-solid border-ink-primary bg-surface-canvas ${
        scrollBody ? "min-h-0 flex-1" : "shrink-0"
      }`}
      aria-label={title}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
        <h2 className="min-w-0 flex-1 font-lust-text text-sm font-normal text-ink-body">
          {title}
        </h2>
        {onClearAll ? (
          <button
            type="button"
            onClick={onClearAll}
            className="flex shrink-0 cursor-pointer items-center gap-1 font-fira-mono text-[8px] font-medium leading-2 text-ink-primary underline decoration-solid underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0"
          >
            clear all
          </button>
        ) : null}
      </header>
      <div
        className={[
          "flex flex-wrap content-start gap-[5px] px-3 py-3",
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
    </section>
  );
}
