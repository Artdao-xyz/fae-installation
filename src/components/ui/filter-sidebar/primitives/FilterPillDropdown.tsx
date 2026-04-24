import type { ReactNode } from "react";
import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { toneAccentClass } from "../config/filterSidebarTones";

export type FilterPillDropdownMobileHeader = {
  title: string;
  selectedCount: number;
  totalCount: number;
};

type FilterPillDropdownProps = {
  tone: FilterSidebarCategoryTone;
  onClearAll?: () => void;
  children: ReactNode;
  variant?: "default" | "subcolumn";
  /** Mobile filter pane: category title + `n/total`, no marker / reset / left stripe. */
  mobileHeader?: FilterPillDropdownMobileHeader;
};

export function FilterPillDropdown({
  tone,
  onClearAll,
  children,
  variant = "default",
  mobileHeader,
}: FilterPillDropdownProps) {
  const { glow } = toneAccentClass[tone];
  const isSubcolumn = variant === "subcolumn";
  const showClearAll =
    mobileHeader == null && (isSubcolumn || onClearAll != null);
  const showLeftStripe = mobileHeader == null;

  return (
    <div
      className={
        isSubcolumn
          ? "relative flex w-full shrink-0 flex-col gap-2 self-start bg-surface-canvas px-3 py-2 backdrop-blur-fae-md"
          : "relative flex w-full flex-col gap-2 border-t-hairline border-r-hairline border-solid border-ink-primary bg-surface-canvas px-3 py-3 backdrop-blur-fae-md"
      }
      data-name="Dropdown - Category/Selected"
    >
      {showLeftStripe ? (
        <span
          className={`pointer-events-none absolute left-0 w-[3px] ${isSubcolumn ? "inset-y-0" : "inset-y-[-0.5px]"} ${glow}`}
          aria-hidden
          data-name="Glow"
        />
      ) : null}
      {mobileHeader != null ? (
        <header className="flex w-full shrink-0 items-center justify-between gap-2">
          <h2 className="min-w-0 flex-1 font-lust-text text-sm font-medium text-ink-body">
            {mobileHeader.title}
          </h2>
          <span className="shrink-0 font-fira-mono text-[10px] font-medium tabular-nums text-ink-caption">
            {mobileHeader.selectedCount}/{mobileHeader.totalCount}
          </span>
        </header>
      ) : (
        <header className="flex w-full shrink-0 items-center justify-between gap-2">
          <CategoryMarkerIcon
            tone={tone}
            className="size-5 shrink-0 object-contain"
          />
          {showClearAll ? (
            <button
              type="button"
              className={`flex shrink-0 cursor-pointer items-center gap-1 font-fira-mono text-[8px] font-medium leading-2 underline decoration-solid underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0 text-ink-primary tracking-tighter`}
              onClick={() => onClearAll?.()}
            >
              reset
            </button>
          ) : null}
        </header>
      )}
      <div
        className="flex w-full flex-wrap content-start items-start gap-1.5"
        data-name="Filters"
      >
        {children}
      </div>
    </div>
  );
}
