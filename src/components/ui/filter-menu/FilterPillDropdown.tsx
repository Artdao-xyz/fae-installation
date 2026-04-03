import { FilterX } from "lucide-react";
import type { ReactNode } from "react";
import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import type { FilterMenuCategoryTone } from "./filterMenuTones";
import { toneAccentClass } from "./filterMenuTones";

type FilterPillDropdownProps = {
  tone: FilterMenuCategoryTone;
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
  const { glow, marker } = toneAccentClass[tone];
  const isSubcolumn = variant === "subcolumn";
  const showClearAll = isSubcolumn || onClearAll != null;

  return (
    <div
      className={
        isSubcolumn
          ? "relative flex w-full shrink-0 flex-col gap-2 bg-white-fae px-3 py-3 backdrop-blur-[25px]"
          : "relative flex w-full flex-col gap-2 border-t-[0.5px] border-r-[0.5px] border-t-[0.5px] border-solid border-text-primary bg-white-fae px-3 py-3 backdrop-blur-[25px]"
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
          className={`h-[11px] w-[10px] shrink-0 -rotate-90 ${marker}`}
        />
        {showClearAll ? (
          <button
            type="button"
            className={`flex shrink-0 cursor-pointer items-center gap-1 font-mono text-[8px] font-medium leading-2 underline decoration-solid underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary focus-visible:ring-offset-0 text-text-primary`}
            onClick={() => onClearAll?.()}
          >
            clear all
          </button>
        ) : null}
      </header>
      <div
        className="flex w-full flex-wrap content-start items-start gap-[5px]"
        data-name="Filters"
      >
        {children}
      </div>
    </div>
  );
}
