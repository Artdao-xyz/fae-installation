"use client";

import { FilterX } from "lucide-react";
import type { ReactNode } from "react";

export function FilterMenuSection({
  title,
  children,
  onClearAll,
  scrollBody = false,
  bodyMaxClassName = "max-h-[min(28dvh,260px)]",
}: {
  title: string;
  children: ReactNode;
  onClearAll?: () => void;
  /** Focus / Activity: pills area scrolls; header stays fixed. */
  scrollBody?: boolean;
  bodyMaxClassName?: string;
}) {
  return (
    <section
      className="shrink-0 border-t-[0.5px] border-solid border-text-primary bg-white-fae"
      aria-label={title}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
        <h2 className="min-w-0 flex-1 font-[ui-serif,Georgia,Cambria,Times_New_Roman,serif] text-sm font-normal text-text-body">
          {title}
        </h2>
        {onClearAll ? (
          <button
            type="button"
            onClick={onClearAll}
            className="flex shrink-0 cursor-pointer items-center gap-1 font-mono text-[8px] font-medium leading-2 text-text-primary underline decoration-solid underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary focus-visible:ring-offset-0"
          >
            clear all
          </button>
        ) : null}
      </header>
      <div
        className={`flex flex-wrap gap-[5px] px-3 py-3 ${
          scrollBody
            ? `scrollbar-hide min-h-0 overflow-x-hidden overflow-y-auto ${bodyMaxClassName}`
            : ""
        }`}
      >
        {children}
      </div>
    </section>
  );
}
