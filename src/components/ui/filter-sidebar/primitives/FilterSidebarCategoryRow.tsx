import { CategoryMarkerIcon } from "./CategoryMarkerIcon";
import { FilterSidebarDomainTrailing } from "./FilterSidebarDomainTrailing";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";
import {
  categorySubpanelLabelSelectionBgClass,
  domainRowHighlightedBgClass,
  toneAccentClass,
  toneSelectedBorderClass,
} from "../config/filterSidebarTones";
import {
  interactiveChromeHoverClass,
  interactiveChromeMatClass,
} from "./filterFramedClasses";

const matBaseTransitionClass =
  "backdrop-blur-fae-sm transition-colors duration-150 motion-reduce:transition-none";

export type FilterSidebarCategoryAppearance = "chrome" | "domain";

export function FilterSidebarCategoryRow({
  label,
  secondaryLabel,
  labelClassName,
  tone,
  expanded,
  onClick,
  /** A filter in this category’s subpanel is active — highlight the row/label. */
  hasSubpanelSelection,
  /** No CMS options yet — row is inert (cannot expand subpanel). */
  disabled = false,
  /** When false, the expanded-state category marker (SVG) is hidden. */
  showCategoryMarker = true,
  /** When `appearance="domain"`, toolbar row pressed (toggle); does not open subpanels by itself. */
  domainRowSelected = false,
  /** When `appearance="domain"`, compact row (e.g. while filter search is active) like collapsed taxonomy sections. */
  collapsed = false,
  /** `domain`: Fellowships / R&D / FAEBriefings desktop layout (Figma). */
  appearance = "chrome",
  large = false,
}: {
  label: string;
  secondaryLabel?: string;
  labelClassName?: string;
  tone: FilterSidebarCategoryTone;
  expanded?: boolean;
  onClick?: () => void;
  hasSubpanelSelection?: boolean;
  disabled?: boolean;
  showCategoryMarker?: boolean;
  domainRowSelected?: boolean;
  collapsed?: boolean;
  appearance?: FilterSidebarCategoryAppearance;
  large?: boolean;
}) {
  const { glow } = toneAccentClass[tone];
  const showAccent = expanded === true;
  const hasSelection = hasSubpanelSelection === true;

  /** Left stripe + mat: desktop chrome rows only. */
  const showLeftCategoryStripe = appearance === "chrome" && (showAccent || hasSelection);

  if (appearance === "domain") {
    const domainCollapsed = collapsed === true;
    const domainActive =
      domainRowSelected || hasSelection;
    const domainAccentMarker = toneAccentClass[tone].marker;
    const domainBg = disabled
      ? "bg-[#ececec]"
      : domainActive
        ? domainRowHighlightedBgClass[tone]
        : "bg-[#ececec]";
    const domainLabelClass = domainActive ? domainAccentMarker : "text-ink-body";

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        role="radio"
        aria-checked={disabled ? undefined : domainRowSelected}
        data-fae-subpanel-filter-active={hasSelection ? "true" : undefined}
        data-domain-active={domainActive ? "true" : undefined}
        className={`group flex w-full flex-col bg-transparent pt-0 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
          domainCollapsed ? "px-0" : "px-4"
        } ${
          disabled
            ? "cursor-not-allowed opacity-45 motion-reduce:opacity-50"
            : "cursor-pointer"
        }`}
        data-name="Filters-Domain-Row"
      >
        <div
          className={`flex min-w-0 flex-col border-t border-dotted border-border backdrop-blur-fae-sm transition-colors duration-150 motion-reduce:transition-none ${
            domainCollapsed ? "pt-1.5 pb-2" : "pt-4 pb-5"
          } ${domainBg}`}
        >
          <div
            className={`flex w-full min-w-0 ${domainCollapsed ? "justify-start pl-3 pr-0" : "justify-center px-1"}`}
          >
            <div className="inline-flex max-w-full min-w-0 items-center gap-1">
              {showCategoryMarker ? (
                <CategoryMarkerIcon
                  tone={tone}
                  className={`${domainCollapsed ? "size-4" : "size-5"} shrink-0 object-contain`}
                />
              ) : (
                <span
                  className={domainCollapsed ? "size-4 shrink-0" : "size-5 shrink-0"}
                  aria-hidden
                />
              )}
              <span
                className={`min-w-0 shrink truncate ${labelClassName ?? "font-lust-text"} text-[14px] leading-5 ${domainLabelClass}`}
              >
                {label}
              </span>
              {!disabled ? (
                <FilterSidebarDomainTrailing
                  tone={tone}
                  compact={domainCollapsed}
                />
              ) : (
                <span
                  className={domainCollapsed ? "size-5 shrink-0" : "size-6 shrink-0"}
                  aria-hidden
                />
              )}
            </div>
          </div>
        </div>
      </button>
    );
  }

  const matClass = hasSelection
    ? `${matBaseTransitionClass} ${categorySubpanelLabelSelectionBgClass[tone]}`
    : interactiveChromeMatClass;
  const hoverClass = hasSelection
    ? "hover:brightness-[0.96] motion-reduce:hover:brightness-100"
    : interactiveChromeHoverClass;
  const hasSecondaryLabel = Boolean(secondaryLabel && secondaryLabel.trim().length > 0);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      aria-expanded={disabled ? undefined : expanded}
      aria-disabled={disabled ? true : undefined}
      data-fae-subpanel-filter-active={hasSelection ? "true" : undefined}
      className={`relative flex w-full gap-2 border-t-hairline border-solid border-border pl-3 pr-[15px] text-left ${hasSecondaryLabel ? "items-start" : "items-center"} ${large ? "py-3" : "py-[7px]"} ${matClass} ${
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
      {showAccent && showCategoryMarker ? (
        <CategoryMarkerIcon
          tone={tone}
          className="size-5 shrink-0 object-contain"
        />
      ) : null}
      <span className="min-h-px min-w-0 flex-1">
        <span
          className={`block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-base leading-5 text-ink-body ${labelClassName ?? "font-lust-text"}`}
        >
          {label}
        </span>
        {hasSecondaryLabel ? (
          <span
            className={`mt-1 flex w-full min-w-0 items-center justify-center border-hairline border-dotted bg-surface-canvas px-2.5 py-[5px] font-fira-mono text-[12px] font-normal leading-4 ${toneSelectedBorderClass[tone]} ${toneAccentClass[tone].marker}`}
          >
            <span className="block min-w-0 truncate text-center">{secondaryLabel}</span>
          </span>
        ) : null}
      </span>
      {onClick && !disabled ? (
        // eslint-disable-next-line @next/next/no-img-element -- same asset as HomeBar breadcrumb; file uses black fill
        <img
          src="/svg/right-arrow.svg"
          alt=""
          width={8}
          height={10}
          className="block h-2.5 w-2 max-h-2.5 max-w-2 shrink-0 object-contain"
          style={hasSecondaryLabel ? { marginTop: "0.35rem" } : undefined}
          aria-hidden
        />
      ) : null}
    </button>
  );
}
