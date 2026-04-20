import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { toneAccentClass } from "../config/filterSidebarTones";

export function FilterSidebarCategoryRow({
  label,
  tone,
  expanded,
  onClick,
  /** Mobile-only: fixed-share rail grid cell — dense row, no intrinsic min-height overflow. */
  mobileFillCell,
}: {
  label: string;
  tone: FilterSidebarCategoryTone;
  expanded?: boolean;
  onClick?: () => void;
  mobileFillCell?: boolean;
}) {
  const { glow } = toneAccentClass[tone];
  const showAccent = expanded === true;
  const fill = mobileFillCell === true;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={`relative flex w-full items-stretch border-t-hairline border-r-hairline border-solid border-ink-primary bg-surface-canvas text-left backdrop-blur-fae-sm hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary lg:border-r-0 ${
        fill
          ? "box-border h-full max-h-full min-h-0 flex-col overflow-hidden"
          : "flex-col"
      }`}
      data-name="Filters-Button-Dropdown"
    >
      {showAccent ? (
        <span
          className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] ${glow}`}
          aria-hidden
          data-name="Glow"
        />
      ) : null}
      <span
        className={
          fill
            ? "relative flex min-h-0 w-full min-w-0 flex-1 flex-col content-start items-start justify-center gap-1.5 overflow-hidden px-2.5 py-1.5"
            : "relative flex min-h-0 w-full min-w-0 flex-1 flex-col flex-wrap items-start content-start justify-center gap-[5px] px-2.5 py-3 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-start lg:gap-2"
        }
      >
        <CategoryMarkerIcon
          tone={tone}
          className={`shrink-0 object-contain ${fill ? "h-4 w-4" : `h-[14px] w-[14px] lg:h-[18px] lg:w-[18px]`} ${showAccent ? "opacity-100" : "opacity-50"}`}
        />
        <span
          className={`min-w-0 text-left font-lust-text tracking-[0.5px] text-ink-body ${
            fill
              ? "line-clamp-4 w-full text-[12px] leading-[15px]"
              : "w-full wrap-break-word text-sm leading-[18px] lg:w-auto lg:flex-1"
          }`}
        >
          {label}
        </span>
      </span>
    </button>
  );
}
