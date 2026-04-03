import type { FilterMenuCategoryTone } from "../config/filterMenuTones";
import { toneAccentClass, toneSelectedBorderClass } from "../config/filterMenuTones";

type FilterPillToggleProps = {
  label: string;
  tone?: FilterMenuCategoryTone;
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
      className={`flex shrink-0 flex-col items-start justify-center border-[0.3px] border-dashed bg-white-fae/80 backdrop-blur-[25px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary ${
        selected ? toneSelectedBorderClass[tone] : "border-text-primary"
      }`}
      data-name="Filters-Button-Toggle"
    >
      <span className="flex items-center justify-center rounded-full px-2 py-[5px]">
        <span
          className={`whitespace-nowrap font-mono text-[10px] font-normal leading-[14px] ${
            selected ? marker : "text-text-primary"
          }`}
        >
          {label}
        </span>
      </span>
    </button>
  );
}
