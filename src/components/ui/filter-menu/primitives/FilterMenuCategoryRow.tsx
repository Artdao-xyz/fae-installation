import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import type { FilterMenuCategoryTone } from "../config/filterMenuTones";
import { toneAccentClass } from "../config/filterMenuTones";

function CategoryRowArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 6 8" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M6 4C6 4 3.98794 4.62867 2.78809 5.42857C1.58824 6.22847 -2.38419e-07 8 -2.38419e-07 8C-2.38419e-07 8 0.941176 5.5623 0.941176 4C0.941176 2.4377 -2.38419e-07 -2.62268e-07 -2.38419e-07 -2.62268e-07C-2.38419e-07 -2.62268e-07 1.3997 1.64584 2.78809 2.57143C4.17647 3.49702 6 4 6 4Z"
      />
    </svg>
  );
}

export function FilterMenuCategoryRow({
  label,
  tone,
  expanded,
  onClick,
}: {
  label: string;
  tone: FilterMenuCategoryTone;
  expanded?: boolean;
  onClick?: () => void;
}) {
  const { glow, marker } = toneAccentClass[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="relative flex w-full items-center gap-2 border-t-[0.5px] border-solid border-text-primary bg-white-fae py-[7px] pl-3 pr-[15px] text-left backdrop-blur-[10px] hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-text-primary"
      data-name="Filters-Button-Dropdown"
    >
      <span
        className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] ${glow}`}
        aria-hidden
        data-name="Glow"
      />
      <CategoryMarkerIcon
        className={`h-[10px] w-[11px] shrink-0 -rotate-90 ${marker}`}
      />
      <span className="min-h-px min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-base font-normal leading-5 text-text-body font-[ui-serif,Georgia,Cambria,Times_New_Roman,serif]">
        {label}
      </span>
      <CategoryRowArrowIcon className={`h-2 w-1.5 shrink-0 ${marker}`} />
    </button>
  );
}
