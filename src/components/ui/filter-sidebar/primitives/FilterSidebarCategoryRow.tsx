import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import { toneAccentClass } from "../config/filterSidebarTones";

export function FilterSidebarCategoryRow({
  label,
  tone,
  expanded,
  onClick,
}: {
  label: string;
  tone: FilterSidebarCategoryTone;
  expanded?: boolean;
  onClick?: () => void;
}) {
  const { glow } = toneAccentClass[tone];
  const showAccent = expanded === true;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="relative flex w-full flex-col items-stretch border-t-hairline border-r-hairline border-solid border-ink-primary bg-surface-canvas text-left backdrop-blur-fae-sm hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
      data-name="Filters-Button-Dropdown"
    >
      {showAccent ? (
        <span
          className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] ${glow}`}
          aria-hidden
          data-name="Glow"
        />
      ) : null}
      <span className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col flex-wrap items-start content-start justify-center gap-[5px] px-2.5 py-3">
        <CategoryMarkerIcon
          tone={tone}
          className={`h-[14px] w-[14px] shrink-0 object-contain ${showAccent ? "opacity-100" : "opacity-50"}`}
        />
        <span className="w-full min-w-0 wrap-break-word text-left font-lust-text text-sm leading-[18px] tracking-[0.5px] text-ink-body">
          {label}
        </span>
      </span>
    </button>
  );
}
