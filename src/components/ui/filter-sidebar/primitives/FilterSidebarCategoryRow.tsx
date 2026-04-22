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
      className="relative flex w-full items-center gap-2 border-t-hairline border-solid border-ink-primary bg-surface-canvas py-[7px] pl-3 pr-[15px] text-left backdrop-blur-fae-sm hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
      data-name="Filters-Button-Dropdown"
    >
      {showAccent ? (
        <span
          className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] ${glow}`}
          aria-hidden
          data-name="Glow"
        />
      ) : null}
      {showAccent ? (
        <CategoryMarkerIcon
          tone={tone}
          className="size-5 shrink-0 object-contain"
        />
      ) : null}
      <span className="min-h-px min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-base leading-5 text-ink-body font-lust-text">
        {label}
      </span>
      {onClick ? (
        // eslint-disable-next-line @next/next/no-img-element -- same asset as HomeBar breadcrumb; file uses black fill
        <img
          src="/svg/right-arrow.svg"
          alt=""
          width={8}
          height={10}
          className="block h-2.5 w-2 max-h-2.5 max-w-2 shrink-0 object-contain"
          aria-hidden
        />
      ) : null}
    </button>
  );
}
