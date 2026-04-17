import type { ReactNode } from "react";
import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { toneAccentClass } from "../config/filterSidebarTones";

type FilterPillDropdownProps = {
  tone: FilterSidebarCategoryTone;
  onClearAll?: () => void;
  children: ReactNode;
  variant?: "default" | "subcolumn";
};

export function FilterPillDropdown({
  tone,
  onClearAll,
  children,
  variant = "default",
}: FilterPillDropdownProps) {
  const { glow } = toneAccentClass[tone];
  const isSubcolumn = variant === "subcolumn";
  const showClearAll = isSubcolumn || onClearAll != null;

  return (
    <div
      className={
        isSubcolumn
          ? "relative flex w-full shrink-0 flex-col gap-2 bg-surface-canvas px-3 py-3 backdrop-blur-fae-md"
          : "relative flex w-full flex-col gap-2 border-t-hairline border-r-hairline border-solid border-ink-primary bg-surface-canvas px-3 py-3 backdrop-blur-fae-md"
      }
      data-name="Dropdown - Category/Selected"
    >
      <span
        className={`pointer-events-none absolute left-0 w-[3px] ${isSubcolumn ? "inset-y-0" : "inset-y-[-0.5px]"} ${glow}`}
        aria-hidden
        data-name="Glow"
      />
      <header className="flex w-full shrink-0 items-center justify-between gap-2">
        <CategoryMarkerIcon
          tone={tone}
          className="size-4 shrink-0 object-contain"
        />
        {showClearAll ? (
          <button
            type="button"
            className={`flex shrink-0 cursor-pointer items-center gap-1 font-fira-mono text-[8px] font-medium leading-2 underline decoration-solid underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0 text-ink-primary tracking-tighter`}
            onClick={() => onClearAll?.()}
          >
            clear all
          </button>
        ) : null}
      </header>
      <div
        className="flex w-full flex-wrap content-start items-start"
        data-name="Filters"
      >
        {children}
      </div>
    </div>
  );
}
