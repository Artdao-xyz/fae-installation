import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import {
  categorySubpanelLabelSelectionBgClass,
  toneAccentClass,
} from "../config/filterSidebarTones";
import {
  interactiveChromeHoverClass,
  interactiveChromeMatClass,
} from "./filterFramedClasses";

const matBaseTransitionClass =
  "backdrop-blur-fae-sm transition-colors duration-150 motion-reduce:transition-none";

export function FilterSidebarCategoryRow({
  label,
  tone,
  expanded,
  onClick,
  /** A filter in this category’s subpanel is active — highlight the row/label. */
  hasSubpanelSelection,
  /** No CMS options yet — row is inert (cannot expand subpanel). */
  disabled = false,
}: {
  label: string;
  tone: FilterSidebarCategoryTone;
  expanded?: boolean;
  onClick?: () => void;
  hasSubpanelSelection?: boolean;
  disabled?: boolean;
}) {
  const { glow } = toneAccentClass[tone];
  const showAccent = expanded === true;
  const hasSelection = hasSubpanelSelection === true;
  /** Left stripe: open subpanel, or a filter in this subpanel is active (clear category cue). */
  const showLeftCategoryStripe = showAccent || hasSelection;
  const matClass = hasSelection
    ? `${matBaseTransitionClass} ${categorySubpanelLabelSelectionBgClass[tone]}`
    : interactiveChromeMatClass;
  const hoverClass = hasSelection
    ? "hover:brightness-[0.96] motion-reduce:hover:brightness-100"
    : interactiveChromeHoverClass;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      aria-expanded={disabled ? undefined : expanded}
      aria-disabled={disabled ? true : undefined}
      data-fae-subpanel-filter-active={hasSelection ? "true" : undefined}
      className={`relative flex w-full items-center gap-2 border-t-hairline border-solid border-ink-primary py-[7px] pl-3 pr-[15px] text-left ${matClass} ${
        disabled
          ? "cursor-not-allowed opacity-45 motion-reduce:opacity-50"
          : hoverClass
      } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary`}
      data-name="Filters-Button-Dropdown"
    >
      {showLeftCategoryStripe ? (
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
      {onClick && !disabled ? (
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
