import type { ReactNode } from "react";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { toneAccentClass } from "../config/filterSidebarTones";
import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import { FilterSelectionFractionLabel } from "./FilterSelectionFractionLabel";

type FilterPillDropdownProps = {
  tone: FilterSidebarCategoryTone;
  onClearAll?: () => void;
  /** When set with `totalCount`, mobile shows `n/total` instead of “clear all”. */
  selectedCount?: number;
  totalCount?: number;
  children: ReactNode;
  variant?: "default" | "subcolumn";
};

export function FilterPillDropdown({
  tone,
  onClearAll,
  selectedCount,
  totalCount,
  children,
  variant = "default",
}: FilterPillDropdownProps) {
  const { glow } = toneAccentClass[tone];
  const isSubcolumn = variant === "subcolumn";
  const showClearAll = isSubcolumn || onClearAll != null;
  const showFraction =
    showClearAll &&
    selectedCount !== undefined &&
    totalCount !== undefined;

  return (
    <div
      className={
        isSubcolumn
          ? "relative flex w-full shrink-0 flex-col justify-start gap-2 bg-surface-canvas px-3 py-3 backdrop-blur-fae-md"
          : "relative flex w-full flex-col justify-start gap-2 border-t-hairline border-r-hairline border-solid border-ink-primary bg-surface-canvas px-3 py-3 backdrop-blur-fae-md"
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
            aria-label="Clear all"
            className="flex shrink-0 cursor-pointer items-center gap-1 font-fira-mono font-medium text-ink-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0 max-lg:no-underline lg:text-[8px] lg:leading-2 lg:underline lg:decoration-solid lg:underline-offset-2 lg:tracking-tighter"
            onClick={() => onClearAll?.()}
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
      <div
        className="flex w-full min-w-0 flex-wrap content-start items-start justify-start gap-1.5"
        data-name="Filters"
      >
        {children}
      </div>
    </div>
  );
}
