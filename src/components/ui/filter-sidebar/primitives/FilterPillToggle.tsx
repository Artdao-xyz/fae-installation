import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import {
  toneAccentClass,
  toneSelectedBorderClass,
} from "../config/filterSidebarTones";

type FilterPillToggleProps = {
  label: string;
  tone?: FilterSidebarCategoryTone;
  selected?: boolean;
  onClick?: () => void;
};

export function FilterPillToggle({
  label,
  tone = "fae-briefings",
  selected = false,
  onClick,
}: FilterPillToggleProps) {
  const { marker } = toneAccentClass[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      role={onClick ? "radio" : undefined}
      aria-checked={onClick ? selected : undefined}
      className={`flex shrink-0 flex-col items-start justify-center border-fine border-dashed bg-surface-canvas/80 backdrop-blur-fae-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary ${
        selected ? toneSelectedBorderClass[tone] : "border-ink-primary"
      }`}
      data-name="Filters-Button-Toggle"
    >
      <span className="flex items-center justify-center rounded-full px-2 py-[5px]">
        <span
          className={`whitespace-nowrap font-fira-mono text-[10px] font-normal leading-[14px] ${
            selected ? marker : "text-ink-primary"
          }`}
        >
          {label}
        </span>
      </span>
    </button>
  );
}
